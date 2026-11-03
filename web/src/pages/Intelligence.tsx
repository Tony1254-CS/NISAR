import { AlertTriangle, ArrowRight, BrainCircuit, Check, CircleHelp, ExternalLink, Radio, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { loadReachBundle, type ReachBundle } from '../data/load';
import type { QCCheck } from '../data/types';
import { useStore } from '../state/store';
import { confusionMatrix, createSyntheticSamples, DEMO_CLASSES, permutationImportance, splitSyntheticSamples, trainSyntheticForest, type DemoClass, type DemoClassifier, type SarFeatures, type SarSample } from './sarForestDemo';
import { trainTemporalMlp, type LossPoint } from './temporalMlpDemo';
import '../styles/globe.css';
import './intelligence.css';

const CLASS_COLORS: Record<DemoClass, string> = {
  'Stable land': '#56c8d8', 'Open water': '#7588ff', 'Seasonal inundation': '#e7b45d', 'Persistent transition candidate': '#ef745c',
};
const QC_STATUS: Record<QCCheck['status'], string> = { PASS: 'Pass', WARN: 'Review', FAIL: 'Fail', NOT_EVALUATED: 'Not evaluated', INFO: 'Context' };
function fmt(value: number, digits = 1) { return new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(value); }
function utcDate(value: string) { return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)); }

function getPrediction(model: DemoClassifier, features: SarFeatures) {
  const scores = model.predict(features);
  const label = DEMO_CLASSES.reduce((winner, current) => scores[current] > scores[winner] ? current : winner, DEMO_CLASSES[0]);
  return { scores, label };
}

function scoreEntropy(scores: Record<DemoClass, number>) {
  const entropy = DEMO_CLASSES.reduce((sum, label) => sum - (scores[label] > 0 ? scores[label] * Math.log(scores[label]) : 0), 0);
  return entropy / Math.log(DEMO_CLASSES.length);
}

type ScenePerturbation = { eventDb: number; stageShift: number; persistenceShift: number };
function perturb(features: SarFeatures, scene: ScenePerturbation): SarFeatures {
  return [features[0], Math.max(-28,Math.min(-2,features[1]+scene.eventDb)), Math.max(0,Math.min(1,features[2]+scene.stageShift)), Math.max(0,Math.min(1,features[3]+scene.persistenceShift))];
}

function SceneControls({ scene, onChange }: { scene: ScenePerturbation; onChange: (next: ScenePerturbation) => void }) {
  const controls:[keyof ScenePerturbation,string,number,number,number,string][]=[
    ['eventDb','Scene-wide T1 backscatter offset',-6,6,.1,' dB'],
    ['stageShift','Stage-difference shift',-.4,.4,.01,''],
    ['persistenceShift','Later-water persistence shift',-.5,.5,.01,''],
  ];
  return <section className="ml-panel ml-scene-controls"><div className="ml-panel-head"><div><span className="ml-overline">SCENE-LEVEL WHAT-IF CONTROLS</span><h2>Perturb the whole scenario tile</h2></div><span className="ml-live-dot">MAP + MODEL UPDATE</span></div><p className="ml-panel-desc">Apply controlled offsets to every generated pixel. These are scenario perturbations, not environmental measurements or forecasts.</p><div className="ml-scene-control-grid">{controls.map(([key,label,min,max,step,suffix])=><label className="ml-slider" key={key}><span><b>{label}</b><output>{scene[key].toFixed(key==='eventDb'?1:2)}{suffix}</output></span><input type="range" min={min} max={max} step={step} value={scene[key]} onChange={(event)=>onChange({...scene,[key]:Number(event.target.value)})}/></label>)}</div></section>;
}

function ScenarioCube({ samples, model, modelName, selected, onSelect, scene }: { samples: SarSample[]; model: DemoClassifier; modelName: string; selected: SarFeatures; onSelect: (features: SarFeatures) => void; scene: ScenePerturbation }) {
  const columns=26, rows=13;
  const cells=Array.from({length:columns*rows},(_,index)=>{
    const column=index%columns, row=Math.floor(index/columns);
    const center=6.2+1.65*Math.sin(column*.25)+.65*Math.sin(column*.72);
    const distance=Math.abs(row-center);
    let target:DemoClass='Stable land';
    if(distance<1.05)target='Open water';
    else if(distance<2.05){const transition=(column>=7&&column<=13&&row<center)||(column>=18&&column<=23&&row>center);target=transition?'Persistent transition candidate':'Seasonal inundation';}
    const candidates=samples.filter((sample)=>sample.y===target);
    const sample=candidates[index%candidates.length]??samples[index%samples.length];
    const features=perturb(sample.x,scene);
    const prediction=getPrediction(model,features);
    return {column,row,sample,features,target,prediction,entropy:scoreEntropy(prediction.scores)};
  });
  const frame=(kind:'t0'|'t1'|'t2'|'class'|'entropy',title:string)=><article className="ml-cube-frame" key={kind}><div className="ml-cube-frame-head"><b>{title}</b><span>{kind==='class'?modelName:kind==='entropy'?'normalized class-score entropy':kind.toUpperCase()}</span></div><svg viewBox="0 0 390 230" role="img" aria-label={`${title}, schematic generated scenario visualization`}><rect x="4" y="4" width="382" height="210" rx="7" fill="#0c151e" stroke="rgba(132,191,204,.2)"/><path d="M9 161 C74 122 112 163 168 132 S264 94 300 126 354 153 381 106" fill="none" stroke="rgba(58,95,147,.14)" strokeWidth="38"/>{cells.map((cell,index)=>{const db=kind==='t0'?cell.features[0]:kind==='t1'?cell.features[1]:cell.features[0]*(1-cell.features[3])+cell.features[1]*cell.features[3];const intensity=Math.max(.08,Math.min(.92,.12+(db+25)/25*.78));const isSelected=cell.features.every((v,i)=>Math.abs(v-selected[i])<.001);const color=kind==='class'?CLASS_COLORS[cell.prediction.label]:kind==='entropy'?`hsl(${Math.round(212-cell.entropy*130)} 82% ${Math.round(30+cell.entropy*34)}%)`:`hsl(190 45% ${Math.round(12+intensity*56)}%)`;return <rect key={index} x={9+cell.column*14.25} y={9+cell.row*15.4} width="12.2" height="13.2" rx="1.2" fill={color} opacity={kind==='entropy'?.35+cell.entropy*.65:.78} stroke={isSelected?'#fff':kind==='class'&&cell.prediction.label!==cell.target?'#f0d28b':'rgba(7,12,17,.7)'} strokeWidth={isSelected?2:kind==='class'&&cell.prediction.label!==cell.target?1.2:.45} role="button" tabIndex={0} aria-label={`Generated pixel: ${kind==='class'?`reference ${cell.target}, prediction ${cell.prediction.label}`:kind==='entropy'?`normalized score entropy ${cell.entropy.toFixed(2)}`:`HH backscatter ${db.toFixed(1)} decibels`}. Select pixel`} onClick={()=>onSelect(cell.sample.x)} onKeyDown={(event)=>{if(event.key==='Enter'||event.key===' ')onSelect(cell.sample.x);}}/>;})}<text x="11" y="226" className="ml-tile-label">{kind==='class'?'GOLD OUTLINE = LABEL / OUTPUT DIFFER':kind==='entropy'?'BRIGHTER = MORE CLASS-SCORE SPREAD':'LOW RETURN ← HH BACKSCATTER → HIGH RETURN'}</text></svg></article>;
  return <section className="ml-panel ml-tile-panel"><div className="ml-panel-head"><div><span className="ml-overline">SCENARIO INPUT STACK / INFERENCE OUTPUT</span><h2>Follow a pixel through the model</h2></div><span className="ml-live-dot">CLICK ANY PIXEL</span></div><p className="ml-panel-desc">A schematic braided-channel layout links three generated HH observations to {modelName} outputs. It is not a geolocated NISAR image. Gold outlines mark disagreement with the scenario label; entropy is not calibrated uncertainty.</p><div className="ml-cube-subhead"><span>INPUT SEQUENCE · HH γ⁰</span><span>T0 → T1 → T2</span></div><div className="ml-cube-frames">{frame('t0','T0 · BEFORE')}{frame('t1','T1 · EVENT')}{frame('t2','T2 · FOLLOW-UP')}</div><div className="ml-cube-subhead ml-output-subhead"><span>ACTIVE MODEL · {modelName.toUpperCase()}</span><span>CLASS MAP + SCORE SPREAD</span></div><div className="ml-cube-frames ml-cube-frames--outputs">{frame('class','PREDICTED CLASS')}{frame('entropy','SCORE ENTROPY')}</div><div className="ml-legend ml-tile-legend">{DEMO_CLASSES.map((label)=><span key={label}><i style={{backgroundColor:CLASS_COLORS[label]}}/>{label}</span>)}</div></section>;
}

function FeatureSpace({ samples, selected, onSelect, scene }: { samples: SarSample[]; selected: SarFeatures; onSelect: (features: SarFeatures) => void; scene: ScenePerturbation }) {
  const px=(db:number)=>45+((db+28)/26)*390;
  const py=(delta:number)=>210-((delta+22)/28)*165;
  const transformed=samples.map((sample)=>({sample,features:perturb(sample.x,scene)}));
  const selectedEffective=perturb(selected,scene);
  return <section className="ml-panel ml-feature-space"><div className="ml-panel-head"><div><span className="ml-overline">FEATURE SPACE / HELD-OUT SCENARIO PROBES</span><h2>Backscatter change distribution</h2></div></div><p className="ml-panel-desc">Scene offsets move the examples in this feature space. Click a point to load it into the pixel inspector.</p><svg viewBox="0 0 480 270" role="img" aria-label="Generated examples plotted by pre-event backscatter and backscatter change">{[0,1,2,3].map((i)=><g key={i}><line x1="45" y1={45+i*50} x2="445" y2={45+i*50} className="ml-chart-grid"/><text x="39" y={49+i*50} textAnchor="end" className="ml-chart-label">{5-i*8} dB</text></g>)}{transformed.filter((_,i)=>i%3===0).map(({sample,features},index)=><circle key={index} cx={px(features[0])} cy={py(features[1]-features[0])} r="3.3" fill={CLASS_COLORS[sample.y]} opacity=".52" role="button" tabIndex={0} onClick={()=>onSelect(sample.x)} onKeyDown={(event)=>{if(event.key==='Enter'||event.key===' ')onSelect(sample.x);}}/>)}<circle cx={px(selectedEffective[0])} cy={py(selectedEffective[1]-selectedEffective[0])} r="8" fill="#fff" stroke="#101820" strokeWidth="3"/><line x1="45" y1="210" x2="445" y2="210" className="ml-chart-axis"/><line x1="45" y1="45" x2="45" y2="210" className="ml-chart-axis"/><text x="245" y="253" textAnchor="middle" className="ml-chart-caption">PRE-EVENT HH γ⁰ (dB)</text><text x="13" y="132" textAnchor="middle" transform="rotate(-90 13 132)" className="ml-chart-caption">POST − PRE (dB)</text></svg><div className="ml-legend">{DEMO_CLASSES.map((label)=><span key={label}><i style={{backgroundColor:CLASS_COLORS[label]}}/>{label}</span>)}</div></section>;
}

function TemporalTraining({ history, bestEpoch }: { history: LossPoint[]; bestEpoch: number }) {
  const losses = history.flatMap((point) => [point.train, point.validation]);
  const min = Math.max(0, Math.min(...losses) - .05);
  const max = Math.max(...losses) + .05;
  const x = (index: number) => 38 + (history.length <= 1 ? 0 : index / (history.length - 1)) * 426;
  const y = (value: number) => 183 - ((value - min) / Math.max(.01, max - min)) * 142;
  const train = history.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.train)}`).join(' ');
  const validation = history.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.validation)}`).join(' ');
  return <section className="ml-panel ml-training-panel">
    <div className="ml-panel-head"><div><span className="ml-overline">DEEP LEARNING / OPTIMIZATION TRACE</span><h2>Temporal MLP training behavior</h2></div><span className="ml-live-dot">BEST VALIDATION EPOCH {bestEpoch}</span></div>
    <p className="ml-panel-desc">Training and validation cross-entropy for the generated scenario set. This trace describes optimization only; it is not a NISAR accuracy result.</p>
    <div className="ml-training-layout">
      <div className="ml-loss-chart-wrap"><svg className="ml-loss-chart" viewBox="0 0 500 235" role="img" aria-label="MLP training and validation cross-entropy by epoch">
        {[0,1,2,3].map((step) => { const yy=42+step*45; return <g key={step}><line x1="38" y1={yy} x2="464" y2={yy} className="ml-chart-grid" /><text x="31" y={yy+3} textAnchor="end" className="ml-chart-label">{(max-(max-min)*step/3).toFixed(2)}</text></g>; })}
        <path d={train} fill="none" stroke="#69d7df" strokeWidth="2.5" /><path d={validation} fill="none" stroke="#b39aff" strokeWidth="2.5" strokeDasharray="6 4" />
        <line x1={x(bestEpoch - 1)} y1="40" x2={x(bestEpoch - 1)} y2="184" stroke="#f0c879" strokeDasharray="3 4" opacity=".7" />
        <text x="39" y="211" className="ml-chart-label">EPOCH 1</text><text x="464" y="211" textAnchor="end" className="ml-chart-label">EPOCH {history.length}</text><text x="250" y="230" textAnchor="middle" className="ml-chart-caption">CROSS-ENTROPY · LOWER IS BETTER</text>
      </svg><div className="ml-loss-legend"><span><i className="ml-loss-legend--train" />Training loss</span><span><i className="ml-loss-legend--validation" />Validation loss</span><span><i className="ml-loss-legend--best" />Selected weights</span></div></div>
      <div className="ml-network-card"><div className="ml-network-label">TEMPORAL MLP · FORWARD PASS</div><div className="ml-network-flow">{[{title:'4 inputs',sub:'HH₀ · HH₁ · HH₂ · stage'},{title:'Dense · 16',sub:'ReLU activation'},{title:'Dense · 8',sub:'ReLU activation'},{title:'Softmax · 4',sub:'scenario classes'}].map((layer,index)=><div className="ml-network-layer" key={layer.title}><span>{['⌁','••••','•••','◉◉◉◉'][index]}</span><b>{layer.title}</b><small>{layer.sub}</small>{index<3&&<ArrowRight size={13} />}</div>)}</div><div className="ml-network-foot"><span>Optimizer</span><b>Mini-batch SGD</b><span>Batch size</span><b>24</b><span>Weight selection</span><b>Validation loss · early stopping</b></div></div>
    </div>
  </section>;
}

function ScenarioDiagnostics({ matrix, importance, sampleCount, modelName }: { matrix: ReturnType<typeof confusionMatrix>; importance: ReturnType<typeof permutationImportance>; sampleCount: number; modelName: string }) {
  const short = ['Land', 'Water', 'Seasonal', 'Transition'];
  const values = DEMO_CLASSES.flatMap((actual) => DEMO_CLASSES.map((predicted) => matrix[actual][predicted]));
  const max = Math.max(...values, 1);
  const classScores = DEMO_CLASSES.map((label) => {
    const tp=matrix[label][label];
    const actual=DEMO_CLASSES.reduce((sum,category)=>sum+matrix[label][category],0);
    const predicted=DEMO_CLASSES.reduce((sum,category)=>sum+matrix[category][label],0);
    return {label,precision:predicted?tp/predicted:0,recall:actual?tp/actual:0};
  });
  return <section className="ml-analysis-grid ml-scenario-diagnostics">
    <article className="ml-panel"><div className="ml-panel-head"><div><span className="ml-overline">HELD-OUT SCENARIO PROBES / {modelName.toUpperCase()}</span><h2>Confusion matrix</h2></div><ShieldCheck size={18} className="ml-cyan"/></div><p className="ml-panel-desc">Rows are generated scenario labels; columns are model outputs. This checks behavior against the scenario generator only, not independent NISAR reference data.</p><div className="ml-confusion-wrap"><div className="ml-confusion-axis">PREDICTED CLASS →</div><div className="ml-confusion"><div className="ml-confusion-corner">ACTUAL ↓</div>{short.map((label)=><div className="ml-confusion-head" key={label}>{label}</div>)}{DEMO_CLASSES.map((actual,row)=><div className="ml-confusion-row" key={actual}><div className="ml-confusion-side">{short[row]}</div>{DEMO_CLASSES.map((predicted)=><div key={predicted} className={`ml-confusion-cell${actual===predicted?' is-correct':''}`} style={{backgroundColor:`rgba(88,174,186,${.08+.75*matrix[actual][predicted]/max})`}}>{matrix[actual][predicted]}</div>)}</div>)}</div><div className="ml-microcopy">{sampleCount} held-out generated examples · counts only</div><div className="ml-class-scores">{classScores.map((item)=><div key={item.label}><b>{item.label}</b><span>Precision {(item.precision*100).toFixed(0)}% · Recall {(item.recall*100).toFixed(0)}%</span></div>)}</div></div></article>
    <article className="ml-panel"><div className="ml-panel-head"><div><span className="ml-overline">MODEL EXPLANATION / {modelName.toUpperCase()}</span><h2>Input sensitivity</h2></div><BrainCircuit size={18} className="ml-violet"/></div><p className="ml-panel-desc">Change in scenario-set accuracy when one input column is shuffled. Descriptive for this generated set, not causal and not a real-scene finding.</p><div className="ml-importance">{importance.map((item,index)=><div className="ml-importance-row" key={item.name}><span className="ml-importance-rank">0{index+1}</span><div><div className="ml-importance-label"><b>{item.name}</b><small>{(item.score*100).toFixed(1)} pp</small></div><div className="ml-importance-track"><i style={{width:`${Math.max(2,Math.max(0,item.score)/Math.max(importance[0]?.score??.01,.01)*100)}%`}}/></div></div></div>)}</div><div className="ml-caution-note"><AlertTriangle size={14}/> Correlated inputs can share or hide permutation importance.</div></article>
  </section>;
}

function ScenarioLab({ forest, neural, history, bestEpoch, testSamples, onShowReal }: { forest: DemoClassifier; neural: DemoClassifier; history: LossPoint[]; bestEpoch: number; testSamples: SarSample[]; onShowReal: () => void }) {
  const [mode, setMode] = useState<'neural'|'forest'>('neural');
  const [features, setFeatures] = useState<SarFeatures>([-10, -17, .08, .9]);
  const [cutoff,setCutoff]=useState(.55);
  const [scene,setScene]=useState<ScenePerturbation>({eventDb:0,stageShift:0,persistenceShift:0});
  const model = mode === 'neural' ? neural : forest;
  const diagnostics = useMemo(() => ({ matrix: confusionMatrix(model, testSamples), importance: permutationImportance(model, testSamples) }), [model, testSamples]);
  const effectiveFeatures=perturb(features,scene);
  const prediction = getPrediction(model, effectiveFeatures);
  const accepted=prediction.scores[prediction.label]>=cutoff;
  const setFeature = (index: number, value: number) => setFeatures((current) => { const next: SarFeatures = [...current]; next[index] = value; return next; });
  const presets: {label:string;values:SarFeatures}[] = [
    {label:'Stable bank',values:[-9.4,-9.1,.06,.08]}, {label:'Open water',values:[-19.1,-18.5,.04,.94]},
    {label:'Flood pulse',values:[-9.8,-17.4,.62,.14]}, {label:'Persistent change',values:[-10.2,-17.1,.07,.91]},
  ];
  const trajectory = [effectiveFeatures[0], effectiveFeatures[1], effectiveFeatures[0]*(1-effectiveFeatures[3])+effectiveFeatures[1]*effectiveFeatures[3]];
  return <>
    <section className="ml-sim-banner"><div className="ml-sim-badge"><BrainCircuit size={15} /> ML SCENARIO LAB</div><p>Explore how the classifiers respond to generated radar-like inputs. These scenarios are illustrative; they are <strong>not NISAR observations or validated Jamuna predictions.</strong> Model scores below are class outputs, not calibrated probabilities or accuracy.</p><button className="ml-sim-link" onClick={onShowReal}>Open real Jamuna evidence <ArrowRight size={13}/></button></section>
    <div className="ml-model-selector" role="tablist" aria-label="Choose model"><button role="tab" aria-selected={mode==='neural'} className={mode==='neural'?'is-active':''} onClick={()=>setMode('neural')}><BrainCircuit size={17}/><span><b>Temporal MLP</b><small>4 → 16 → 8 → 4 · trained with SGD</small></span></button><button role="tab" aria-selected={mode==='forest'} className={mode==='forest'?'is-active':''} onClick={()=>setMode('forest')}><Radio size={17}/><span><b>Random Forest</b><small>31 trees · bootstrap voting</small></span></button></div>
    <SceneControls scene={scene} onChange={setScene}/>
    <div className="ml-visual-grid"><ScenarioCube samples={testSamples} model={model} modelName={mode==='neural'?'Temporal MLP':'Random Forest'} selected={effectiveFeatures} onSelect={setFeatures} scene={scene}/><FeatureSpace samples={testSamples} selected={features} onSelect={setFeatures} scene={scene}/></div>
    <section className="ml-panel ml-scenario-panel"><div className="ml-panel-head"><div><span className="ml-overline">INTERACTIVE INFERENCE / {mode==='neural'?'TEMPORAL MLP':'RANDOM FOREST'}</span><h2>Probe a radar-change scenario</h2></div><span className="ml-live-dot">GENERATED INPUTS</span></div>
      <div className="ml-presets">{presets.map((preset)=><button key={preset.label} className="ml-preset" onClick={()=>setFeatures(preset.values)}>{preset.label}</button>)}</div>
      <div className="ml-scenario-grid"><div className="ml-sliders">{[{label:'T0 · pre-event HH γ⁰',index:0,min:-25,max:-3,step:.1,suffix:' dB'},{label:'T1 · event HH γ⁰',index:1,min:-25,max:-3,step:.1,suffix:' dB'},{label:'Stage-difference index',index:2,min:0,max:1,step:.01,suffix:''},{label:'Later-water persistence input',index:3,min:0,max:1,step:.01,suffix:''}].map((item)=><label className="ml-slider" key={item.index}><span><b>{item.label}</b><output>{features[item.index].toFixed(item.index<2?1:2)}{item.suffix}</output></span><input type="range" min={item.min} max={item.max} step={item.step} value={features[item.index]} onChange={(event)=>setFeature(item.index,Number(event.target.value))}/></label>)}
        <div className={`ml-prediction${accepted?'':' ml-prediction--review'}`}><div className="ml-prediction__top"><span>{accepted?'SCENARIO CLASS OUTPUT':'BELOW REVIEW THRESHOLD · REVIEW'}</span><span>{(prediction.scores[prediction.label]*100).toFixed(1)}% {mode==='neural'?'SOFTMAX SCORE':'TREE-VOTE SHARE'}</span></div><strong style={{color:CLASS_COLORS[prediction.label]}}>{prediction.label}</strong><small>Largest model output for the selected inputs. It is not calibrated confidence and cannot establish erosion.</small></div>
        <div className="ml-votes">{DEMO_CLASSES.map((label)=><div className="ml-vote" key={label}><span><i style={{backgroundColor:CLASS_COLORS[label]}}/>{label}</span><b>{(prediction.scores[label]*100).toFixed(1)}%</b><div><i style={{width:`${prediction.scores[label]*100}%`,backgroundColor:CLASS_COLORS[label]}}/></div></div>)}</div>
        <label className="ml-slider ml-score-cutoff"><span><b>Review threshold for selected pixel</b><output>{Math.round(cutoff*100)}%</output></span><input type="range" min=".4" max=".9" step=".01" value={cutoff} onChange={(event)=>setCutoff(Number(event.target.value))}/></label>
      </div><div className="ml-trajectory-card"><div className="ml-trajectory-head"><b>INPUT SEQUENCE · HH γ⁰</b><span>T2 is derived from persistence input</span></div><svg viewBox="0 0 360 180" role="img" aria-label="Generated HH backscatter scenario values at T0, T1 and T2"><line x1="38" y1="145" x2="330" y2="145" className="ml-chart-axis"/><line x1="38" y1="25" x2="38" y2="145" className="ml-chart-axis"/>{[-25,-15,-5].map((v,i)=><g key={v}><line x1="38" y1={145-i*55} x2="330" y2={145-i*55} className="ml-chart-grid"/><text x="30" y={149-i*55} textAnchor="end" className="ml-chart-label">{v}</text></g>)}<path d={trajectory.map((v,i)=>`${i?'L':'M'} ${75+i*115} ${145-(v+25)*5.5}`).join(' ')} fill="none" stroke="#69d7df" strokeWidth="3"/>{trajectory.map((v,i)=><g key={i}><circle cx={75+i*115} cy={145-(v+25)*5.5} r="5" fill="#101922" stroke="#9bf0ec" strokeWidth="2"/><text x={75+i*115} y={165} textAnchor="middle" className="ml-chart-label">{['T0','T1','T2'][i]}</text></g>)}</svg><p>Illustrative sequence only. No image pixels are being inferred in this scenario control.</p></div></div>
    </section>
    {mode==='neural'&&<TemporalTraining history={history} bestEpoch={bestEpoch}/>}
    <ScenarioDiagnostics matrix={diagnostics.matrix} importance={diagnostics.importance} sampleCount={testSamples.length} modelName={mode==='neural'?'Temporal MLP':'Random Forest'} />
    <details className="ml-method-details ml-scenario-model-card" open><summary>Model card · {mode==='neural'?'Temporal MLP':'Random Forest'} · inputs, training and intended use</summary><div className="ml-method-copy"><p><strong>Model:</strong> {mode==='neural'?'Dense network with 4 inputs, 16 and 8 ReLU units, and 4-way softmax; trained with mini-batch SGD and validation-loss early stopping.':'31 shallow CART trees trained by bootstrap aggregation; two randomly selected features are considered per split.'}</p><p><strong>Input features:</strong> Pre-event HH backscatter, event HH backscatter, a stage-difference index, and later-water persistence. The follow-up HH value in this scenario is derived from persistence.</p><p><strong>Training labels:</strong> Generated from hand-set scenario distributions. Held-out matrix and permutation sensitivity describe agreement with those generated rules only; they are not field-label validation.</p><p><strong>Intended use:</strong> Demonstrate model mechanics and compare responses to controlled scenarios. Do not interpret outputs as NISAR scene classifications, calibrated probabilities, or erosion estimates.</p></div></details>
  </>;
}

function RealCaseTab({ bundle, error }: { bundle: ReachBundle | null; error: string | null }) {
  if (error) return <div className="ml-case-error">Could not load the Jamuna source bundle: {error}</div>;
  if (!bundle) return <div className="ml-case-loading">Loading the real NISAR evidence bundle…</div>;
  const metric=bundle.manifest.metrics.find((item)=>item.id==='erosion_area');
  const checks=bundle.qc?.checks??[];
  const channels=[...new Set(metric?.inputs?.map((input)=>input.layer).filter((value):value is string=>Boolean(value)))];
  const acquisitions=bundle.reach.dates.filter((date)=>date.status==='ok');
  const unevaluated=checks.filter((check)=>check.status==='NOT_EVALUATED').length;
  return <section className="ml-real-case" id="real-case">
    <div className="ml-real-verdict"><div className="ml-real-verdict__icon"><AlertTriangle size={20}/></div><div><span>REAL NISAR CASE · {bundle.reach.verdict}</span><h2>The current observations do not support a confirmed erosion estimate.</h2><p>These values come from the Jamuna source bundle. The transition area is a threshold-based candidate, not verified ground truth.</p></div></div>
    <section className="ml-validation-gate"><div className="ml-validation-gate__head"><BrainCircuit size={20}/><div><span>MODEL PERFORMANCE · REAL DATA</span><h2>Accuracy and F1: not evaluated</h2></div><b>NO REFERENCE LABELS</b></div><p>The available pair has {acquisitions.length} usable acquisitions, no independent labeled erosion reference, and no later-pass persistence evidence. A percentage here would imply validation this data does not provide.</p><div className="ml-validation-grid"><article><span>USABLE ACQUISITIONS</span><strong>{acquisitions.length}</strong><small>Two dates do not establish persistence</small></article><article><span>INDEPENDENT LABELS</span><strong>Unavailable</strong><small>Needed for supervised accuracy and F1</small></article><article><span>INDEPENDENT TEST SET</span><strong>Unavailable</strong><small>Needs spatially separate reference samples</small></article><article><span>QC NOT EVALUATED</span><strong>{unevaluated}</strong><small>Recorded in this data bundle</small></article></div></section>
    <div className="ml-real-summary"><article><span>USABLE ACQUISITIONS</span><strong>{acquisitions.length}</strong><small>Relative orbit {bundle.reach.track.relative_orbit} / frame {bundle.reach.track.frame}</small></article><article><span>POLARIZATION</span><strong>{channels.join(', ')||'HHHH'}</strong><small>NISAR L-band GCOV input</small></article><article><span>THRESHOLD CANDIDATE AREA</span><strong>{metric?`${fmt(metric.value)} ha`:'Not reported'}</strong><small>Not a verified erosion estimate</small></article><article><span>QC WARNINGS / FAILS</span><strong>{checks.filter((check)=>check.status==='WARN'||check.status==='FAIL').length}</strong><small>{unevaluated} checks not evaluated</small></article></div>
    <div className="ml-real-dates">{bundle.reach.dates.map((date)=><article key={date.date}><span className="ml-real-dot"/><div><b>{utcDate(date.acq_utc)}</b><small>{metric?.inputs?.find((input)=>input.acq_utc?.slice(0,10)===date.acq_utc.slice(0,10))?.granule??'Granule reference unavailable'}</small><em>{date.stage_source==='proxy'?'Stage context is imagery-derived; not gauge data.':`${date.stage_source} stage context`}</em></div></article>)}</div>
    <div className="ml-real-qc">{checks.map((check)=><article key={check.id} className={`ml-qc-card ml-qc-card--${check.status.toLowerCase()}`}><div><span>{check.status==='PASS'?<Check size={14}/>:check.status==='WARN'||check.status==='FAIL'?<AlertTriangle size={14}/>:<CircleHelp size={14}/>}</span><b>{check.label??check.id}</b><em>{QC_STATUS[check.status]}</em></div><p>{check.explanation??'No explanation recorded.'}</p></article>)}</div>
    <aside className="ml-real-caveat"><strong>Evidence needed to resolve this case</strong><span>Additional same-track acquisitions across the seasonal stage cycle, gauge-level stage control, later-date persistence, stable thresholding, and independent reference validation.</span></aside>
  </section>;
}

export function IntelligencePage() {
  const loadBundle=useStore((s)=>s.loadBundle);
  const [tab,setTab]=useState<'lab'|'case'>('lab');
  const [bundle,setBundle]=useState<ReachBundle|null>(null);
  const [error,setError]=useState<string|null>(null);
  const model=useMemo(()=>{
    const samples=createSyntheticSamples(2609,180);
    const split=splitSyntheticSamples(samples,2031);
    const forest=trainSyntheticForest(split.train,941,31);
    const temporal=trainTemporalMlp(split.train,split.validation,4021);
    return {forest,neural:temporal.model,history:temporal.history,bestEpoch:temporal.bestEpoch,testSamples:split.test};
  },[]);
  useEffect(()=>{
    let active=true;
    loadReachBundle('jamuna-chilmari').then((loaded)=>{if(!active)return;setBundle(loaded);loadBundle('jamuna-chilmari',loaded);}).catch((cause:unknown)=>{if(active)setError(cause instanceof Error?cause.message:'Bundle unavailable');});
    return()=>{active=false;};
  },[loadBundle]);
  return <div className="page-container ml-page"><Navbar transparent={false}/><main className="ml-shell">
    <header className="ml-hero"><div className="ml-hero-radar"><i/><i/><i/><span/></div><div className="ml-hero-copy"><div className="ml-eyebrow"><span className="ml-eyebrow-dot"/> SAR CHANGE INTELLIGENCE <b>MODEL WORKBENCH</b></div><h1>Follow radar change through time, then check what the evidence supports.</h1><p>Explore a temporal neural network and Random Forest on interactive scenarios, then inspect the real Jamuna NISAR evidence and its validation limits.</p><div className="ml-hero-meta"><span><Radio size={14}/> NISAR L-BAND GCOV</span><span><BrainCircuit size={14}/> RANDOM FOREST + TEMPORAL MLP</span><span><ShieldCheck size={14}/> REAL CASE EVIDENCE</span></div></div><div className="ml-hero-orbit"><div className="ml-orbit-ring ml-orbit-ring--one"/><div className="ml-orbit-ring ml-orbit-ring--two"/><div className="ml-orbit-center"><BrainCircuit size={31}/><small>RF + DL</small></div><b>MODEL<br/>WORKBENCH</b></div></header>
    <div className="ml-tabbar" role="tablist" aria-label="ML intelligence views"><button role="tab" aria-selected={tab==='lab'} className={tab==='lab'?'is-active':''} onClick={()=>setTab('lab')}><BrainCircuit size={16}/> ML Scenario Lab <span>MODEL BEHAVIOR</span></button><button role="tab" aria-selected={tab==='case'} className={tab==='case'?'is-active':''} onClick={()=>setTab('case')}><Radio size={16}/> Real Jamuna Evidence <span>2 ACQUISITIONS</span></button></div>
    {tab==='lab'?<ScenarioLab {...model} onShowReal={()=>setTab('case')}/>:<RealCaseTab bundle={bundle} error={error}/>}
    <footer className="ml-bottomline"><span>FLUVISAR / MODEL TRANSPARENCY</span><span>Scenario outputs are not NISAR measurements or validated case predictions.</span></footer><div className="ml-footer-sources"><a href="https://hyp3-docs.asf.alaska.edu/nisar-docs/products-overview/" target="_blank" rel="noreferrer">NISAR GCOV product guide <ExternalLink size={13}/></a><a href="https://nisar.jpl.nasa.gov/mission/get-to-know-sar/overview/" target="_blank" rel="noreferrer">NASA/JPL SAR interpretation <ExternalLink size={13}/></a><a href="/methods">FluviSAR methods and case limits <ExternalLink size={13}/></a></div>
  </main></div>;
}

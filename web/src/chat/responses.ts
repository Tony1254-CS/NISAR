/**
 * Response Generator
 * Generates data-driven template responses from our JSON data.
 * No backend/API needed.
 */

import type { IntentCategory } from './intents';
import type { ReachDetail, Manifest, QC, Stage, ChangeFeatureCollection } from '../data/types';

export interface ChatSource {
  file: string;
  field: string;
}

export interface ChatResponse {
  text: string;
  sources: ChatSource[];
  mapAction?: {
    type: 'fly_to' | 'toggle_layer' | 'highlight_feature';
    payload: unknown;
  };
  followUp?: string[];
}

interface DataContext {
  reach: ReachDetail | null;
  manifest: Manifest | null;
  qc: QC | null;
  stage: Stage | null;
  erosion: ChangeFeatureCollection | null;
  accretion: ChangeFeatureCollection | null;
}

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    // "20260826" format
    const y = dateStr.slice(0, 4);
    const m = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  }
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function findCheck(qc: QC | null, id: string) {
  return qc?.checks?.find(c => c.id === id) ?? null;
}

export function generateResponse(intent: IntentCategory, data: DataContext): ChatResponse {
  const { reach, manifest, qc, stage, erosion, accretion } = data;

  switch (intent) {
    // ── Greeting ──
    case 'greeting':
      return {
        text: `Hello! I'm the River Intelligence Assistant for the **${reach?.name ?? 'Jamuna River'}** investigation.\n\nI can help you understand:\n• 🔍 How much land was eroded or formed\n• 📊 Quality & reliability of the data\n• 🗺️ Where exactly the changes happened\n• 💡 What this means for the community\n\nAsk me anything, or tap a suggested question below!`,
        sources: [],
        followUp: ['How much land was lost?', 'Is this data reliable?', 'Explain in simple words'],
      };

    // ── Erosion Amount ──
    case 'erosion_amount': {
      const metric = manifest?.metrics?.find(m => m.id === 'erosion_area');
      const val = metric?.value ?? 0;
      const low = metric?.low ?? null;
      const high = metric?.high ?? null;
      return {
        text: `**${val.toLocaleString()} hectares** of land was lost to the river (eroded).\n\n${low != null && high != null ? `The estimate ranges from **${low.toLocaleString()} ha** (low) to **${high.toLocaleString()} ha** (high) depending on the detection threshold used.` : ''}\n\nTo put this in perspective, ${val.toLocaleString()} hectares is roughly **${(val * 2.47).toFixed(0)} football fields**.`,
        sources: [
          { file: 'manifest.json', field: 'metrics[erosion_area].value' },
        ],
        followUp: ['How much new land was formed?', 'Where is the biggest erosion?', 'Is this number reliable?'],
      };
    }

    // ── Accretion Amount ──
    case 'accretion_amount': {
      const metric = manifest?.metrics?.find(m => m.id === 'accretion_area');
      const val = metric?.value ?? 0;
      return {
        text: `**${val.toLocaleString()} hectares** of new land (accretion/char) was formed in the river.\n\nThis means sediment deposits created new land areas that were previously water.`,
        sources: [
          { file: 'manifest.json', field: 'metrics[accretion_area].value' },
        ],
        followUp: ['What is the net change?', 'How much land was eroded?'],
      };
    }

    // ── Net Change ──
    case 'net_change': {
      const ero = manifest?.metrics?.find(m => m.id === 'erosion_area')?.value ?? 0;
      const acc = manifest?.metrics?.find(m => m.id === 'accretion_area')?.value ?? 0;
      const net = ero - acc;
      return {
        text: `**Net land loss: ${net.toFixed(2)} hectares**\n\n• Erosion (land lost): ${ero.toLocaleString()} ha\n• Accretion (land gained): ${acc.toLocaleString()} ha\n• Net change: **${net > 0 ? '-' : '+'}${Math.abs(net).toFixed(2)} ha**\n\n${net > 0 ? 'The river consumed more land than it created — a net loss for the communities.' : 'The river actually created more land than it destroyed.'}`,
        sources: [
          { file: 'manifest.json', field: 'metrics[erosion_area, accretion_area]' },
        ],
      };
    }

    // ── Date Range ──
    case 'date_range': {
      const d0 = reach?.dates?.[0];
      const d1 = reach?.dates?.[1];
      return {
        text: `This analysis compares satellite images from two dates:\n\n• **Before:** ${d0 ? formatDate(d0.date) : 'N/A'}\n• **After:** ${d1 ? formatDate(d1.date) : 'N/A'}\n\nThat's a **${d0 && d1 ? Math.round((new Date(d1.acq_utc).getTime() - new Date(d0.acq_utc).getTime()) / (1000 * 60 * 60 * 24)) : '?'}-day gap** between the two observations. Any land changes detected happened within this window.`,
        sources: [
          { file: 'reach.json', field: 'dates[]' },
        ],
        followUp: ['What satellite was used?', 'How much erosion was detected?'],
      };
    }

    // ── Satellite Info ──
    case 'satellite_info': {
      const input = manifest?.metrics?.[0]?.inputs?.[0];
      return {
        text: `This analysis uses **NASA-ISRO NISAR** satellite radar data.\n\n• **Sensor:** L-band Synthetic Aperture Radar (SAR)\n• **Product:** L2 GCOV (Geocoded Covariance)\n• **Layer:** ${input?.layer ?? 'HHHH'} (co-polarized backscatter)\n• **Orbit:** Relative orbit ${reach?.track?.relative_orbit ?? '?'}, ${reach?.track?.direction === 'D' ? 'Descending' : 'Ascending'} pass\n\nSAR radar can see through clouds and works day or night, making it ideal for monitoring rivers during monsoon season. 🛰️`,
        sources: [
          { file: 'manifest.json', field: 'metrics[].inputs[]' },
          { file: 'reach.json', field: 'track' },
        ],
      };
    }

    // ── Threshold ──
    case 'threshold_info': {
      const params = manifest?.metrics?.[0]?.params;
      return {
        text: `The system uses the **Otsu method** to automatically separate water from land in radar images.\n\n• **Threshold (Before):** ${params?.threshold_db_t0?.toFixed(2) ?? '?'} dB\n• **Threshold (After):** ${params?.threshold_db_t1?.toFixed(2) ?? '?'} dB\n• **Difference:** ${params?.threshold_db_t0 != null && params?.threshold_db_t1 != null ? Math.abs(params.threshold_db_t1 - params.threshold_db_t0).toFixed(3) : '?'} dB\n\nPixels darker than the threshold are classified as water; brighter pixels as land. The shift in threshold between dates can indicate changing water conditions.`,
        sources: [
          { file: 'manifest.json', field: 'metrics[].params' },
        ],
      };
    }

    // ── Rainfall ──
    case 'rainfall': {
      const check = findCheck(qc, 'rainfall_anomaly');
      return {
        text: `Rainfall was checked using **NASA GPM IMERG** satellite precipitation data.\n\n• **Result:** ${check?.value ?? '?'}x the seasonal average\n• **Detail:** ${check?.explanation ?? 'No data available'}\n\n${(check?.value ?? 0) > 1.5 ? '⚠️ Higher-than-normal rainfall may have contributed to temporary flooding, which could be misidentified as erosion.' : '✅ Rainfall was within normal range, so the detected changes are likely real land changes, not temporary flooding.'}`,
        sources: [
          { file: 'qc.json', field: 'checks[rainfall_anomaly]' },
        ],
        followUp: ['What is the water level?', 'Is the data reliable?'],
      };
    }

    // ── Water Level ──
    case 'water_level': {
      const series = stage?.series;
      return {
        text: `Water level data from ${stage?.station?.source === 'proxy' ? 'satellite-derived proxy measurements' : 'ground-based gauge stations'}:\n\n${series?.map(s => `• **${formatDate(s.t)}:** ${s.h.toFixed(4)} (relative level)`).join('\n') ?? 'No data available'}\n\n${stage?.mode === 'proxy' ? '⚠️ Note: These are proxy measurements derived from satellite imagery, not direct gauge readings.' : ''}`,
        sources: [
          { file: 'stage.json', field: 'series[]' },
        ],
      };
    }

    // ── Confidence ──
    case 'confidence': {
      const verdict = reach?.verdict ?? 'INCONCLUSIVE';
      const pct = verdict === 'SUPPORTED' ? 98 : verdict === 'LIMITED' ? 64 : 12;
      const failChecks = qc?.checks?.filter(c => c.status === 'FAIL' || c.status === 'WARN') ?? [];
      return {
        text: `The overall confidence score is **${pct}%** (${verdict}).\n\n**Why ${pct < 50 ? 'so low' : pct < 80 ? 'moderate' : 'high'}?**\n${failChecks.map(c => `• ❌ **${c.label}**: ${c.explanation}`).join('\n')}\n\n${pct < 50 ? '⚠️ This means the system is NOT confident in the detection. The numbers should be treated with caution and verified with ground data.' : '✅ The system has reasonable confidence in these findings.'}`,
        sources: [
          { file: 'reach.json', field: 'verdict' },
          { file: 'qc.json', field: 'checks[]' },
        ],
        followUp: ['What would improve confidence?', 'What is the verdict?'],
      };
    }

    // ── Verdict ──
    case 'verdict': {
      const v = reach?.verdict ?? 'INCONCLUSIVE';
      const color = v === 'SUPPORTED' ? '🟢' : v === 'LIMITED' ? '🟡' : '🔴';
      return {
        text: `${color} **Final Verdict: ${v}**\n\n${reach?.verdict_reasons?.map((r, i) => `${i + 1}. ${r}`).join('\n\n') ?? 'No reasons available.'}`,
        sources: [
          { file: 'reach.json', field: 'verdict, verdict_reasons' },
        ],
        followUp: ['Why is confidence low?', 'What should we do?'],
      };
    }

    // ── Why Inconclusive ──
    case 'why_inconclusive': {
      return {
        text: `The detection is marked **INCONCLUSIVE** because of ${reach?.verdict_reasons?.length ?? 0} issues:\n\n${reach?.verdict_reasons?.map((r, i) => `**Issue ${i + 1}:** ${r}`).join('\n\n') ?? 'No reasons provided.'}\n\nIn simple terms: the system detected some changes, but it's not confident enough to call it real erosion. More satellite passes and ground verification are needed.`,
        sources: [
          { file: 'reach.json', field: 'verdict_reasons' },
        ],
        followUp: ['What would improve confidence?', 'What should we do next?'],
      };
    }

    // ── RFI Issue ──
    case 'rfi_issue': {
      const check = findCheck(qc, 'rfi');
      return {
        text: `**Radio Frequency Interference (RFI)** was detected in the radar data.\n\n• **Flagged dates:** ${check?.value ?? '?'}\n• **Detail:** ${check?.explanation ?? 'No details available.'}\n\nRFI is caused by ground-based radio transmitters that interfere with the satellite's radar signal. It can create false bright spots that look like land where there is actually water.`,
        sources: [
          { file: 'qc.json', field: 'checks[rfi]' },
        ],
      };
    }

    // ── Sensor Checks ──
    case 'sensor_checks': {
      const checks = qc?.checks ?? [];
      return {
        text: `**${checks.length} quality checks** were performed:\n\n${checks.map(c => {
          const icon = c.status === 'PASS' ? '✅' : c.status === 'FAIL' ? '❌' : c.status === 'WARN' ? '⚠️' : 'ℹ️';
          return `${icon} **${c.label ?? c.id}** — ${c.status}`;
        }).join('\n')}\n\nEach check verifies a different aspect of data quality to ensure the detection is accurate.`,
        sources: [
          { file: 'qc.json', field: 'checks[]' },
        ],
      };
    }

    // ── Biggest Erosion ──
    case 'biggest_erosion': {
      const features = erosion?.features ?? [];
      const sorted = [...features].sort((a, b) => (b.properties.area_ha ?? 0) - (a.properties.area_ha ?? 0));
      const top = sorted[0];
      const top5 = sorted.slice(0, 5);
      return {
        text: `The **largest erosion zone** covers **${top?.properties.area_ha ?? 0} hectares** (${top?.properties.pixel_count ?? 0} pixels).\n\n**Top 5 biggest erosion zones:**\n${top5.map((f, i) => `${i + 1}. **${f.properties.area_ha} ha** at [${f.properties.centroid?.[1]?.toFixed(4) ?? '?'}°N, ${f.properties.centroid?.[0]?.toFixed(4) ?? '?'}°E]`).join('\n')}\n\n🗺️ *I'm highlighting the largest zone on the map for you.*`,
        sources: [
          { file: 'erosion.geojson', field: 'features[].properties.area_ha' },
        ],
        mapAction: top ? {
          type: 'fly_to',
          payload: { center: top.properties.centroid, zoom: 14 },
        } : undefined,
        followUp: ['How many erosion zones total?', 'What is the total land lost?'],
      };
    }

    // ── Erosion Count ──
    case 'erosion_count': {
      const eroCount = erosion?.features?.length ?? 0;
      const accCount = accretion?.features?.length ?? 0;
      return {
        text: `The analysis detected:\n\n• **${eroCount.toLocaleString()} erosion zones** (land lost to the river)\n• **${accCount.toLocaleString()} accretion zones** (new land formed)\n\nThese are individual polygons identified by the satellite radar. Some are tiny (1 pixel = 0.04 ha) while others are much larger.`,
        sources: [
          { file: 'erosion.geojson', field: 'features.length' },
          { file: 'accretion.geojson', field: 'features.length' },
        ],
      };
    }

    // ── Location ──
    case 'location_info':
      return {
        text: `This analysis covers the **${reach?.name ?? 'Chilmari–Roumari reach'}** of the **${reach?.river ?? 'Jamuna'} River** in Bangladesh.\n\n• **Coordinates:** ${reach?.bbox?.[1]?.toFixed(2) ?? '?'}°N to ${reach?.bbox?.[3]?.toFixed(2) ?? '?'}°N, ${reach?.bbox?.[0]?.toFixed(2) ?? '?'}°E to ${reach?.bbox?.[2]?.toFixed(2) ?? '?'}°E\n• **CRS:** ${reach?.crs_analysis ?? 'EPSG:32645'}\n\nChilmari is one of the most erosion-prone areas along the Jamuna River, with thousands of families displaced by riverbank erosion each year.`,
        sources: [
          { file: 'reach.json', field: 'name, river, bbox' },
        ],
      };

    // ── What-If: More Passes ──
    case 'what_if_more_passes':
      return {
        text: `**If we had more satellite passes:**\n\n🔬 Currently we only have **2 observations** (Aug 26 & Sep 19). This is the minimum needed.\n\nWith more passes:\n• ✅ We could confirm if the erosion is **persistent** (not temporary flooding)\n• ✅ The **persistence check** would pass instead of "NOT_EVALUATED"\n• ✅ Confidence score would likely jump from **12% to 60-80%**\n• ✅ We could track the **speed** of erosion (meters per day)\n\nNISAR revisits every 12 days, so by mid-October we would have 2 more passes to work with.`,
        sources: [
          { file: 'qc.json', field: 'checks[persistence]' },
        ],
      };

    // ── What-If: More Rain ──
    case 'what_if_more_rain':
      return {
        text: `**If rainfall was 2x heavier:**\n\n🌧️ Currently, rainfall was **1.72x** the seasonal average (already elevated).\n\nWith double rainfall:\n• ⚠️ Much more land would appear as "water" in radar images\n• ⚠️ **Temporary flooding** would be misidentified as **permanent erosion**\n• ⚠️ The erosion number (3622 ha) would be even **more inflated**\n• ❌ Confidence would drop further\n\nThis is exactly why we cross-check with rainfall data — to distinguish real erosion from temporary flooding.`,
        sources: [
          { file: 'qc.json', field: 'checks[rainfall_anomaly]' },
        ],
      };

    // ── Explain Simple ──
    case 'explain_simple':
      return {
        text: `**In simple words:**\n\nA satellite called NISAR took two pictures of the Jamuna River near Chilmari — one on Aug 26 and another on Sep 19, 2026.\n\nBy comparing these two pictures, our system found that about **3,600 hectares of land** may have been swallowed by the river during those 24 days. That's roughly the size of **a small town**.\n\nHowever, the system is **not fully sure** about this number because:\n• It only had 2 images (it needs more to be confident)\n• The numbers seem unusually high\n• There was some signal interference\n\n**Bottom line:** Something significant is happening, but we need more data to confirm it. 🔍`,
        sources: [
          { file: 'reach.json', field: 'verdict, verdict_reasons' },
          { file: 'manifest.json', field: 'metrics[erosion_area]' },
        ],
        followUp: ['What should we do?', 'Where is the biggest erosion?'],
      };

    // ── Recommendation ──
    case 'recommendation': {
      const v = reach?.verdict;
      return {
        text: `**Recommended Next Steps:**\n\n${v === 'SUPPORTED' ? '🟢 **High Confidence Detection**\n1. Deploy field team for ground verification\n2. Alert local disaster management authorities\n3. Begin community evacuation planning if needed' : v === 'LIMITED' ? '🟡 **Moderate Confidence**\n1. Wait for additional satellite passes\n2. Cross-check with local ground reports\n3. Prepare field team for potential deployment' : '🔴 **Low Confidence (Current Situation)**\n1. **Wait for more satellite data** — NISAR will pass again in ~12 days\n2. **Do NOT raise public alarm** based on this data alone\n3. **Monitor** local news and FFWC water level reports\n4. **If ground reports confirm erosion**, escalate immediately\n5. **Re-run analysis** when the next satellite pass is available'}`,
        sources: [
          { file: 'reach.json', field: 'verdict' },
        ],
      };
    }

    // ── Unknown ──
    default:
      return {
        text: `I'm not sure I understand that question. I can help with:\n\n• **Erosion & land changes** — "How much land was lost?"\n• **Data quality & reliability** — "Is this data reliable?"\n• **Locations** — "Where is the biggest erosion?"\n• **What-if scenarios** — "What if there was more rain?"\n• **Simple explanations** — "Explain in simple words"\n\nTry asking one of these, or tap a suggested question below!`,
        sources: [],
        followUp: ['How much land was lost?', 'Explain in simple words', 'What should we do?'],
      };
  }
}

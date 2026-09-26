import { useStore } from './state/store';
import type { ReachListItem } from './data/types';
import { Navbar } from './components/Navbar';

export function TopBar({ reaches }: { reaches: ReachListItem[] | null }) {
  const { reachId, setReachId, reach, analysisMode, setAnalysisMode, setAnalysisSplit } = useStore();

  const dataInfo = reach
    ? `NISAR · ${reach.dates.length > 0 ? reach.dates[reach.dates.length - 1].date : '—'}`
    : undefined;

  return (
    <Navbar
      showReachInfo
      reaches={reaches}
      reachId={reachId}
      onReachChange={setReachId}
      onAnalyzeClick={() => {
        if (analysisMode) {
          setAnalysisMode(false);
          setAnalysisSplit(false);
        } else {
          setAnalysisMode(true);
        }
      }}
      dataInfo={dataInfo}
    />
  );
}

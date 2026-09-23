import React, { useMemo } from 'react';
import { scaleTime, scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { extent, min, max } from 'd3-array';
import { useStore } from '../state/store';
import { MatchWaterButton } from './MatchWaterButton';

export function Hydrograph({ width = 800, height = 150 }) {
  const { stage, reach, selectedDate, setSelectedDate, compare } = useStore();
  
  if (!stage) return <div className="hydrograph-skeleton" style={{ width, height }} />;

  const margin = { top: 20, right: 20, bottom: 20, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const tParse = (tStr: string) => new Date(tStr);
  
  const series = stage.series;
  const acqs = stage.acquisitions;
  
  if (series.length === 0) return null;

  const xScale = useMemo(() => {
    return scaleTime()
      .domain(extent(series, d => tParse(d.t)) as [Date, Date])
      .range([0, innerWidth]);
  }, [series, innerWidth]);

  const yScale = useMemo(() => {
    const minH = min(series, d => d.h) || 0;
    let maxH = max(series, d => d.h) || 10;
    if (stage.station?.danger_level_m && stage.station.danger_level_m > maxH) {
      maxH = stage.station.danger_level_m;
    }
    return scaleLinear()
      .domain([Math.max(0, minH - 1), maxH + 1])
      .range([innerHeight, 0]);
  }, [series, stage.station, innerHeight]);

  const linePath = useMemo(() => {
    return line<{ t: string; h: number }>()
      .x(d => xScale(tParse(d.t)))
      .y(d => yScale(d.h))
      (series);
  }, [series, xScale, yScale]);

  const ticks = xScale.ticks(5);

  const matchStage = useMemo(() => {
    if (!compare.active || !compare.t0 || !stage) return null;
    const acq = stage.acquisitions.find(a => a.date === compare.t0);
    return acq ? acq.h : null;
  }, [compare, stage]);

  return (
    <div style={{ position: 'relative', width, height, background: 'var(--panel)', borderTop: '1px solid var(--line)' }}>
      {/* Rain strip slot */}
      <div style={{ position: 'absolute', top: 0, left: margin.left, width: innerWidth, height: 16, borderBottom: '1px solid var(--line)' }} />
      
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <MatchWaterButton />
      </div>
      
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Y Axis Grid lines (2-3 max per spec) */}
          {yScale.ticks(3).map(tickValue => (
            <g key={tickValue} transform={`translate(0,${yScale(tickValue)})`}>
              <line x2={innerWidth} stroke="var(--line)" />
              <text x={-5} dy="0.32em" fill="var(--text-3)" fontSize="10" textAnchor="end">{tickValue}</text>
            </g>
          ))}

          {/* X Axis */}
          <g transform={`translate(0,${innerHeight})`}>
            <line x2={innerWidth} stroke="var(--line)" />
            {ticks.map(tickValue => {
              const dateStr = tickValue.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <g key={tickValue.toString()} transform={`translate(${xScale(tickValue)},0)`}>
                  <line y2={5} stroke="var(--line)" />
                  <text y={15} fill="var(--text-3)" fontSize="10" textAnchor="middle">{dateStr}</text>
                </g>
              );
            })}
          </g>

          {/* Danger line */}
          {stage.station?.danger_level_m && (
            <g transform={`translate(0,${yScale(stage.station.danger_level_m)})`}>
              <line x2={innerWidth} stroke="var(--fail)" strokeDasharray="4,4" opacity={0.5} />
              <text x={innerWidth} y={-5} fill="var(--fail)" fontSize="10" textAnchor="end" opacity={0.8}>Danger Level</text>
            </g>
          )}

          {/* Match Stage line */}
          {matchStage !== null && (
            <g transform={`translate(0,${yScale(matchStage)})`}>
              <line x2={innerWidth} stroke="var(--water)" opacity={0.8} />
            </g>
          )}

          {/* Stage curve */}
          <path d={linePath || undefined} fill="none" stroke="var(--text)" strokeWidth={1.5} />

          {/* Acquisition Ticks */}
          {acqs.filter(a => a.status === 'ok').map(a => {
            const cx = xScale(tParse(a.t));
            const cy = yScale(a.h);
            const isSelected = a.date === selectedDate;
            return (
              <g key={a.date} transform={`translate(${cx},${cy})`} style={{ cursor: 'pointer' }} onClick={() => setSelectedDate(a.date)}>
                <circle r={isSelected ? 4 : 3} fill="var(--bg)" stroke="var(--water)" strokeWidth={isSelected ? 2 : 1.5} />
                <rect x={-2} y={0} width={4} height={8} fill="var(--water)" />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

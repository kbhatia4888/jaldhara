import React from 'react';
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface LineChartProps {
  data: Record<string, unknown>[];
  lines: { dataKey: string; stroke: string; name?: string }[];
  xKey: string;
  yTickFormatter?: (v: number) => string;
  tooltipFormatter?: (v: number) => string;
  height?: number;
}

export function LineChart({
  data,
  lines,
  xKey,
  yTickFormatter,
  tooltipFormatter,
  height = 300,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={yTickFormatter}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)',
          }}
          formatter={(value: number, name: string) => [
            tooltipFormatter ? tooltipFormatter(value) : value,
            name,
          ]}
        />
        {lines.length > 1 && <Legend />}
        {lines.map(line => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            name={line.name || line.dataKey}
            strokeWidth={2}
            dot={{ r: 4, fill: line.stroke }}
            activeDot={{ r: 6 }}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import MetricCard from './MetricCard';
import usePipedriveData from '../hooks/usePipedriveData';
import { formatNumber } from '../utils/dataHelpers';

const SALES_ORANGE = '#f97316';
const WON_GREEN    = '#22c55e';
const LOST_RED     = '#ef4444';

// A palette for source bars so each source gets a distinct colour
const SOURCE_PALETTE = [
  '#f97316', '#3b82f6', '#8b5cf6', '#22c55e',
  '#f59e0b', '#06b6d4', '#ec4899', '#64748b',
];

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-slate-900 ring-1 ring-slate-600 p-3 shadow-xl text-xs">
      <p className="mb-1.5 font-semibold text-slate-300">{label}</p>
      {payload.map((e) => (
        <p key={e.name} style={{ color: e.color }} className="leading-5">
          {e.name}: <span className="font-bold">{formatNumber(e.value)}</span>
        </p>
      ))}
    </div>
  );
}

function PipedriveIcon({ className }) {
  // Simple CRM / funnel icon
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 4a1 1 0 011-1h16a1 1 0 01.8 1.6L14 13.333V20a1 1 0 01-1.447.894l-4-2A1 1 0 018 18v-4.667L3.2 5.6A1 1 0 013 4z" />
    </svg>
  );
}

function LeadSourceChart({ bySource, sourceFieldName }) {
  if (!bySource?.length) {
    return (
      <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 shadow-md flex items-center justify-center min-h-[200px]">
        <p className="text-slate-500 text-sm text-center">
          {sourceFieldName === null
            ? 'No lead source field detected in Pipedrive. Add a "Source" or "Channel" dropdown field on deals to see this breakdown.'
            : 'No source data for this period.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 shadow-md">
      <h3 className="mb-1 text-sm font-semibold text-slate-200">Leads by Source</h3>
      {sourceFieldName && (
        <p className="text-xs text-slate-500 mb-4">From Pipedrive field: <span className="text-slate-400">{sourceFieldName}</span></p>
      )}
      <ResponsiveContainer width="100%" height={Math.max(180, bySource.length * 40)}>
        <BarChart
          data={bySource}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
          <YAxis type="category" dataKey="source" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
          <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
          <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]}>
            {bySource.map((_, i) => (
              <Cell key={i} fill={SOURCE_PALETTE[i % SOURCE_PALETTE.length]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WeeklyLeadsChart({ weekly }) {
  if (!weekly?.length) return null;
  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 shadow-md">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">New Leads by Week</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={weekly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
          <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          <Bar dataKey="leads" name="New Leads" fill={SALES_ORANGE} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DealOutcomeChart({ won, lost, open }) {
  const data = [
    { label: 'Won',  value: won,  fill: WON_GREEN  },
    { label: 'Lost', value: lost, fill: LOST_RED    },
    { label: 'Open', value: open, fill: '#64748b'   },
  ].filter((d) => d.value > 0);

  if (!data.length) return null;

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 shadow-md">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">Deal Outcomes This Month</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
          <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
          <Bar dataKey="value" name="Deals" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function SalesTab({ year, month }) {
  const { data, loading, error } = usePipedriveData(year, month);
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const leads       = data?.leads       ?? {};
  const appts       = data?.appointmentsHeld ?? {};
  const conversions = data?.conversions ?? {};

  const convRateStr = conversions.conversionRate != null
    ? `${conversions.conversionRate}%`
    : leads.total > 0 ? '0%' : '—';

  // Open deals this month = created - won - lost (rough)
  const openDeals = Math.max(0, (leads.total ?? 0) - (conversions.won ?? 0) - (conversions.lost ?? 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <PipedriveIcon className="h-5 w-5 text-orange-400" />
            Sales — {monthName}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Pipedrive CRM · Leads, appointments and conversions</p>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-8 text-center text-sm text-slate-500">
          Loading Pipedrive data…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Primary KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Inbound Leads"
              value={formatNumber(leads.total ?? 0)}
              accent={SALES_ORANGE}
              subLabel="New deals created this month"
            />
            <MetricCard
              label="Appointments Held"
              value={formatNumber(appts.total ?? 0)}
              accent={SALES_ORANGE}
              subLabel={appts.stageFound === false ? 'Stage "Appointment Held" not found in Pipedrive' : 'Deals moved to Appointment Held stage'}
            />
            <MetricCard
              label="Conversions"
              value={formatNumber(conversions.won ?? 0)}
              accent={WON_GREEN}
              subLabel="Deals won this month"
            />
            <MetricCard
              label="Conversion Rate"
              value={convRateStr}
              accent={WON_GREEN}
              subLabel="Won deals / new leads"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LeadSourceChart
              bySource={leads.bySource}
              sourceFieldName={data.sourceFieldName}
            />
            <WeeklyLeadsChart weekly={leads.weekly} />
          </div>

          <DealOutcomeChart
            won={conversions.won ?? 0}
            lost={conversions.lost ?? 0}
            open={openDeals}
          />
        </>
      )}
    </div>
  );
}

const BASE = 'https://api.pipedrive.com/v1';

// ── HTTP helper ────────────────────────────────────────────────────────────────

async function pd(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_token', process.env.PIPEDRIVE_API_TOKEN);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(String(k), String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Pipedrive ${res.status} on ${path}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error || `Pipedrive error on ${path}`);
  return json;
}

// Paginate through every page of a collection endpoint (GET only)
async function fetchAll(path, params = {}) {
  const items = [];
  let start = 0;
  const limit = 500;
  for (;;) {
    const json = await pd(path, { ...params, start, limit });
    const data = json.data ?? [];
    items.push(...data);
    if (!json.additional_data?.pagination?.more_items_in_collection) break;
    start += data.length;
  }
  return items;
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }

function monthRange(year, month) { // month is 1-indexed
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
}

// Pipedrive timestamps are "YYYY-MM-DD HH:MM:SS" in the account's timezone.
// We compare only the date portion (first 10 chars).
function inMonth(dateStr, start, end) {
  if (!dateStr) return false;
  const d = String(dateStr).slice(0, 10);
  return d >= start && d <= end;
}

// ── Source field detection ─────────────────────────────────────────────────────
// Priority:
//   1. Explicit override via PIPEDRIVE_SOURCE_FIELD env var (exact field name match)
//   2. Field whose options contain the known source prefixes used in this account
//   3. Field whose name contains a generic source/channel keyword

const SOURCE_NAME_KEYWORDS = ['source', 'channel', 'origin', 'utm', 'medium', 'lead source'];

// Option label prefixes known to exist in this Pipedrive account
const KNOWN_PREFIXES = ['referral -', 'paid -', 'inbound -', 'outbound -'];

function fieldHasKnownOptions(field) {
  if (!field.options?.length) return false;
  return field.options.some((o) =>
    KNOWN_PREFIXES.some((prefix) => String(o.label).toLowerCase().startsWith(prefix)),
  );
}

function findSourceField(fields) {
  const enumFields = fields.filter(
    (f) => f.field_type === 'enum' || f.field_type === 'set',
  );

  // 1. Explicit env override
  const override = process.env.PIPEDRIVE_SOURCE_FIELD?.trim().toLowerCase();
  if (override) {
    const match = fields.find((f) => f.name.toLowerCase() === override);
    if (match) return match;
  }

  // 2. Field whose options match the known source label patterns
  const byOptions = enumFields.find(fieldHasKnownOptions);
  if (byOptions) return byOptions;

  // 3. Field whose name contains a generic keyword
  const byName = fields.find(
    (f) =>
      (f.field_type === 'enum' || f.field_type === 'set' || f.field_type === 'varchar') &&
      SOURCE_NAME_KEYWORDS.some((kw) => f.name.toLowerCase().includes(kw)),
  );
  return byName ?? null;
}

// Resolve enum value IDs to labels using the field's options array
function buildEnumMap(field) {
  if (!field?.options) return null;
  return Object.fromEntries(field.options.map((o) => [String(o.id), o.label]));
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.PIPEDRIVE_API_TOKEN;
  if (!token) {
    return res.status(503).json({
      error: 'PIPEDRIVE_API_TOKEN is not configured. Add it to your environment variables.',
    });
  }

  const year  = parseInt(req.query.year,  10);
  const month = parseInt(req.query.month, 10); // 1-indexed
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Provide valid year and month (1–12) query params.' });
  }

  const { start, end } = monthRange(year, month);

  try {
    // Fetch deal fields, all deals, and pipeline stages in parallel
    const [dealFieldsRes, allDeals, stagesRes] = await Promise.all([
      pd('/dealFields', { limit: 100 }),
      fetchAll('/deals', { status: 'all_not_deleted' }),
      fetchAll('/stages'),
    ]);

    const dealFields = dealFieldsRes.data ?? [];
    const sourceField = findSourceField(dealFields);
    const enumMap    = buildEnumMap(sourceField);

    // Find the "Appointment Held" stage (case-insensitive)
    const apptStage = stagesRes.find(
      (s) => s.name.trim().toLowerCase() === 'appointment held',
    );

    // ── Filter deals to the selected month ──────────────────────────────────
    // "Inbound leads" = deals created this month
    const newDeals = allDeals.filter((d) => inMonth(d.add_time, start, end));

    // "Conversions / new clients" = deals won this month
    const wonDeals = allDeals.filter(
      (d) => d.status === 'won' && inMonth(d.won_time, start, end),
    );

    // Deals lost this month (for funnel context)
    const lostDeals = allDeals.filter(
      (d) => d.status === 'lost' && inMonth(d.close_time, start, end),
    );

    // ── Appointments held ────────────────────────────────────────────────────
    // Count deals whose stage was changed to "Appointment Held" this month.
    // stage_change_time reflects when the deal last moved to its current stage.
    const appointmentsHeld = apptStage
      ? allDeals.filter(
          (d) =>
            d.stage_id === apptStage.id &&
            inMonth(d.stage_change_time, start, end),
        )
      : [];

    // ── Source breakdown ─────────────────────────────────────────────────────
    const sourceKey = sourceField?.key ?? null;
    const sourceCounts = {};

    for (const deal of newDeals) {
      let label = 'Unknown';
      if (sourceKey && deal[sourceKey] != null) {
        const raw = String(deal[sourceKey]);
        // enum fields store the option ID; resolve to label if possible
        label = (enumMap && enumMap[raw]) ? enumMap[raw] : raw;
      }
      sourceCounts[label] = (sourceCounts[label] ?? 0) + 1;
    }

    const bySource = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // ── Weekly new-deal trend ─────────────────────────────────────────────────
    const weeklyMap = {};
    for (const deal of newDeals) {
      const day = parseInt(String(deal.add_time).slice(8, 10), 10);
      const wk  = `Wk ${Math.floor((day - 1) / 7) + 1}`;
      weeklyMap[wk] = (weeklyMap[wk] ?? 0) + 1;
    }
    const weekOrder = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'];
    const weeklyLeads = weekOrder
      .filter((w) => weeklyMap[w] != null)
      .map((w) => ({ week: w, leads: weeklyMap[w] ?? 0 }));

    // ── Conversion rate ───────────────────────────────────────────────────────
    const conversionRate = newDeals.length > 0
      ? parseFloat(((wonDeals.length / newDeals.length) * 100).toFixed(1))
      : null;

    res.json({
      period:    { year, month, start, end },
      sourceFieldName: sourceField?.name ?? null,
      leads: {
        total:   newDeals.length,
        bySource,
        weekly:  weeklyLeads,
      },
      appointmentsHeld: {
        total:          appointmentsHeld.length,
        stageFound:     !!apptStage,
      },
      conversions: {
        won:            wonDeals.length,
        lost:           lostDeals.length,
        conversionRate,
      },
    });
  } catch (err) {
    console.error('Pipedrive error:', err.message);
    res.status(502).json({ error: err.message });
  }
}

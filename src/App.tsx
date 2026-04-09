import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Job {
  code: string;
  description: string;
  status: string;
  latitude: number;
  longitude: number;
  address1: string;
  city: string;
  state: string;
  zip: string;
  createdDate: string;
  jobType: string;
  // from Spectrum
  division: string;
  startDate: string;
  estCompleteDate: string;
  originalContract: number | null;
  pmCode: string;
  // from Job Totals
  percentComplete: number | null;
  estProfit: number | null;
  billedJTD: number | null;
  projectedCost: number | null;
}

// ─── Division → readable job type ────────────────────────────────────────────
const DIVISION_MAP: Record<string, string> = {
  RES:  'Residential',
  SF:   'Residential',
  MF:   'Multi-Family',
  COM:  'Commercial',
  IND:  'Industrial',
  DOT:  'Transportation',
  TRAN: 'Transportation',
  UTIL: 'Utilities',
  MUN:  'Municipal',
  MISC: 'Miscellaneous',
  ELEC: 'Electrical',
};

function divToType(div: string): string {
  const key = (div ?? '').trim().toUpperCase();
  return DIVISION_MAP[key] ?? (key || 'Unclassified');
}

// ─── Formatting helpers ───────────────────────────────────────────────────────
function statusColor(s: string): string {
  switch (s?.toLowerCase()) {
    case 'active':    return '#22c55e';
    case 'inactive':  return '#f59e0b';
    case 'completed': return '#6b7280';
    default:          return '#94a3b8';
  }
}

function fmtDate(s: string): string {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

// ─── Map pin icon ─────────────────────────────────────────────────────────────
function buildIcon(color: string, selected: boolean) {
  const size = selected ? 34 : 26;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px; height:${size}px;
      background:${color};
      border:${selected ? 3 : 2}px solid #fff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px ${selected ? 10 : 5}px rgba(0,0,0,0.5);
      transition:all .2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size - 4],
  });
}

// ─── PanTo helper (no zoom change) ───────────────────────────────────────────
function PanTo({ job }: { job: Job | null }) {
  const map = useMap();
  useEffect(() => {
    if (job) map.panTo([job.latitude, job.longitude], { animate: true, duration: 0.5 });
  }, [job, map]);
  return null;
}

// ─── Static fallback data (real Rawso jobs) ──────────────────────────────────
const FALLBACK: Job[] = [
  { code:'1142', description:'Harmon West',              status:'active',    latitude:36.110505,   longitude:-86.920735,  address1:'7315 Sonya Dr',             city:'Nashville',     state:'TN', zip:'37209', createdDate:'2024-03-12', jobType:'Residential',   division:'RES',  startDate:'2024-03-12', estCompleteDate:'2026-06-30', originalContract:2100000, pmCode:'0688', percentComplete:45, estProfit:189000,   billedJTD:945000,   projectedCost:1911000 },
  { code:'1144', description:'Thompson South Lot',       status:'active',    latitude:36.2431717,  longitude:-86.7841633, address1:'3366 Briley Pkwy',          city:'Nashville',     state:'TN', zip:'',      createdDate:'2024-05-06', jobType:'Commercial',    division:'COM',  startDate:'2024-05-06', estCompleteDate:'2025-12-31', originalContract:850000,  pmCode:'0473', percentComplete:72, estProfit:76500,    billedJTD:612000,   projectedCost:773500  },
  { code:'1149', description:'Stream Central Pike',      status:'active',    latitude:36.07405,    longitude:-86.23318,   address1:'15198 Central Pike',        city:'Lebanon',       state:'TN', zip:'37090', createdDate:'2025-07-14', jobType:'Industrial',    division:'IND',  startDate:'2025-07-14', estCompleteDate:'2026-09-30', originalContract:3400000, pmCode:'0473', percentComplete:18, estProfit:306000,   billedJTD:612000,   projectedCost:3094000 },
  { code:'1153', description:'Nolensville Town Square',  status:'active',    latitude:35.944792,   longitude:-86.666941,  address1:'7375 Nolensville Rd',       city:'Nolensville',   state:'TN', zip:'37135', createdDate:'2024-11-06', jobType:'Residential',   division:'RES',  startDate:'2024-11-06', estCompleteDate:'2026-08-30', originalContract:1750000, pmCode:'0794', percentComplete:30, estProfit:157500,   billedJTD:525000,   projectedCost:1592500 },
  { code:'1154', description:"Sam's Club",               status:'active',    latitude:36.18559625, longitude:-86.32765265,address1:'600 Willard Hagan Dr',      city:'Lebanon',       state:'TN', zip:'37090', createdDate:'2024-11-15', jobType:'Industrial',    division:'IND',  startDate:'2024-11-15', estCompleteDate:'2025-11-30', originalContract:2800000, pmCode:'0473', percentComplete:60, estProfit:252000,   billedJTD:1680000,  projectedCost:2548000 },
  { code:'1155', description:"Bucee's Fuel Center",      status:'active',    latitude:35.785068,   longitude:-86.372472,  address1:'I-24 & Joe B Jackson Pkwy', city:'Murfreesboro',  state:'TN', zip:'',      createdDate:'2024-11-13', jobType:'Commercial',    division:'COM',  startDate:'2024-11-13', estCompleteDate:'2026-02-28', originalContract:4200000, pmCode:'0116', percentComplete:55, estProfit:378000,   billedJTD:2310000,  projectedCost:3822000 },
  { code:'1156', description:"Buc-ee's Spoils Export",   status:'active',    latitude:35.781721,   longitude:-86.3759248, address1:'3355 Elam Road',            city:'Murfreesboro',  state:'TN', zip:'37127', createdDate:'2025-09-17', jobType:'Commercial',    division:'COM',  startDate:'2025-09-17', estCompleteDate:'2026-04-30', originalContract:620000,  pmCode:'0116', percentComplete:80, estProfit:55800,    billedJTD:496000,   projectedCost:564200  },
  { code:'1157', description:'Stephens Valley Downtown', status:'active',    latitude:36.0310441,  longitude:-86.9642883, address1:'441 Union Bridge Rd',       city:'Nashville',     state:'TN', zip:'37221', createdDate:'2025-02-05', jobType:'Residential',   division:'RES',  startDate:'2025-02-05', estCompleteDate:'2026-10-31', originalContract:5100000, pmCode:'0794', percentComplete:25, estProfit:459000,   billedJTD:1275000,  projectedCost:4641000 },
  { code:'1159', description:'TPA Springfield Highway',  status:'active',    latitude:36.34451,    longitude:-86.720039,  address1:'852-886 US-41',             city:'Goodlettsville',state:'TN', zip:'37072', createdDate:'2025-04-15', jobType:'Industrial',    division:'IND',  startDate:'2025-04-15', estCompleteDate:'2026-06-30', originalContract:1900000, pmCode:'0688', percentComplete:40, estProfit:171000,   billedJTD:760000,   projectedCost:1729000 },
  { code:'1160', description:"Buc-ee's Offsite",         status:'active',    latitude:35.785068,   longitude:-86.372472,  address1:'I-24 & Joe B Jackson Pkwy', city:'Murfreesboro',  state:'TN', zip:'37130', createdDate:'2025-03-26', jobType:'Transportation',division:'TRAN', startDate:'2025-03-26', estCompleteDate:'2026-03-31', originalContract:480000,  pmCode:'0116', percentComplete:90, estProfit:43200,    billedJTD:432000,   projectedCost:436800  },
  { code:'R1001',description:'Bradyville Pike Property', status:'active',    latitude:35.78931,    longitude:-86.29723,   address1:'5969 Bradyville Pike',      city:'Murfreesboro',  state:'TN', zip:'',      createdDate:'2019-01-22', jobType:'Miscellaneous', division:'MISC', startDate:'2019-01-22', estCompleteDate:'',           originalContract:null,    pmCode:'',     percentComplete:null,estProfit:null,      billedJTD:null,     projectedCost:null    },
  { code:'9998', description:'Office / Internal',        status:'active',    latitude:35.85173,    longitude:-86.40334,   address1:'819 Scott Street',          city:'Murfreesboro',  state:'TN', zip:'37129', createdDate:'2019-01-22', jobType:'Miscellaneous', division:'MISC', startDate:'2019-01-22', estCompleteDate:'',           originalContract:null,    pmCode:'',     percentComplete:null,estProfit:null,      billedJTD:null,     projectedCost:null    },
  { code:'1045', description:'TDOT CNS005 Williamson Co',status:'inactive',  latitude:35.854323,   longitude:-86.658868,  address1:'7960 Nolensville Rd',       city:'Arrington',     state:'TN', zip:'37014', createdDate:'2019-01-22', jobType:'Transportation',division:'DOT',  startDate:'2019-01-22', estCompleteDate:'2022-12-31', originalContract:1200000, pmCode:'',     percentComplete:98, estProfit:108000,   billedJTD:1176000,  projectedCost:1092000 },
  { code:'1042', description:'Murfreesboro Fire #4',     status:'completed', latitude:35.857407,   longitude:-86.414837,  address1:'1839 Medical Center Pkwy',  city:'Murfreesboro',  state:'TN', zip:'37129', createdDate:'2019-01-22', jobType:'Commercial',    division:'COM',  startDate:'2019-01-22', estCompleteDate:'2021-06-30', originalContract:890000,  pmCode:'',     percentComplete:100,estProfit:80100,    billedJTD:890000,   projectedCost:809900  },
  { code:'1044', description:'Benton Nissan',            status:'completed', latitude:35.65,       longitude:-87.011833,  address1:'1525 Nashville Highway',    city:'Columbia',      state:'TN', zip:'38401', createdDate:'2019-01-22', jobType:'Commercial',    division:'COM',  startDate:'2019-01-22', estCompleteDate:'2020-09-30', originalContract:760000,  pmCode:'',     percentComplete:100,estProfit:68400,    billedJTD:760000,   projectedCost:691600  },
];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Job | null>(null);
  const [flyTarget, setFlyTarget] = useState<Job | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType,   setFilterType]   = useState('all');

  // ── Load & join datasets ────────────────────────────────────────────────────
  useEffect(() => {
    const domo = (window as any).domo;
    if (domo?.get) {
      Promise.all([
        domo.get('/data/v1/jobs'),
        domo.get('/data/v1/spectrum_jobs'),
        domo.get('/data/v1/job_totals'),
      ]).then(([hcss, spectrum, totals]: [Record<string,unknown>[], Record<string,unknown>[], Record<string,unknown>[]]) => {
        // Build lookup maps keyed by trimmed job number
        const specMap: Record<string, Record<string,unknown>> = {};
        for (const r of spectrum) {
          const k = String(r['Job_Number'] ?? '').trim();
          if (!specMap[k]) specMap[k] = r;
        }
        const totMap: Record<string, Record<string,unknown>> = {};
        for (const r of totals) {
          const k = String(r['Job_Number'] ?? '').trim();
          if (!totMap[k]) totMap[k] = r;
        }
        setJobs(mergeRows(hcss, specMap, totMap));
        setLoading(false);
      }).catch(() => { setJobs(FALLBACK); setLoading(false); });
    } else {
      setJobs(FALLBACK);
      setLoading(false);
    }
  }, []);

  function mergeRows(
    hcss: Record<string,unknown>[],
    specMap: Record<string,Record<string,unknown>>,
    totMap: Record<string,Record<string,unknown>>,
  ): Job[] {
    return hcss
      .filter(r => Number(r.latitude) !== 0 && r.latitude != null)
      .map(r => {
        const code = String(r.code ?? '').trim();
        const sp   = specMap[code] ?? {};
        const tot  = totMap[code]  ?? {};
        const div  = String(sp['Division'] ?? '').trim().toUpperCase();
        return {
          code,
          description:      String(r.description ?? ''),
          status:           String(r.status ?? ''),
          latitude:         Number(r.latitude),
          longitude:        Number(r.longitude),
          address1:         String(r.address1 ?? ''),
          city:             String(r.city ?? ''),
          state:            String(r.state ?? ''),
          zip:              String(r.zip ?? ''),
          createdDate:      String(r.createdDate ?? '').slice(0,10),
          jobType:          divToType(div),
          division:         div,
          startDate:        String(sp['Start_Date'] ?? '').slice(0,10),
          estCompleteDate:  String(sp['Est_Complete_Date'] ?? '').slice(0,10),
          originalContract: sp['Original_Contract'] != null ? Number(sp['Original_Contract']) : null,
          pmCode:           String(sp['Project_Manager'] ?? '').trim(),
          percentComplete:  tot['Percent_Complete'] != null ? Number(tot['Percent_Complete']) : null,
          estProfit:        tot['Est_Profit']  != null ? Number(tot['Est_Profit'])  : null,
          billedJTD:        tot['Billed_JTD']  != null ? Number(tot['Billed_JTD'])  : null,
          projectedCost:    tot['Projected_Cost'] != null ? Number(tot['Projected_Cost']) : null,
        };
      });
  }

  // ── Derived filter options ──────────────────────────────────────────────────
  const statuses = ['all', ...Array.from(new Set(jobs.map(j => j.status.toLowerCase()))).sort()];
  const jobTypes = ['all', ...Array.from(new Set(jobs.map(j => j.jobType))).sort()];

  const filtered = jobs.filter(j => {
    const sOk = filterStatus === 'all' || j.status.toLowerCase() === filterStatus;
    const tOk = filterType   === 'all' || j.jobType === filterType;
    return sOk && tOk;
  });

  const handlePin = useCallback((job: Job) => {
    setSelected(job);
    setFlyTarget(job);
  }, []);

  const center: [number, number] = [36.0, -86.7];

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="header-accent" />
          <span className="header-title">Active Job Map</span>
          <span className="header-sub">Rawso Constructors</span>
        </div>
        <div className="header-filters">
          <label className="filter-group">
            <span>Status</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : capitalize(s)}</option>)}
            </select>
          </label>
          <label className="filter-group">
            <span>Job Type</span>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              {jobTypes.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
            </select>
          </label>
          <div className="job-count">{filtered.length} job{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="main">
        {/* Map */}
        <div className="map-wrap">
          {loading ? (
            <div className="loading">Loading jobs…</div>
          ) : (
            <MapContainer center={center} zoom={9} className="map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
              />
              <PanTo job={flyTarget} />
              {filtered.map(job => (
                <Marker
                  key={job.code}
                  position={[job.latitude, job.longitude]}
                  icon={buildIcon(statusColor(job.status), selected?.code === job.code)}
                  eventHandlers={{ click: () => handlePin(job) }}
                />
              ))}
            </MapContainer>
          )}
        </div>

        {/* Detail panel */}
        <aside className={`detail-panel ${selected ? 'open' : ''}`}>
          {selected ? (
            <>
              <button className="close-btn" onClick={() => setSelected(null)}>✕</button>

              <div className="detail-header">
                <div className="detail-status-dot" style={{ background: statusColor(selected.status) }} />
                <h2 className="detail-code">{selected.code}</h2>
              </div>
              <p className="detail-desc">{selected.description}</p>

              <div className="detail-badges">
                <span className="badge" style={{ background: statusColor(selected.status) + '22', color: statusColor(selected.status), border: `1px solid ${statusColor(selected.status)}55` }}>
                  {capitalize(selected.status)}
                </span>
                {selected.jobType && <span className="badge type-badge">{selected.jobType}</span>}
              </div>

              {/* Progress bar — no % label */}
              {selected.percentComplete != null && (
                <div className="progress-wrap">
                  <div className="progress-label">
                    <span>Progress</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(selected.percentComplete, 100)}%`, background: statusColor(selected.status) }} />
                  </div>
                </div>
              )}

              {/* Financials — labels only, no dollar amounts */}
              {(selected.originalContract != null || selected.estProfit != null || selected.billedJTD != null) && (
                <div className="fin-grid">
                  {selected.originalContract != null && (
                    <div className="fin-cell">
                      <div className="fin-label">Contract</div>
                      <div className="fin-bar-wrap"><div className="fin-bar" style={{ width: '100%', background: '#F36E2240' }} /></div>
                    </div>
                  )}
                  {selected.billedJTD != null && selected.originalContract != null && (
                    <div className="fin-cell">
                      <div className="fin-label">Billed JTD</div>
                      <div className="fin-bar-wrap"><div className="fin-bar" style={{ width: `${Math.min((selected.billedJTD / selected.originalContract) * 100, 100)}%`, background: '#4ECDC460' }} /></div>
                    </div>
                  )}
                  {selected.estProfit != null && selected.originalContract != null && (
                    <div className="fin-cell">
                      <div className="fin-label">Est. Profit</div>
                      <div className="fin-bar-wrap"><div className="fin-bar profit-bar" style={{ width: `${Math.min((selected.estProfit / selected.originalContract) * 100, 100)}%` }} /></div>
                    </div>
                  )}
                  {selected.projectedCost != null && selected.originalContract != null && (
                    <div className="fin-cell">
                      <div className="fin-label">Projected Cost</div>
                      <div className="fin-bar-wrap"><div className="fin-bar" style={{ width: `${Math.min((selected.projectedCost / selected.originalContract) * 100, 100)}%`, background: '#94a3b840' }} /></div>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              {(selected.startDate || selected.estCompleteDate) && (
                <div className="detail-section">
                  <div className="detail-row">
                    <div>
                      <div className="detail-label">Start Date</div>
                      <div className="detail-value">{fmtDate(selected.startDate)}</div>
                    </div>
                    <div>
                      <div className="detail-label">Est. Completion</div>
                      <div className="detail-value">{fmtDate(selected.estCompleteDate)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="detail-section">
                <div className="detail-label">Address</div>
                <div className="detail-value">
                  {[selected.address1, selected.city, selected.state, selected.zip].filter(Boolean).join(', ') || 'No address on file'}
                </div>
              </div>

              {/* PM */}
              {selected.pmCode && (
                <div className="detail-section">
                  <div className="detail-label">Project Manager</div>
                  <div className="detail-value">{selected.pmCode}</div>
                </div>
              )}

              {/* Coordinates */}
              <div className="detail-section">
                <div className="detail-label">Coordinates</div>
                <div className="detail-value mono">{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</div>
              </div>

              <button
                className="maps-link"
                onClick={() => window.open(
                  `https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`,
                  '_blank',
                  'noopener,noreferrer'
                )}
              >
                Open in Google Maps ↗
              </button>
            </>
          ) : (
            <div className="detail-empty">
              <div className="detail-empty-icon">📍</div>
              <p>Click a pin to view job details</p>
            </div>
          )}
        </aside>
      </div>

      {/* Legend */}
      <footer className="legend">
        {[['active','Active'], ['inactive','Inactive'], ['completed','Completed']].map(([s, label]) => (
          <div key={s} className="legend-item">
            <div className="legend-dot" style={{ background: statusColor(s) }} />
            <span>{label}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}

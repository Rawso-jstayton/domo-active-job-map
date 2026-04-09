import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Job {
  code: string;
  description: string;
  status: 'active' | 'inactive' | 'completed' | string;
  latitude: number;
  longitude: number;
  address1: string;
  city: string;
  state: string;
  zip: string | number;
  createdDate: string;
  jobType: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function deriveJobType(code: string): string {
  if (!code) return 'Other';
  const c = code.trim().toUpperCase();
  if (c === '9998' || c.startsWith('OFF')) return 'Internal';
  if (c.startsWith('R')) return 'Real Estate';
  return 'Construction';
}

function statusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':    return '#22c55e';
    case 'inactive':  return '#f59e0b';
    case 'completed': return '#6b7280';
    default:          return '#94a3b8';
  }
}

function statusLabel(status: string): string {
  return status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : 'Unknown';
}

function buildIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:28px; height:28px;
        background:${color};
        border:3px solid #fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
      "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

// ─── Fly-to helper ────────────────────────────────────────────────────────────
function FlyTo({ job }: { job: Job | null }) {
  const map = useMap();
  useEffect(() => {
    if (job) map.flyTo([job.latitude, job.longitude], 14, { duration: 0.8 });
  }, [job, map]);
  return null;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Job | null>(null);
  const [flyTarget, setFlyTarget] = useState<Job | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // ── Load from DOMO ──────────────────────────────────────────────────────────
  useEffect(() => {
    const domoData = (window as any).domo;
    if (domoData?.get) {
      domoData.get('/data/v1/jobs').then((rows: Record<string, unknown>[]) => {
        setJobs(mapRows(rows));
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      // Dev fallback — real data sampled from HCSS dataset
      setJobs([
        { code: '1142',  description: 'Harmon West',                   status: 'active',    latitude: 36.110505,   longitude: -86.920735,  address1: '7315 Sonya Dr',                 city: 'Nashville',     state: 'TN', zip: 37209, createdDate: '2024-03-12', jobType: 'Construction' },
        { code: '1144',  description: 'Thompson South Lot',            status: 'active',    latitude: 36.2431717,  longitude: -86.7841633, address1: '3366 Briley Parkway',            city: 'Nashville',     state: 'TN', zip: '',    createdDate: '2024-05-06', jobType: 'Construction' },
        { code: '1149',  description: 'Stream Central Pike',           status: 'active',    latitude: 36.07405,    longitude: -86.23318,   address1: '15198-15232 Central Pike',      city: 'Lebanon',       state: 'TN', zip: 37090, createdDate: '2025-07-14', jobType: 'Construction' },
        { code: '1153',  description: 'Nolensville Town Square',       status: 'active',    latitude: 35.944792,   longitude: -86.666941,  address1: '7375 Nolensville Road',         city: 'Nolensville',   state: 'TN', zip: 37135, createdDate: '2024-11-06', jobType: 'Construction' },
        { code: '1154',  description: "Sam's Club",                    status: 'active',    latitude: 36.18559625, longitude: -86.32765265,address1: '600 Willard Hagan Drive',       city: 'Lebanon',       state: 'TN', zip: 37090, createdDate: '2024-11-15', jobType: 'Construction' },
        { code: '1155',  description: "Bucee's Fuel Center",           status: 'active',    latitude: 35.785068,   longitude: -86.372472,  address1: 'I-24 & Joe B Jackson Pkwy',    city: 'Murfreesboro',  state: 'TN', zip: '',    createdDate: '2024-11-13', jobType: 'Construction' },
        { code: '1156',  description: "Buc-ee's Spoils Export",        status: 'active',    latitude: 35.781721,   longitude: -86.3759248, address1: '3355 Elam Road',                city: 'Murfreesboro',  state: 'TN', zip: 37127, createdDate: '2025-09-17', jobType: 'Construction' },
        { code: '1157',  description: 'Stephens Valley Downtown',      status: 'active',    latitude: 36.0310441,  longitude: -86.9642883, address1: '441 Union Bridge Rd',           city: 'Nashville',     state: 'TN', zip: 37221, createdDate: '2025-02-05', jobType: 'Construction' },
        { code: '1159',  description: 'TPA Springfield Highway',       status: 'active',    latitude: 36.34451,    longitude: -86.720039,  address1: '852-886 US-41',                 city: 'Goodlettsville',state: 'TN', zip: 37072, createdDate: '2025-04-15', jobType: 'Construction' },
        { code: '1160',  description: "Buc-ee's Offsite",              status: 'active',    latitude: 35.785068,   longitude: -86.372472,  address1: 'I-24 & Joe B Jackson Pkwy',    city: 'Murfreesboro',  state: 'TN', zip: 37130, createdDate: '2025-03-26', jobType: 'Construction' },
        { code: 'R1001', description: 'Bradyville Pike Property',      status: 'active',    latitude: 35.78931,    longitude: -86.29723,   address1: '5969 Bradyville Pike',          city: 'Murfreesboro',  state: 'TN', zip: '',    createdDate: '2019-01-22', jobType: 'Real Estate'  },
        { code: '9998',  description: 'Office / Internal',             status: 'active',    latitude: 35.85173,    longitude: -86.40334,   address1: '819 Scott Street',              city: 'Murfreesboro',  state: 'TN', zip: 37129, createdDate: '2019-01-22', jobType: 'Internal'     },
        { code: '1045',  description: 'TDOT CNS005 Williamson County', status: 'inactive',  latitude: 35.854323,   longitude: -86.658868,  address1: '7960 Nolensville Road',         city: 'Arrington',     state: 'TN', zip: 37014, createdDate: '2019-01-22', jobType: 'Construction' },
        { code: '1042',  description: 'Murfreesboro Fire #4',          status: 'completed', latitude: 35.857407,   longitude: -86.414837,  address1: '1839 Medical Center Pkwy',      city: 'Murfreesboro',  state: 'TN', zip: 37129, createdDate: '2019-01-22', jobType: 'Construction' },
        { code: '1044',  description: 'Benton Nissan',                 status: 'completed', latitude: 35.65,       longitude: -87.011833,  address1: '1525 Nashville Highway',        city: 'Columbia',      state: 'TN', zip: 38401, createdDate: '2019-01-22', jobType: 'Construction' },
      ]);
      setLoading(false);
    }
  }, []);

  function mapRows(rows: Record<string, unknown>[]): Job[] {
    return rows
      .filter(r => Number(r.latitude) !== 0 && Number(r.longitude) !== 0)
      .map(r => ({
        code:        String(r.code ?? ''),
        description: String(r.description ?? ''),
        status:      String(r.status ?? ''),
        latitude:    Number(r.latitude),
        longitude:   Number(r.longitude),
        address1:    String(r.address1 ?? ''),
        city:        String(r.city ?? ''),
        state:       String(r.state ?? ''),
        zip:         String(r.zip ?? ''),
        createdDate: String(r.createdDate ?? '').slice(0, 10),
        jobType:     deriveJobType(String(r.code ?? '')),
      }));
  }

  // ── Filters ─────────────────────────────────────────────────────────────────
  const statuses  = ['all', ...Array.from(new Set(jobs.map(j => j.status.toLowerCase()))).sort()];
  const jobTypes  = ['all', ...Array.from(new Set(jobs.map(j => j.jobType))).sort()];

  const filtered = jobs.filter(j => {
    const statusOk = filterStatus === 'all' || j.status.toLowerCase() === filterStatus;
    const typeOk   = filterType   === 'all' || j.jobType === filterType;
    return statusOk && typeOk;
  });

  const handleMarkerClick = useCallback((job: Job) => {
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
              {statuses.map(s => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Statuses' : statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-group">
            <span>Job Type</span>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              {jobTypes.map(t => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All Types' : t}
                </option>
              ))}
            </select>
          </label>
          <div className="job-count">{filtered.length} job{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="main">
        {/* ── Map ── */}
        <div className="map-wrap">
          {loading ? (
            <div className="loading">Loading jobs…</div>
          ) : (
            <MapContainer center={center} zoom={9} className="map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyTo job={flyTarget} />
              {filtered.map(job => (
                <Marker
                  key={job.code}
                  position={[job.latitude, job.longitude]}
                  icon={buildIcon(statusColor(job.status))}
                  eventHandlers={{ click: () => handleMarkerClick(job) }}
                >
                  <Popup>
                    <strong>{job.code}</strong><br />
                    {job.description}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* ── Detail panel ── */}
        <aside className={`detail-panel ${selected ? 'open' : ''}`}>
          {selected ? (
            <>
              <button className="close-btn" onClick={() => setSelected(null)}>✕</button>
              <div className="detail-status-dot" style={{ background: statusColor(selected.status) }} />
              <h2 className="detail-code">{selected.code}</h2>
              <p className="detail-desc">{selected.description}</p>

              <div className="detail-badges">
                <span className="badge" style={{ background: statusColor(selected.status) + '22', color: statusColor(selected.status), border: `1px solid ${statusColor(selected.status)}55` }}>
                  {statusLabel(selected.status)}
                </span>
                <span className="badge type-badge">{selected.jobType}</span>
              </div>

              <div className="detail-section">
                <div className="detail-label">Address</div>
                <div className="detail-value">
                  {[selected.address1, selected.city, selected.state, selected.zip]
                    .filter(Boolean).join(', ') || 'No address on file'}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Coordinates</div>
                <div className="detail-value mono">
                  {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Created</div>
                <div className="detail-value">
                  {selected.createdDate ? new Date(selected.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </div>
              </div>

              <a
                className="maps-link"
                href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps ↗
              </a>
            </>
          ) : (
            <div className="detail-empty">
              <div className="detail-empty-icon">📍</div>
              <p>Click a pin to view job details</p>
            </div>
          )}
        </aside>
      </div>

      {/* ── Legend ── */}
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

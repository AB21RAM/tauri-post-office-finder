import './App.css'

import { invoke } from '@tauri-apps/api/core'
import { useMemo, useState, type FormEvent } from 'react'

type PostOffice = {
  Name: string
  Description?: string | null
  BranchType?: string | null
  DeliveryStatus?: string | null
  Circle?: string | null
  District?: string | null
  Division?: string | null
  Region?: string | null
  State?: string | null
  Country?: string | null
  Pincode?: string | null
}

type IndiaPostResponse = {
  Message: string
  Status: string
  PostOffice?: PostOffice[] | null
}

type Mode = 'pincode' | 'name'

function App() {
  const [mode, setMode] = useState<Mode>('pincode')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<IndiaPostResponse | null>(null)

  const results = useMemo(() => data?.PostOffice ?? [], [data])

  async function onSearch(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setData(null)
    setLoading(true)

    try {
      const resp =
        mode === 'pincode'
          ? await invoke<IndiaPostResponse>('search_by_pincode', { pincode: query })
          : await invoke<IndiaPostResponse>('search_by_postoffice_name', { name: query })
      setData(resp)
    } catch (err) {
      setError(typeof err === 'string' ? err : (err as Error)?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <div className="mark" aria-hidden="true">
            <span />
          </div>
          <div>
            <div className="title">Post Office Finder</div>
            <div className="subtitle">Fast India Post lookup (free public API)</div>
          </div>
        </div>
      </header>

      <main className="content">
        <section className="card searchCard">
          <div className="tabs" role="tablist" aria-label="Search mode">
            <button
              type="button"
              className={mode === 'pincode' ? 'tab active' : 'tab'}
              onClick={() => {
                setMode('pincode')
                setQuery('')
                setError(null)
                setData(null)
              }}
              role="tab"
              aria-selected={mode === 'pincode'}
            >
              By Pincode
            </button>
            <button
              type="button"
              className={mode === 'name' ? 'tab active' : 'tab'}
              onClick={() => {
                setMode('name')
                setQuery('')
                setError(null)
                setData(null)
              }}
              role="tab"
              aria-selected={mode === 'name'}
            >
              By Name
            </button>
          </div>

          <form className="searchRow" onSubmit={onSearch}>
            <label className="field">
              <span className="label">
                {mode === 'pincode' ? 'Pincode (6 digits)' : 'Post Office name'}
              </span>
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === 'pincode' ? 'e.g. 110001' : 'e.g. Connaught Place'}
                inputMode={mode === 'pincode' ? 'numeric' : 'text'}
                autoComplete="off"
              />
            </label>
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {error ? <div className="alert error">{error}</div> : null}
          {data && !error ? (
            <div className="alert ok">
              <strong>{data.Status}</strong>
              <span className="dot" aria-hidden="true" />
              <span>{data.Message}</span>
            </div>
          ) : null}
        </section>

        <section className="results">
          {loading ? (
            <div className="muted">Loading results…</div>
          ) : results.length === 0 ? (
            <div className="muted">
              {data ? 'No post offices found for this query.' : 'Search to see results.'}
            </div>
          ) : (
            <div className="grid">
              {results.map((po) => (
                <article className="card resultCard" key={`${po.Name}-${po.Pincode ?? ''}`}>
                  <div className="resultTop">
                    <div className="resultName">{po.Name}</div>
                    {po.Pincode ? <div className="pill">{po.Pincode}</div> : null}
                  </div>

                  <div className="meta">
                    <div className="metaRow">
                      <span className="k">District</span>
                      <span className="v">{po.District ?? '—'}</span>
                    </div>
                    <div className="metaRow">
                      <span className="k">State</span>
                      <span className="v">{po.State ?? '—'}</span>
                    </div>
                    <div className="metaRow">
                      <span className="k">Branch</span>
                      <span className="v">{po.BranchType ?? '—'}</span>
                    </div>
                    <div className="metaRow">
                      <span className="k">Delivery</span>
                      <span className="v">{po.DeliveryStatus ?? '—'}</span>
                    </div>
                  </div>

                  {po.Description ? <div className="desc">{po.Description}</div> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        Data source: India Post public API • Works offline? No (needs internet)
      </footer>
    </div>
  )
}

export default App

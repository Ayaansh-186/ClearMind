'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, RefreshCw, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react'
import type { Note, Cluster } from '@/lib/types'
import { clusterColors, clusters } from '@/lib/types'

// ─── D3 types (loaded at runtime, not bundled) ────────────────────────────────
declare const d3: any

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ─── Graph data types ─────────────────────────────────────────────────────────
type GraphNode = {
  id: string
  title: string
  cluster: Cluster | null
  relevance: number
  raw_content: string
  // D3 mutable properties
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

type GraphEdge = {
  source: string | GraphNode
  target: string | GraphNode
  strength: number  // 0-1, used for edge opacity
}

// ─── Build graph data from notes ──────────────────────────────────────────────
function buildGraph(notes: Note[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const active = notes.filter(n => !n.is_archived && n.cluster)

  const nodes: GraphNode[] = active.map(n => ({
    id: n.id,
    title: n.title ?? 'Untitled',
    cluster: n.cluster,
    relevance: n.relevance,
    raw_content: n.raw_content,
  }))

  const edges: GraphEdge[] = []
  const seen = new Set<string>()

  // Link notes in the same cluster — each note connects to up to 3 nearest
  // same-cluster neighbours (by insertion order, keeps graph readable)
  const byCluster: Record<string, GraphNode[]> = {}
  for (const node of nodes) {
    if (!node.cluster) continue
    if (!byCluster[node.cluster]) byCluster[node.cluster] = []
    byCluster[node.cluster].push(node)
  }

  for (const clusterNodes of Object.values(byCluster)) {
    for (let i = 0; i < clusterNodes.length; i++) {
      // Connect to next 3 in cluster (ring + forward links = readable density)
      for (let j = i + 1; j < Math.min(i + 4, clusterNodes.length); j++) {
        const a = clusterNodes[i].id
        const b = clusterNodes[j].id
        const key = [a, b].sort().join('|')
        if (!seen.has(key)) {
          seen.add(key)
          // Closer neighbours get stronger links
          edges.push({ source: a, target: b, strength: j - i === 1 ? 1 : 0.4 })
        }
      }
    }
  }

  // Cross-cluster bridge: connect the highest-relevance note in each cluster
  // to the highest-relevance note in each other cluster (weak bridge links)
  const clusterTops = Object.entries(byCluster).map(([c, ns]) => ({
    cluster: c,
    node: [...ns].sort((a, b) => b.relevance - a.relevance)[0],
  }))

  for (let i = 0; i < clusterTops.length; i++) {
    for (let j = i + 1; j < clusterTops.length; j++) {
      const a = clusterTops[i].node?.id
      const b = clusterTops[j].node?.id
      if (!a || !b) continue
      const key = [a, b].sort().join('|')
      if (!seen.has(key)) {
        seen.add(key)
        edges.push({ source: a, target: b, strength: 0.15 })
      }
    }
  }

  return { nodes, edges }
}

// ─── Cluster dot colours (graph uses the dot colour from lib/types) ───────────
const CLUSTER_DOT: Record<string, string> = {
  work: '#7F77DD',
  ideas: '#1D9E75',
  personal: '#D85A30',
  learning: '#378ADD',
  health: '#639922',
}

function clusterDot(cluster: Cluster | null): string {
  return cluster ? (CLUSTER_DOT[cluster] ?? '#71717a') : '#71717a'
}

// ─── Tooltip component ────────────────────────────────────────────────────────
type TooltipState = {
  x: number; y: number
  node: GraphNode
} | null

function NodeTooltip({ tip, onOpen }: { tip: TooltipState; onOpen: (id: string) => void }) {
  if (!tip) return null
  const colors = tip.node.cluster ? clusterColors[tip.node.cluster] : null
  return (
    <div
      className="pointer-events-none absolute z-20 max-w-[220px] rounded-xl border border-zinc-700 bg-zinc-900/95 p-3 shadow-2xl backdrop-blur"
      style={{ left: tip.x + 14, top: tip.y - 10 }}
    >
      {colors && tip.node.cluster && (
        <span
          className="mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
          style={{ backgroundColor: colors.bg + '33', color: colors.text }}
        >
          {tip.node.cluster}
        </span>
      )}
      <p className="text-xs font-semibold leading-snug text-zinc-100">{tip.node.title}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
        {tip.node.raw_content.slice(0, 100)}{tip.node.raw_content.length > 100 ? '…' : ''}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`h-1 w-1 rounded-full ${i < tip.node.relevance ? 'bg-zinc-200' : 'bg-zinc-700'}`} />
          ))}
        </div>
        <span className="text-[10px] text-zinc-500">{tip.node.relevance}/10</span>
      </div>
      <p className="pointer-events-auto mt-2 cursor-pointer text-[10px] text-zinc-500 underline"
        onClick={() => onOpen(tip.node.id)}>
        Open note →
      </p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GraphPage() {
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<any>(null)
  const zoomRef = useRef<any>(null)

  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [d3Ready, setD3Ready] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [showLegend, setShowLegend] = useState(true)
  const [stats, setStats] = useState({ nodes: 0, edges: 0 })

  // ── Load D3 from CDN ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).d3) { setD3Ready(true); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js'
    script.onload = () => setD3Ready(true)
    script.onerror = () => console.error('Failed to load D3')
    document.head.appendChild(script)
  }, [])

  // ── Auth + fetch notes ──────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = getBrowserClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) { router.replace('/login'); return }
      const userId = data.session.user.id
      const res = await fetch(`/api/notes?user_id=${userId}&archived=all`)
      if (res.ok) setNotes(await res.json())
      setLoading(false)
    })
  }, [router])

  // ── Build + render graph ────────────────────────────────────────────────────
  const renderGraph = useCallback(() => {
    if (!d3Ready || !svgRef.current || !containerRef.current || loading) return

    const { nodes, edges } = buildGraph(
      selectedCluster
        ? notes.filter(n => n.cluster === selectedCluster)
        : notes
    )
    setStats({ nodes: nodes.length, edges: edges.length })

    if (nodes.length === 0) return

    const container = containerRef.current
    const W = container.clientWidth
    const H = container.clientHeight

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H)

    // ── Defs: glow filter + arrow marker ───────────────────────────────────
    const defs = svg.append('defs')

    clusters.forEach(c => {
      const color = clusterDot(c as Cluster)
      const filter = defs.append('filter').attr('id', `glow-${c}`).attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
      filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
      const merge = filter.append('feMerge')
      merge.append('feMergeNode').attr('in', 'blur')
      merge.append('feMergeNode').attr('in', 'SourceGraphic')
    })

    // ── Zoom layer ─────────────────────────────────────────────────────────
    const g = svg.append('g').attr('class', 'zoom-layer')

    const zoom = d3.zoom()
      .scaleExtent([0.15, 4])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform)
        setTooltip(null)
      })

    svg.call(zoom)
    zoomRef.current = zoom

    // Initial zoom to center
    svg.call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(0.85))

    // ── Force simulation ───────────────────────────────────────────────────
    // Cluster gravity: each cluster has a virtual centroid, nodes are pulled toward it
    const clusterCentroids: Record<string, { x: number; y: number }> = {}
    const clusterList = [...new Set(nodes.map(n => n.cluster).filter(Boolean))] as string[]
    clusterList.forEach((c, i) => {
      const angle = (i / clusterList.length) * 2 * Math.PI
      const radius = Math.min(W, H) * 0.22
      clusterCentroids[c] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      }
    })

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((d: GraphNode) => d.id)
        .distance((d: GraphEdge) => {
          // Same-cluster links are shorter → tighter clumps
          const src = d.source as GraphNode
          const tgt = d.target as GraphNode
          return src.cluster === tgt.cluster ? 55 : 160
        })
        .strength((d: GraphEdge) => d.strength * 0.6)
      )
      .force('charge', d3.forceManyBody().strength(-220).distanceMax(350))
      .force('collision', d3.forceCollide().radius((d: GraphNode) => nodeRadius(d) + 8))
      // Cluster gravity: soft pull toward each cluster's centroid
      .force('clusterX', d3.forceX((d: GraphNode) => d.cluster ? (clusterCentroids[d.cluster]?.x ?? 0) : 0).strength(0.18))
      .force('clusterY', d3.forceY((d: GraphNode) => d.cluster ? (clusterCentroids[d.cluster]?.y ?? 0) : 0).strength(0.18))
      .force('center', d3.forceCenter(0, 0).strength(0.04))

    simulationRef.current = simulation

    // ── Edges ──────────────────────────────────────────────────────────────
    const link = g.append('g').attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', (d: GraphEdge) => {
        const src = d.source as GraphNode
        return src.cluster ? clusterDot(src.cluster) + '55' : '#ffffff22'
      })
      .attr('stroke-width', (d: GraphEdge) => d.strength > 0.5 ? 1.5 : 0.8)
      .attr('stroke-linecap', 'round')

    // ── Nodes ──────────────────────────────────────────────────────────────
    const node = g.append('g').attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event: any, d: GraphNode) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event: any, d: GraphNode) => {
            d.fx = event.x; d.fy = event.y
          })
          .on('end', (event: any, d: GraphNode) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )

    // Outer glow ring
    node.append('circle')
      .attr('r', (d: GraphNode) => nodeRadius(d) + 4)
      .attr('fill', (d: GraphNode) => clusterDot(d.cluster) + '22')
      .attr('stroke', 'none')

    // Main circle
    node.append('circle')
      .attr('r', (d: GraphNode) => nodeRadius(d))
      .attr('fill', (d: GraphNode) => clusterDot(d.cluster) + 'cc')
      .attr('stroke', (d: GraphNode) => clusterDot(d.cluster))
      .attr('stroke-width', 1.5)
      .attr('filter', (d: GraphNode) => d.cluster ? `url(#glow-${d.cluster})` : '')

    // Label (only for high-relevance or large nodes)
    node.filter((d: GraphNode) => d.relevance >= 6 || nodes.length <= 20)
      .append('text')
      .text((d: GraphNode) => d.title.length > 22 ? d.title.slice(0, 20) + '…' : d.title)
      .attr('dy', (d: GraphNode) => nodeRadius(d) + 13)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-inter), system-ui, sans-serif')
      .attr('fill', '#a1a1aa')
      .attr('pointer-events', 'none')

    // ── Interactions ───────────────────────────────────────────────────────
    node
      .on('mouseenter', (event: MouseEvent, d: GraphNode) => {
        const svgRect = svgRef.current!.getBoundingClientRect()
        setTooltip({ x: event.clientX - svgRect.left, y: event.clientY - svgRect.top, node: d })

        // Highlight connected edges
        link.attr('stroke-opacity', (e: GraphEdge) => {
          const src = (e.source as GraphNode).id
          const tgt = (e.target as GraphNode).id
          return src === d.id || tgt === d.id ? 1 : 0.1
        })

        // Dim unconnected nodes
        const connectedIds = new Set<string>([d.id])
        edges.forEach((e: GraphEdge) => {
          const src = (e.source as GraphNode).id
          const tgt = (e.target as GraphNode).id
          if (src === d.id) connectedIds.add(tgt)
          if (tgt === d.id) connectedIds.add(src)
        })
        node.attr('opacity', (n: GraphNode) => connectedIds.has(n.id) ? 1 : 0.2)
      })
      .on('mousemove', (event: MouseEvent) => {
        const svgRect = svgRef.current!.getBoundingClientRect()
        setTooltip(prev => prev ? { ...prev, x: event.clientX - svgRect.left, y: event.clientY - svgRect.top } : prev)
      })
      .on('mouseleave', () => {
        setTooltip(null)
        link.attr('stroke-opacity', 1)
        node.attr('opacity', 1)
      })
      .on('click', (_event: MouseEvent, d: GraphNode) => {
        // Navigate back with the note pre-selected via URL param
        router.push(`/?note=${d.id}`)
      })

    // ── Tick ───────────────────────────────────────────────────────────────
    simulation.on('tick', () => {
      link
        .attr('x1', (d: GraphEdge) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d: GraphEdge) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d: GraphEdge) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d: GraphEdge) => (d.target as GraphNode).y ?? 0)

      node.attr('transform', (d: GraphNode) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })
  }, [d3Ready, notes, loading, selectedCluster, router])

  useEffect(() => {
    renderGraph()
    return () => simulationRef.current?.stop()
  }, [renderGraph])

  // ── Window resize ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => renderGraph()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [renderGraph])

  function nodeRadius(d: GraphNode) {
    // 7–22px based on relevance 1–10
    return 7 + (d.relevance / 10) * 15
  }

  function zoomIn() {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.4)
  }

  function zoomOut() {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7)
  }

  function resetView() {
    if (!svgRef.current || !zoomRef.current || !containerRef.current) return
    const W = containerRef.current.clientWidth
    const H = containerRef.current.clientHeight
    d3.select(svgRef.current).transition().duration(400)
      .call(zoomRef.current.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(0.85))
  }

  function reheat() {
    simulationRef.current?.alpha(0.8).restart()
  }

  const activeNotes = notes.filter(n => !n.is_archived && n.cluster)
  const clusterCounts = clusters.reduce((acc, c) => {
    acc[c] = activeNotes.filter(n => n.cluster === c).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="h-4 w-px bg-zinc-800" />

          <div>
            <h1 className="text-sm font-semibold tracking-tight">Knowledge Graph</h1>
            <p className="text-xs text-zinc-500">
              {loading ? 'Loading…' : `${stats.nodes} notes · ${stats.edges} connections`}
            </p>
          </div>
        </div>

        {/* Cluster filter pills */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <button
            onClick={() => setSelectedCluster(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${!selectedCluster ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
          >
            All
          </button>
          {clusters.filter(c => clusterCounts[c] > 0).map(c => {
            const color = clusterColors[c]
            const active = selectedCluster === c
            return (
              <button
                key={c}
                onClick={() => setSelectedCluster(active ? null : c)}
                className="rounded-full px-3 py-1 text-xs font-medium capitalize transition"
                style={{
                  backgroundColor: active ? clusterDot(c as Cluster) + 'cc' : clusterDot(c as Cluster) + '22',
                  color: active ? '#fff' : clusterDot(c as Cluster),
                }}
              >
                {c} <span className="opacity-60">({clusterCounts[c]})</span>
              </button>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button onClick={reheat} title="Re-run simulation" className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <RefreshCw size={15} />
          </button>
          <button onClick={zoomIn} title="Zoom in" className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <ZoomIn size={15} />
          </button>
          <button onClick={zoomOut} title="Zoom out" className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <ZoomOut size={15} />
          </button>
          <button onClick={resetView} title="Reset view" className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            <Maximize2 size={15} />
          </button>
          <button onClick={() => setShowLegend(v => !v)} title="Toggle legend" className={`flex h-8 w-8 items-center justify-center rounded-md transition ${showLegend ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}>
            <Info size={15} />
          </button>
        </div>
      </header>

      {/* ── Canvas ──────────────────────────────────────────────────────────── */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        {(loading || !d3Ready) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
            <p className="text-sm">{loading ? 'Fetching notes…' : 'Loading graph engine…'}</p>
          </div>
        )}

        {!loading && d3Ready && activeNotes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <p className="text-sm font-medium text-zinc-300">No clustered notes yet</p>
            <p className="text-xs">Add some notes — once AI clusters them, they'll appear here.</p>
            <button onClick={() => router.push('/')} className="mt-3 rounded-lg bg-zinc-800 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700 transition">
              Go capture a note
            </button>
          </div>
        )}

        <svg
          ref={svgRef}
          className="h-full w-full"
          style={{ cursor: 'grab' }}
        />

        {/* Tooltip */}
        <NodeTooltip
          tip={tooltip}
          onOpen={(id) => router.push(`/?note=${id}`)}
        />

        {/* Legend */}
        {showLegend && (
          <div className="absolute bottom-5 right-5 rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 backdrop-blur">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Clusters</p>
            <div className="space-y-2">
              {clusters.filter(c => clusterCounts[c] > 0).map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCluster(selectedCluster === c ? null : c)}
                  className="flex w-full items-center gap-2.5 rounded-md px-1 py-0.5 transition hover:bg-zinc-800"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: clusterDot(c as Cluster), boxShadow: `0 0 6px ${clusterDot(c as Cluster)}` }}
                  />
                  <span className="flex-1 text-left text-xs capitalize text-zinc-300">{c}</span>
                  <span className="text-[10px] text-zinc-600">{clusterCounts[c]}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 border-t border-zinc-800 pt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                <span className="inline-block h-2 w-2 rounded-full border border-zinc-600" />
                Node size = relevance score
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                <span className="inline-block h-px w-4 bg-zinc-600" />
                Line = shared cluster
              </div>
              <div className="text-[10px] text-zinc-600">Drag nodes · scroll to zoom</div>
            </div>
          </div>
        )}

        {/* Mobile cluster pills */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
          {clusters.filter(c => clusterCounts[c] > 0).map(c => (
            <button
              key={c}
              onClick={() => setSelectedCluster(selectedCluster === c ? null : c)}
              className="rounded-full px-2.5 py-1 text-[10px] font-medium capitalize transition"
              style={{
                backgroundColor: selectedCluster === c ? clusterDot(c as Cluster) + 'cc' : clusterDot(c as Cluster) + '22',
                color: selectedCluster === c ? '#fff' : clusterDot(c as Cluster),
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

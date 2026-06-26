import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { useConnectionStore } from 'qos-ui-shared';

interface TopologyPeer {
  multiaddr?: string;
  latency_ms?: number;
  connection_type?: 'Direct' | 'Relayed' | string;
}

interface TopologyPayload {
  local_peer_id: string;
  listen_addrs: string[];
  peers: Record<string, TopologyPeer>;
}

interface GraphNode {
  id: string;
  isLocal: boolean;
  val: number;
  info?: TopologyPeer;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

export default function MeshRadarGraph() {
  const { hostIp, port, authToken } = useConnectionStore();
  const wsRef = useRef<WebSocket | null>(null);
  const fgRef = useRef<ForceGraphMethods>();
  
  const [graphData, setGraphData] = useState<{nodes: GraphNode[], links: GraphLink[]}>({ nodes: [], links: [] });
  const graphDataRef = useRef(graphData);
  useEffect(() => { graphDataRef.current = graphData; }, [graphData]);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track pulses for flashing effect: nodeId -> timestamp
  const pulseMapRef = useRef<Record<string, number>>({});

  // Resize handler
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // WebSocket Connection for Topology Stream
  useEffect(() => {
    if (!hostIp || !port || !authToken) return;

    const url = `ws://${hostIp}:${port}/api/v1/stream`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'AUTH', token: authToken }));
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'NETWORK_TOPOLOGY_TICK' && parsed.topology) {
          const topo: TopologyPayload = parsed.topology;
          
          const nodes: GraphNode[] = [];
          const links: GraphLink[] = [];

          // Local Node
          nodes.push({
            id: topo.local_peer_id,
            isLocal: true,
            val: 20
          });

          // Connected Peers
          Object.entries(topo.peers).forEach(([peerId, info]) => {
            nodes.push({
              id: peerId,
              isLocal: false,
              val: 10,
              info
            });
            links.push({
              source: topo.local_peer_id,
              target: peerId
            });
          });

          setGraphData({ nodes, links });
        } else if (parsed.type === 'GOSSIPSUB_PULSE') {
          const source = parsed.source;
          const { nodes, links } = graphDataRef.current;
          
          if (source === 'local') {
            // Local node broadcasting out
            const localNode = nodes.find(n => n.isLocal);
            if (localNode) {
              links.forEach(link => {
                const srcId = typeof link.source === 'object' ? link.source.id : link.source;
                const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
                if (srcId === localNode.id) {
                  fgRef.current?.emitParticle(link);
                  pulseMapRef.current[tgtId] = Date.now();
                }
              });
            }
          } else {
            // Received pulse from remote peer
            const localNode = nodes.find(n => n.isLocal);
            const link = links.find(l => {
              const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
              return tgtId === source;
            });
            if (link && localNode) {
              fgRef.current?.emitParticle(link);
              pulseMapRef.current[localNode.id] = Date.now();
            }
          }
        }
      } catch {
        // ignore parse error
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [hostIp, port, authToken]);

  // Center local node
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Small timeout to allow graph physics to settle
      setTimeout(() => {
        fgRef.current?.d3Force('charge')?.strength(-300);
        fgRef.current?.d3Force('link')?.distance(100);
      }, 50);
    }
  }, [graphData.nodes.length]);

  const renderNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isLocal = node.isLocal;
    const isPulsing = pulseMapRef.current[node.id] && Date.now() - pulseMapRef.current[node.id] < 300;
    
    // Flash danger red if pulsing
    const color = isPulsing ? '#ff003c' : (isLocal ? '#00ff41' : '#00d4ff');
    const radius = isLocal ? 8 : 5;
    const drawRadius = isPulsing ? radius * 1.5 : radius;
    
    // Draw glow
    ctx.shadowColor = color;
    ctx.shadowBlur = (isPulsing ? 30 : 15) * globalScale;
    
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, drawRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Node label (Peer ID prefix)
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px "Fira Code", monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id.substring(0, 6), node.x!, node.y! + drawRadius + (8 / globalScale));
  }, []);

  const renderLink = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D) => {
    const sourceNode = link.source as GraphNode;
    const targetNode = link.target as GraphNode;
    if (sourceNode.x === undefined || sourceNode.y === undefined || targetNode.x === undefined || targetNode.y === undefined) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(sourceNode.x, sourceNode.y);
    ctx.lineTo(targetNode.x, targetNode.y);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // Reset
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        // @ts-ignore
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#0a0a0a"
        // Particle Config
        linkDirectionalParticleColor={() => '#ff003c'}
        linkDirectionalParticleWidth={6}
        linkDirectionalParticleSpeed={0.02} // ~300ms depending on link distance
        // @ts-ignore
        nodeCanvasObject={renderNode}
        // @ts-ignore
        linkCanvasObject={renderLink}
        nodePointerAreaPaint={(node: GraphNode, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, 10, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        nodeLabel={(node: GraphNode) => {
          if (node.isLocal) {
            return `<div style="font-family: 'Fira Code', monospace; background: rgba(0,0,0,0.8); border: 1px solid #00ff41; padding: 8px; border-radius: 4px;">
              <span style="color: #00ff41;">LOCAL NODE</span><br/>
              ID: ${node.id}
            </div>`;
          } else {
            const lat = node.info?.latency_ms ? `${node.info.latency_ms}ms` : 'N/A';
            const ip = node.info?.multiaddr || 'Unknown';
            return `<div style="font-family: 'Fira Code', monospace; background: rgba(0,0,0,0.8); border: 1px solid #00d4ff; padding: 8px; border-radius: 4px; z-index: 50;">
              <span style="color: #00d4ff;">REMOTE PEER</span><br/>
              ID: ${node.id}<br/>
              Latency: <span style="color: #00ff41">${lat}</span><br/>
              Addr: ${ip}
            </div>`;
          }
        }}
      />
    </div>
  );
}

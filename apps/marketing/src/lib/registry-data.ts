export type Category = 'All' | 'Utilities' | 'Data Pipeline' | 'Edge AI' | 'Networking' | 'Security' | 'Analytics';

export interface Module {
  id: string;
  name: string;
  slug: string;           // e.g. @official/tactical-guestbook
  author: string;
  verified: boolean;
  category: Exclude<Category, 'All'>;
  description: string;
  longDescription: string;
  tags: string[];
  cpu: string;            // avg CPU time
  ram: string;            // avg RAM
  downloads: string;
  version: string;
  license: string;
  color: string;
  icon: string;
  screenshots: string[];   // we'll use terminal-output text blocks instead
  changelog: string;
}

export const MODULES: Module[] = [
  {
    id: '1',
    name: 'Edge Telemetry Aggregator',
    slug: '@official/edge-telemetry',
    author: 'Q-OS Team',
    verified: true,
    category: 'Analytics',
    description: 'Collect IoT sensor data and aggregate timestamps. Persists an indexed log in Sled with automatic counter increments.',
    longDescription: 'The canonical Q-OS starting point. Edge Telemetry Aggregator accepts sensor payloads via the Host ABI, writes a timestamped entry to the local Sled store, increments a persistent counter, and returns an ACK receipt. Battle-tested across 200+ industrial deployments.',
    tags: ['iot', 'edge', 'telemetry', 'beginner'],
    cpu: '1.2ms avg',
    ram: '4 MB',
    downloads: '18.4k',
    version: '2.3.1',
    license: 'MIT',
    color: '#00ff41',
    icon: '📊',
    screenshots: [],
    changelog: '2.3.1 — Fixed counter race on concurrent events.\n2.3.0 — Added timestamp to receipt payload.',
  },
  {
    id: '2',
    name: 'Mesh Sync Coordinator',
    slug: '@official/mesh-sync',
    author: 'Q-OS Team',
    verified: true,
    category: 'Networking',
    description: 'Owner broadcasts a state override payload. Module validates node eligibility and applies state modifier across the mesh.',
    longDescription: 'Mesh Sync Coordinator integrates tightly with the Admin Node. When a master node fires a broadcast with level=OVERRIDE, this module intercepts the event, writes the override token to state, and updates all active edge nodes instantly via CRDT sync. Supports full or partial mesh state updates.',
    tags: ['mesh', 'sync', 'networking', 'broadcast'],
    cpu: '0.8ms avg',
    ram: '3 MB',
    downloads: '9.1k',
    version: '1.4.0',
    license: 'MIT',
    color: '#ff7a2f',
    icon: '⚡',
    screenshots: [],
    changelog: '1.4.0 — Multi-override stacking support.\n1.3.0 — Time-boxed expiry for tokens.',
  },
  {
    id: '3',
    name: 'Zero-Trust Validator',
    slug: '@official/zero-trust-validator',
    author: 'Q-OS Team',
    verified: true,
    category: 'Security',
    description: 'Pre-load a list of cryptographic tokens into Sled. Validate edge requests with sub-2ms latency — zero cloud round-trips.',
    longDescription: 'Zero-Trust Validator accepts a batch of HMAC-SHA256 tokens from an orchestrator\'s CSV and pre-loads them into the Sled store. When an edge device makes a request, the module validates their token against the local store, marks it as consumed (preventing replay), and grants or denies access with a cryptographic response.',
    tags: ['iot', 'security', 'tokens', 'hmac'],
    cpu: '0.6ms avg',
    ram: '12 MB',
    downloads: '6.7k',
    version: '3.1.2',
    license: 'MIT',
    color: '#facc15',
    icon: '🎟️',
    screenshots: [],
    changelog: '3.1.2 — HMAC-SHA256 validation hardened.\n3.1.0 — Replay-attack prevention via consumed-token bitset.',
  },
  {
    id: '4',
    name: 'IoT Data Normalizer',
    slug: '@community/iot-normalizer',
    author: 'edge_devx',
    verified: false,
    category: 'Data Pipeline',
    description: 'Cleans and standardizes messy JSON payloads from edge sensors before writing to the local state store.',
    longDescription: 'A community favourite. IoT Data Normalizer reads incoming payloads, converts various date formats and metric units into a standardized schema, and writes the clean data back to Sled. Reduces downstream pipeline errors by catching malformed data directly at the edge.',
    tags: ['iot', 'data-pipeline', 'sensors', 'normalization'],
    cpu: '1.8ms avg',
    ram: '5 MB',
    downloads: '4.3k',
    version: '0.9.4',
    license: 'Apache-2.0',
    color: '#c792ea',
    icon: '🔄',
    screenshots: [],
    changelog: '0.9.4 — Fixed timestamp parsing issue.\n0.9.0 — Added support for custom schema definitions.',
  },
  {
    id: '5',
    name: 'Edge Rate Limiter',
    slug: '@community/edge-rate-limiter',
    author: 'infra_labs',
    verified: false,
    category: 'Security',
    description: 'Rate-limits sensor requests per node per hour. Prevents DDoS and broken sensors from flooding the mesh.',
    longDescription: 'Edge Rate Limiter protects the P2P mesh from noisy neighbors. It maintains a per-device sliding-window counter in Sled and rejects interactions that exceed the configured rate limit (default: 300 reqs/hour/device). Blocked devices receive an HTTP 429 response. Block records expire automatically via Sled TTL.',
    tags: ['rate-limit', 'security', 'abuse-prevention', 'networking'],
    cpu: '0.3ms avg',
    ram: '2 MB',
    downloads: '1.9k',
    version: '1.0.3',
    license: 'MIT',
    color: '#ff003c',
    icon: '🚧',
    screenshots: [],
    changelog: '1.0.3 — Sliding window algorithm (was fixed window).\n1.0.0 — Initial release.',
  },
  {
    id: '6',
    name: 'Local AI Inferencer',
    slug: '@official/local-inferencer',
    author: 'Q-OS Team',
    verified: true,
    category: 'Edge AI',
    description: 'Runs lightweight ONNX models directly on the edge node. Classifies sensor data without relying on a cloud backend.',
    longDescription: 'Local AI Inferencer leverages a highly optimized WASM-compiled ONNX runtime to execute small machine learning models on edge devices. Feed it an array of sensor values, and it returns a classification or anomaly score instantly. Perfect for predictive maintenance and local anomaly detection.',
    tags: ['ai', 'onnx', 'machine-learning', 'inference', 'automation'],
    cpu: '12.4ms avg',
    ram: '35 MB',
    downloads: '12.2k',
    version: '4.0.1',
    license: 'MIT',
    color: '#00ff41',
    icon: '🧠',
    screenshots: [],
    changelog: '4.0.1 — Improved ONNX memory management.\n4.0.0 — Initial support for quantized models.',
  },
  {
    id: '7',
    name: 'Node Traffic Heatmap',
    slug: '@official/traffic-heatmap',
    author: 'Q-OS Team',
    verified: true,
    category: 'Analytics',
    description: 'Aggregate execution timestamps by node and hour. Exports a heatmap JSON for the Admin Dashboard to visualise peak traffic.',
    longDescription: 'Node Traffic Heatmap runs as a passive observer module — it intercepts every EXECUTION_RECEIPT telemetry event and aggregates interaction counts into a `heatmap:{date}:{node_id}:{hour}` key structure in Sled. The Admin Dashboard consumes this data to render peak-traffic visualisations without any cloud BI tool.',
    tags: ['analytics', 'heatmap', 'business-intelligence', 'traffic'],
    cpu: '0.4ms avg',
    ram: '8 MB',
    downloads: '7.9k',
    version: '1.1.0',
    license: 'MIT',
    color: '#00d4ff',
    icon: '📈',
    screenshots: [],
    changelog: '1.1.0 — Per-hour granularity added.\n1.0.0 — Daily aggregation only.',
  },
  {
    id: '8',
    name: 'Modbus Protocol Bridge',
    slug: '@community/modbus-bridge',
    author: 'industrial_dev',
    verified: false,
    category: 'Utilities',
    description: 'Translates legacy Modbus TCP/RTU commands into Q-OS state updates. Bridges old hardware with modern edge networking.',
    longDescription: 'Modbus Protocol Bridge allows older industrial equipment to participate in the Q-OS mesh. It decodes Modbus registers into semantic JSON payloads and writes them to the Sled state. When state changes, it translates it back to Modbus coils/registers to actuate physical machinery.',
    tags: ['industrial', 'modbus', 'bridge', 'legacy', 'automation'],
    cpu: '1.6ms avg',
    ram: '7 MB',
    downloads: '2.4k',
    version: '0.7.1',
    license: 'MIT',
    color: '#ff7a2f',
    icon: '🔌',
    screenshots: [],
    changelog: '0.7.1 — Fixed endianness conversion bug.\n0.7.0 — Added Modbus TCP support.',
  }
];

export const CATEGORIES: Category[] = ['All', 'Utilities', 'Data Pipeline', 'Edge AI', 'Networking', 'Security', 'Analytics'];

export const CATEGORY_COLORS: Record<string, string> = {
  Utilities:       '#00ff41',
  'Data Pipeline': '#c792ea',
  'Edge AI':       '#00d4ff',
  Networking:      '#ff7a2f',
  Security:        '#ff003c',
  Analytics:       '#facc15',
};

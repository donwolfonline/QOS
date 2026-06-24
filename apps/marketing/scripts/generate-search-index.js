const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../src/app/docs');
const OUTPUT_FILE = path.join(__dirname, '../public/docs-index.json');

const DOC_NAV = [
  {
    category: 'Getting Started',
    items: [
      { label: 'Introduction', href: '/docs' },
      { label: 'Quick Start', href: '/docs/quick-start' },
      { label: 'Installation', href: '/docs/installation' },
      { label: 'Your First Module', href: '/docs/first-module' },
    ],
  },
  {
    category: 'Architecture',
    items: [
      { label: 'System Overview', href: '/docs/architecture' },
      { label: 'Edge Node (Rust Daemon)', href: '/docs/architecture/edge-node' },
      { label: 'Sled State Store', href: '/docs/architecture/sled' },
      { label: 'WebSocket Telemetry', href: '/docs/architecture/websocket' },
      { label: 'CRDT Sync Protocol', href: '/docs/architecture/crdt' },
    ],
  },
  {
    category: 'qos-sdk Reference',
    items: [
      { label: 'Overview', href: '/docs/sdk-reference' },
      { label: 'qos_abi::read_input', href: '/docs/sdk-reference/read-input' },
      { label: 'qos_abi::write_output', href: '/docs/sdk-reference/write-output' },
      { label: 'qos_abi::state_get', href: '/docs/sdk-reference/state-get' },
      { label: 'qos_abi::state_set', href: '/docs/sdk-reference/state-set' },
      { label: 'Error Handling', href: '/docs/sdk-reference/errors' },
    ],
  },
  {
    category: 'WASM Module Guides',
    items: [
      { label: 'Overview', href: '/docs/wasm-guides' },
      { label: 'Guest Check-In Module', href: '/docs/wasm-guides/guestbook' },
      { label: 'Menu & Ordering', href: '/docs/wasm-guides/menu' },
      { label: 'VIP Validation', href: '/docs/wasm-guides/vip' },
      { label: 'Inventory Sync', href: '/docs/wasm-guides/inventory' },
      { label: 'Custom Broadcast Logic', href: '/docs/wasm-guides/broadcast' },
    ],
  },
];

function extractSummary(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Try to match the first <P> tag for a summary
  const pMatch = content.match(/<P>([\s\S]*?)<\/P>/);
  if (pMatch) {
    return pMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  }
  
  // Try to match standard p tags
  const pTagMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (pTagMatch) {
    return pTagMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  }

  return '';
}

const index = [];

DOC_NAV.forEach(section => {
  section.items.forEach(item => {
    // Determine the path to the page.tsx
    // For '/docs' -> 'src/app/docs/page.tsx'
    // For '/docs/architecture' -> 'src/app/docs/architecture/page.tsx'
    const relativeRoute = item.href.replace('/docs', '');
    const pagePath = path.join(DOCS_DIR, relativeRoute, 'page.tsx');
    
    const summary = extractSummary(pagePath);
    
    index.push({
      title: item.label,
      category: section.category,
      href: item.href,
      content: summary
    });
  });
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
console.log(`Generated search index with ${index.length} entries at ${OUTPUT_FILE}`);

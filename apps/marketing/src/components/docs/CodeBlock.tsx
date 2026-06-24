'use client';

import { useState, useCallback } from 'react';

// ─── Minimal tokenizer for Rust / Bash / TOML / JSON ───────────────────────
type Token = { type: string; value: string };

const RUST_KEYWORDS = /\b(fn|pub|extern|use|let|mut|const|struct|impl|trait|enum|match|if|else|for|while|return|mod|crate|super|self|Self|type|where|async|await|dyn|ref|in|loop|break|continue|unsafe|move|Box|Vec|String|Option|Result|Some|None|Ok|Err|u8|u16|u32|u64|usize|i8|i16|i32|i64|isize|f32|f64|bool|str|char)\b/g;
const STRING_LIT = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
const COMMENT = /\/\/[^\n]*/g;
const NUMBER_LIT = /\b\d[\d.]*\b/g;
const MACRO_CALL = /\b\w+!/g;
const ATTR = /#\[.*?\]/g;
const LIFETIME = /'[a-z_]+/g;

function tokenizeRust(code: string): Token[] {
  const result: Token[] = [];
  let i = 0;
  const marks: { start: number; end: number; type: string }[] = [];

  const addMarks = (re: RegExp, type: string) => {
    const r = new RegExp(re.source, 'g');
    let m;
    while ((m = r.exec(code)) !== null) marks.push({ start: m.index, end: m.index + m[0].length, type });
  };

  addMarks(COMMENT, 'comment');
  addMarks(STRING_LIT, 'string');
  addMarks(ATTR, 'attribute');
  addMarks(MACRO_CALL, 'macro');
  addMarks(LIFETIME, 'lifetime');
  addMarks(RUST_KEYWORDS, 'keyword');
  addMarks(NUMBER_LIT, 'number');

  marks.sort((a, b) => a.start - b.start);

  // De-overlap: keep first-seen
  const final: typeof marks = [];
  let cursor = 0;
  for (const m of marks) {
    if (m.start >= cursor) { final.push(m); cursor = m.end; }
  }

  let pos = 0;
  for (const m of final) {
    if (m.start > pos) result.push({ type: 'plain', value: code.slice(pos, m.start) });
    result.push({ type: m.type, value: code.slice(m.start, m.end) });
    pos = m.end;
  }
  if (pos < code.length) result.push({ type: 'plain', value: code.slice(pos) });
  return result;
}

function tokenizeBash(code: string): Token[] {
  const lines = code.split('\n');
  return lines.flatMap((line, li): Token[] => {
    const parts: Token[] = [];
    if (line.startsWith('#')) { parts.push({ type: 'comment', value: line }); }
    else if (line.trimStart().startsWith('$')) {
      const [prefix, ...rest] = line.split('$');
      parts.push({ type: 'plain', value: prefix });
      parts.push({ type: 'prompt', value: '$' });
      const cmd = rest.join('$');
      const spaceIdx = cmd.search(/\s/);
      if (spaceIdx === -1) { parts.push({ type: 'command', value: cmd }); }
      else {
        parts.push({ type: 'command', value: cmd.slice(0, spaceIdx) });
        parts.push({ type: 'plain', value: cmd.slice(spaceIdx) });
      }
    } else if (line.trimStart().startsWith('>')) {
      parts.push({ type: 'output', value: line });
    } else {
      parts.push({ type: 'plain', value: line });
    }
    if (li < lines.length - 1) parts.push({ type: 'plain', value: '\n' });
    return parts;
  });
}

function tokenizeToml(code: string): Token[] {
  const lines = code.split('\n');
  return lines.flatMap((line, li): Token[] => {
    const parts: Token[] = [];
    const eqIdx = line.indexOf('=');
    if (line.trimStart().startsWith('#')) {
      parts.push({ type: 'comment', value: line });
    } else if (line.trimStart().startsWith('[')) {
      parts.push({ type: 'section', value: line });
    } else if (eqIdx !== -1) {
      parts.push({ type: 'key', value: line.slice(0, eqIdx) });
      parts.push({ type: 'plain', value: '=' });
      parts.push({ type: 'string', value: line.slice(eqIdx + 1) });
    } else {
      parts.push({ type: 'plain', value: line });
    }
    if (li < lines.length - 1) parts.push({ type: 'plain', value: '\n' });
    return parts;
  });
}

function tokenize(code: string, lang: string): Token[] {
  if (lang === 'rust') return tokenizeRust(code);
  if (lang === 'bash' || lang === 'sh') return tokenizeBash(code);
  if (lang === 'toml') return tokenizeToml(code);
  return [{ type: 'plain', value: code }];
}

const TOKEN_COLORS: Record<string, string> = {
  keyword:   '#c792ea',
  string:    '#c3e88d',
  comment:   '#546e7a',
  number:    '#f78c6c',
  macro:     '#82aaff',
  attribute: '#ffcb6b',
  lifetime:  '#89ddff',
  prompt:    '#00d4ff',
  command:   '#00ff41',
  output:    '#a0a0a0',
  section:   '#00d4ff',
  key:       '#82aaff',
  plain:     '#cdd3de',
};

// ─── The Component ──────────────────────────────────────────────────────────
interface CodeBlockProps {
  code: string;
  lang?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, lang = 'bash', filename, showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const tokens = tokenize(code.trim(), lang);
  const lines = code.trim().split('\n');

  return (
    <div className="rounded-xl overflow-hidden border border-[#00d4ff]/15 shadow-[0_0_30px_rgba(0,0,0,0.5)] my-6">
      {/* Window chrome */}
      <div className="bg-[#111111] px-4 py-3 flex items-center gap-3 border-b border-[#00d4ff]/10">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-[#ff003c]/80" />
          <div className="w-3 h-3 rounded-full bg-[#facc15]/80" />
          <div className="w-3 h-3 rounded-full bg-[#00ff41]/80" />
        </div>
        <span className="font-mono-code text-gray-500 text-xs flex-1 text-center tracking-wide">
          {filename ?? lang}
        </span>
        <button
          onClick={copy}
          className={`flex items-center gap-1.5 font-mono-code text-[10px] px-2.5 py-1 rounded-md border transition-all duration-200 ${
            copied
              ? 'text-[#00ff41] border-[#00ff41]/30 bg-[#00ff41]/10'
              : 'text-gray-500 border-gray-700 hover:text-gray-300 hover:border-gray-500'
          }`}
        >
          {copied ? (
            <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
          ) : (
            <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
          )}
        </button>
      </div>

      {/* Code area */}
      <div className="bg-[#0d0d0d] overflow-x-auto">
        <div className="flex min-w-max">
          {/* Line numbers */}
          {showLineNumbers && (
            <div className="select-none flex flex-col items-end py-4 px-4 border-r border-[#00d4ff]/8">
              {lines.map((_, i) => (
                <span key={i} className="font-mono-code text-xs leading-6 text-gray-700">{i + 1}</span>
              ))}
            </div>
          )}

          {/* Tokens */}
          <pre className="py-4 px-5 font-mono-code text-[13px] leading-6 flex-1 overflow-x-auto">
            <code>
              {tokens.map((tok, i) => (
                <span key={i} style={{ color: TOKEN_COLORS[tok.type] ?? TOKEN_COLORS.plain }}>
                  {tok.value}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

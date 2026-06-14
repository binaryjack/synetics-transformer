const fs = require('fs');
const code = fs.readFileSync('../synetics-docs/src/components/Layout.syn', 'utf8');

// Copying logic from preprocessComponentKeywordSafe
let inString = null;
let inComment = null;
let result = '';
let i = 0;

while (i < code.length) {
  const char = code[i];
  const next = code[i + 1];
  const remaining = code.slice(i);

  if (inString) {
    result += char;
    if (char === inString && code[i - 1] !== '\\') inString = null;
    i++;
    continue;
  }
  if (inComment === 'line') {
    result += char;
    if (char === '\n') inComment = null;
    i++;
    continue;
  }
  if (inComment === 'block') {
    result += char;
    if (char === '*' && next === '/') { result += next; i += 2; inComment = null; continue; }
    i++;
    continue;
  }
  if (char === '/' && next === '/') { result += char + next; inComment = 'line'; i += 2; continue; }
  if (char === '/' && next === '*') { result += char + next; inComment = 'block'; i += 2; continue; }
  if (char === '"' || char === "'" || char === '`') { inString = char; result += char; i++; continue; }

  if (remaining.match(/^\bexport\s+component\s+/)) {
    const match = remaining.match(/^\bexport\s+component\s+/);
    if (match) { result += 'export function '; i += match[0].length; continue; }
  }
  if (remaining.match(/^\bcomponent\s+([A-Z])/)) {
    const match = remaining.match(/^\bcomponent\s+/);
    if (match) { result += 'function '; i += match[0].length; continue; }
  }

  result += char;
  i++;
}

console.log(result.substring(0, 200));

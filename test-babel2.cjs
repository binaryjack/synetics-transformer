const babel = require('@babel/core');

const code = `
export function App() {
  return <div class={\`code-editor-container \${isFocused() ? 'focused' : ''}\`}></div>;
}
`;

const plugin = require('./dist/babel-plugin/index.js').default;

const out = babel.transformSync(code, {
  plugins: [[plugin, { dev: true }]],
  parserOpts: { plugins: ['jsx', 'typescript'] }
});

console.log(out.code);

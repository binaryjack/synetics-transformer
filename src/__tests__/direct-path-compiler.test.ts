/**
 * SOTA Direct-Path Compiler & Static Template Analyzer Unit Tests
 * Tests AST path extraction, dynamic hole identification, and template string serialization.
 */

import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { analyzeDirectPathJSX } from '../typescript-transformer/static-analyzer.js';

function parseJSX(source: string): ts.JsxElement | ts.JsxSelfClosingElement {
  const sf = ts.createSourceFile('test.tsx', `const el = (${source});`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const varDecl = (sf.statements[0] as ts.VariableStatement).declarationList.declarations[0];
  const parenExpr = varDecl.initializer as ts.ParenthesizedExpression;
  return parenExpr.expression as ts.JsxElement | ts.JsxSelfClosingElement;
}

describe('SOTA Direct-Path Static & Semi-Static Analyzer', () => {
  it('correctly analyzes 100% static elements', () => {
    const node = parseJSX('<div class="hero"><h1 id="title">Welcome</h1><p>Hello world</p></div>');
    const result = analyzeDirectPathJSX(node);

    expect(result.canTemplate).toBe(true);
    expect(result.holes.length).toBe(0);
    expect(result.templateHtml).toBe('<div class="hero"><h1 id="title">Welcome</h1><p>Hello world</p></div>');
  });

  it('identifies dynamic holes: text expressions, attributes, and event listeners', () => {
    const node = parseJSX(`
      <div class="counter">
        <h2>Count: {count()}</h2>
        <button onClick={increment} disabled={isLoading()}>Increment</button>
      </div>
    `);

    const result = analyzeDirectPathJSX(node);

    expect(result.canTemplate).toBe(true);
    expect(result.templateHtml).toBe('<div class="counter"><h2>Count:  </h2><button>Increment</button></div>');
    
    // Check dynamic holes
    expect(result.holes.length).toBe(3);

    // Hole 1: Text hole inside <h2> (child 0 of div, child 1 of h2)
    const textHole = result.holes.find((h) => h.type === 'text');
    expect(textHole).toBeDefined();
    expect(textHole?.path).toEqual([0, 1]);

    // Hole 2: Event hole on <button> (child 1 of div)
    const eventHole = result.holes.find((h) => h.type === 'event');
    expect(eventHole).toBeDefined();
    expect(eventHole?.path).toEqual([1]);
    expect(eventHole?.name).toBe('click');

    // Hole 3: Dynamic attribute on <button>
    const attrHole = result.holes.find((h) => h.type === 'attr');
    expect(attrHole).toBeDefined();
    expect(attrHole?.path).toEqual([1]);
    expect(attrHole?.name).toBe('disabled');
  });

  it('safely rejects custom components from native template cloning', () => {
    const node = parseJSX('<div class="wrapper"><MyCustomComponent prop="val" /></div>');
    const result = analyzeDirectPathJSX(node);

    expect(result.canTemplate).toBe(false);
  });

  it('safely rejects spread attributes from native template cloning', () => {
    const node = parseJSX('<div {...props}><p>Text</p></div>');
    const result = analyzeDirectPathJSX(node);

    expect(result.canTemplate).toBe(false);
  });
});

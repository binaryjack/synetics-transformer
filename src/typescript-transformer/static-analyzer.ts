/**
 * SOTA Static JSX Analyzer & HTML Serializer
 * Analyzes JSX trees to determine if they are completely static (no signals, no expressions).
 * Generates raw HTML strings for template cloning.
 */

import * as ts from 'typescript';

export interface IStaticAnalysisResult {
  isStatic: boolean;
  html?: string;
}

/**
 * Checks if a JSX element and all its attributes and children are 100% static.
 */
export function analyzeStaticJSX(
  node: ts.JsxElement | ts.JsxSelfClosingElement
): IStaticAnalysisResult {
  // First, check tag name. If it's a Custom Component (starts with uppercase), it's not a static HTML element
  const tagName = getTagNameString(node);
  if (!tagName || /^[A-Z]/.test(tagName) || tagName.includes('.')) {
    return { isStatic: false };
  }

  // Check attributes
  const attributes = 'openingElement' in node ? node.openingElement.attributes : node.attributes;
  const staticAttrs: string[] = [];

  for (const prop of attributes.properties) {
    if (!ts.isJsxAttribute(prop) || !prop.name) {
      return { isStatic: false }; // Spread attributes {...props} are dynamic
    }

    const attrName = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.name.text;

    // Event handlers or reactive bindings are dynamic
    if (attrName.startsWith('on') || attrName.startsWith('bind:') || attrName.startsWith('.')) {
      return { isStatic: false };
    }

    if (!prop.initializer) {
      // Boolean attribute like <input disabled />
      staticAttrs.push(attrName);
    } else if (ts.isStringLiteral(prop.initializer)) {
      staticAttrs.push(`${attrName}="${escapeHtmlAttribute(prop.initializer.text)}"`);
    } else {
      // Attribute has expression like {val} -> dynamic
      return { isStatic: false };
    }
  }

  const attrsString = staticAttrs.length > 0 ? ` ${staticAttrs.join(' ')}` : '';

  // If self-closing element
  if (ts.isJsxSelfClosingElement(node)) {
    return {
      isStatic: true,
      html: `<${tagName}${attrsString}/>`,
    };
  }

  // Check children
  let childrenHtml = '';
  for (const child of node.children) {
    if (ts.isJsxText(child)) {
      childrenHtml += child.text;
    } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      const childAnalysis = analyzeStaticJSX(child);
      if (!childAnalysis.isStatic) {
        return { isStatic: false };
      }
      childrenHtml += childAnalysis.html;
    } else {
      // Any JsxExpression {something} makes this subtree dynamic
      return { isStatic: false };
    }
  }

  return {
    isStatic: true,
    html: `<${tagName}${attrsString}>${childrenHtml}</${tagName}>`,
  };
}

function getTagNameString(node: ts.JsxElement | ts.JsxSelfClosingElement): string | null {
  const tagNode = 'openingElement' in node ? node.openingElement.tagName : node.tagName;
  if (ts.isIdentifier(tagNode)) {
    return tagNode.text;
  }
  return null;
}

function escapeHtmlAttribute(str: string): string {
  return str.replace(/"/g, '&quot;');
}

export interface IDirectPathHole {
  path: number[];
  type: 'text' | 'attr' | 'event';
  name?: string;
  expression: ts.Expression;
}

export interface IDirectPathAnalysisResult {
  canTemplate: boolean;
  templateHtml?: string;
  holes: IDirectPathHole[];
}

/**
 * SOTA Direct-Path Analyzer:
 * Detects whether a JSX tree can be compiled into a single cloned HTML template
 * with direct childNodes indexed paths for dynamic holes (expressions and events).
 */
export function analyzeDirectPathJSX(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  currentPath: number[] = []
): IDirectPathAnalysisResult {
  const tagName = getTagNameString(node);
  if (!tagName || /^[A-Z]/.test(tagName) || tagName.includes('.')) {
    return { canTemplate: false, holes: [] };
  }

  const attributes = 'openingElement' in node ? node.openingElement.attributes : node.attributes;
  const staticAttrs: string[] = [];
  const holes: IDirectPathHole[] = [];

  for (const prop of attributes.properties) {
    if (!ts.isJsxAttribute(prop) || !prop.name) {
      return { canTemplate: false, holes: [] }; // Spread attributes {...props} cannot be cloned
    }

    const attrName = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.name.text;

    // Event handlers (e.g., onClick, onInput)
    if (attrName.startsWith('on') && attrName.length > 2) {
      const eventName = attrName.slice(2).toLowerCase();
      if (prop.initializer && ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
        holes.push({
          path: currentPath,
          type: 'event',
          name: eventName,
          expression: prop.initializer.expression,
        });
      }
      continue;
    }

    if (!prop.initializer) {
      // Boolean attribute like <input disabled />
      staticAttrs.push(attrName);
    } else if (ts.isStringLiteral(prop.initializer)) {
      staticAttrs.push(`${attrName}="${escapeHtmlAttribute(prop.initializer.text)}"`);
    } else if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
      // Dynamic attribute binding
      holes.push({
        path: currentPath,
        type: 'attr',
        name: attrName === 'class' ? 'className' : attrName,
        expression: prop.initializer.expression,
      });
    } else {
      return { canTemplate: false, holes: [] };
    }
  }

  const attrsString = staticAttrs.length > 0 ? ` ${staticAttrs.join(' ')}` : '';

  if (ts.isJsxSelfClosingElement(node)) {
    return {
      canTemplate: true,
      templateHtml: `<${tagName}${attrsString}/>`,
      holes,
    };
  }

  // Analyze children
  let childrenHtml = '';
  let childIndex = 0;

  for (const child of node.children) {
    if (ts.isJsxText(child)) {
      const text = child.text;
      // Skip pure inter-tag whitespace
      if (text.trim().length === 0) {
        continue;
      }
      childrenHtml += text;
      childIndex++;
    } else if (ts.isJsxExpression(child)) {
      if (child.expression) {
        // Dynamic text hole
        childrenHtml += ' '; // single space text placeholder
        holes.push({
          path: [...currentPath, childIndex],
          type: 'text',
          expression: child.expression,
        });
        childIndex++;
      }
    } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      const childResult = analyzeDirectPathJSX(child, [...currentPath, childIndex]);
      if (!childResult.canTemplate || !childResult.templateHtml) {
        return { canTemplate: false, holes: [] };
      }
      childrenHtml += childResult.templateHtml;
      holes.push(...childResult.holes);
      childIndex++;
    } else {
      return { canTemplate: false, holes: [] };
    }
  }

  return {
    canTemplate: true,
    templateHtml: `<${tagName}${attrsString}>${childrenHtml}</${tagName}>`,
    holes,
  };
}

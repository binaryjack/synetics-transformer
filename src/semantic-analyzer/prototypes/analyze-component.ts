/**
 * Analyze component declaration
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeComponentDeclaration(this: ISemanticAnalyzer, node: any): void {
  // Declare component symbol
  const componentName = node.id ? node.id.name : (node.name ? node.name.name : '__anonymous__');
  this.declareSymbol(componentName, 'component', null, node);

  // Enter component scope
  this.enterScope('component');

  // Declare parameters
  for (const param of node.params) {
    if (param.type === 'Identifier') {
      const paramType = param.typeAnnotation ? this.inferType(param.typeAnnotation) : null;
      this.declareSymbol(param.name, 'parameter', paramType, param);
    } else if (param.type === 'ObjectPattern') {
      // Destructured params
      for (const prop of param.properties) {
        const propType = prop.value.typeAnnotation
          ? this.inferType(prop.value.typeAnnotation)
          : null;
        this.declareSymbol(prop.value.name, 'parameter', propType, prop.value);
      }
    }
  }

  // Analyze body
  this.analyzeBlockStatement(node.body);

  // Validate reactivity
  this.validateReactivity(node);

  // Exit component scope
  this.exitScope();
}


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
        if (prop.type === 'RestElement') {
          const name = prop.argument.name;
          const propType = prop.typeAnnotation ? this.inferType(prop.typeAnnotation) : null;
          this.declareSymbol(name, 'parameter', propType, prop);
        } else if (prop.type === 'ObjectProperty') {
          let name;
          let typeNode;
          let nodeToDeclare = prop.value;

          if (prop.value.type === 'AssignmentPattern') {
            name = prop.value.left.name;
            typeNode = prop.value.left;
          } else if (prop.value.type === 'Identifier') {
            name = prop.value.name;
            typeNode = prop.value;
          }

          if (name) {
            const propType = typeNode.typeAnnotation ? this.inferType(typeNode.typeAnnotation) : null;
            this.declareSymbol(name, 'parameter', propType, nodeToDeclare);
          }
        }
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


/**
 * Analyze function declaration and arrow functions
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

export function analyzeFunctionDeclaration(this: ISemanticAnalyzer, node: any): void {
  // Declare function symbol (if named function)
  if (node.id) {
    const returnType = node.returnType ? this.inferType(node.returnType) : null;
    this.declareSymbol(node.id.name, 'function', returnType, node);
  }

  // Enter function scope
  this.enterScope('function');

  // Declare parameters
  if (node.params) {
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
              console.log(`[SemanticAnalyzer] Declaring param object property: ${name}`);
              const propType = typeNode.typeAnnotation ? this.inferType(typeNode.typeAnnotation) : null;
              this.declareSymbol(name, 'parameter', propType, nodeToDeclare);
            } else {
              console.log(`[SemanticAnalyzer] Failed to extract name for ObjectProperty:`, prop.value.type);
            }
          }
        }
      }
    }
  }

  // Analyze body
  if (node.body) {
    if (node.body.type === 'BlockStatement') {
      this.analyzeBlockStatement(node.body);
    } else {
      // Arrow function with expression body
      this.analyzeExpression(node.body);
    }
  }

  // Exit function scope
  this.exitScope();
}


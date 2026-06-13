/**
 * Post-analysis checks
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

/**
 * Check for unused symbols
 */
export function checkUnusedSymbols(this: ISemanticAnalyzer): void {
  for (const [key, symbol] of this.symbolTable.symbols) {
    // Skip exported symbols
    if (symbol.isExported) continue;

    // Skip parameters (often intentionally unused)
    if (symbol.kind === 'parameter') continue;

    // Warn about unused symbols
    if (!symbol.isUsed) {
      this.addWarning(
        symbol.kind === 'import' ? 'unused-import' : 'unused-variable',
        `'${symbol.name}' is declared but never used`,
        symbol.node
      );
    }
  }
}

/**
 * Check for dead code
 */
export function checkDeadCode(this: ISemanticAnalyzer): void {
  // Helper to walk nodes and look for unreachable code in blocks
  const walkForDeadCode = (node: any) => {
    if (!node) return;

    if (node.type === 'BlockStatement' && Array.isArray(node.body)) {
      let foundReturn = false;
      let returnLine = -1;

      for (const stmt of node.body) {
        if (foundReturn) {
          // Any statement after a return is dead code
          this.addWarning(
            'dead-code',
            `Unreachable code detected after return statement (line ${returnLine})`,
            stmt
          );
          break; // only warn on the first unreachable statement
        }

        if (stmt.type === 'ReturnStatement') {
          foundReturn = true;
          returnLine = stmt.loc?.start?.line ?? -1;
        }
      }
      
      // Continue walking inside the block statements
      node.body.forEach(walkForDeadCode);
    } else if (node.type === 'FunctionDeclaration' || node.type === 'ComponentDeclaration') {
      walkForDeadCode(node.body);
    } else if (node.type === 'Program') {
      node.body.forEach(walkForDeadCode);
    } else if (node.type === 'IfStatement') {
      walkForDeadCode(node.consequent);
      if (node.alternate) walkForDeadCode(node.alternate);
    }
  };

  walkForDeadCode(this.ast);
}


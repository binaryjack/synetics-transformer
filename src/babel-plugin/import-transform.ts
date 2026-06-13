/**
 * Import Transformation for Pulsar
 * Handles mapping .syn file extensions to their compiled output format (.js)
 */

import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';

export function createImportTransform(t: typeof BabelTypes) {
  return {
    ImportDeclaration(path: NodePath<BabelTypes.ImportDeclaration>) {
      const source = path.node.source.value;

      // Check if the import path ends with .syn
      if (source.endsWith('.syn')) {
        // Replace .syn with .js for native ESM and bundler support
        const newSource = source.replace(/\.syn$/, '.js');
        path.node.source = t.stringLiteral(newSource);
      }
    },
  };
}

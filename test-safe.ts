import { preprocessComponentKeywordSafe } from './src/preprocessor/component-keyword-transform';
import * as fs from 'fs';
const code = fs.readFileSync('../synetics-docs/src/components/Layout.syn', 'utf8');
console.log(preprocessComponentKeywordSafe(code).substring(0, 200));

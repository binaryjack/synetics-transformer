const fs = require('fs');
const { createPipeline } = require('./dist/index.js');
const code = fs.readFileSync('../synetics-docs/src/components/Layout.syn', 'utf8');

const pipeline = createPipeline({ filePath: 'Layout.syn', debug: true });
pipeline.transform(code).then(result => {
  console.log('--- OUTPUT ---');
  console.log(result.code.substring(0, 500));
}).catch(err => {
  console.error('--- ERROR ---');
  console.error(err);
});

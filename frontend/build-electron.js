const fs = require('fs-extra');
const path = require('path');

// Copy electron.js to build folder
fs.copySync(
  path.join(__dirname, 'electron.js'),
  path.join(__dirname, 'build', 'electron.js')
);

console.log('✅ Copied electron.js to build folder');

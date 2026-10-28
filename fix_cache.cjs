const fs = require('fs');
const file = 'd:/manish_data/weeding_site/frontend/src/services/api.js';
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('localStorage.removeItem(cached_messages_')) {
    lines[i] = "      localStorage.removeItem('cached_messages_' + id);";
    console.log('Fixed line', i + 1);
  }
}
fs.writeFileSync(file, lines.join('\n'), 'utf8');


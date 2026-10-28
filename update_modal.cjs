const fs = require('fs');

const file = 'frontend/src/components/ChatBotModal.jsx';
let code = fs.readFileSync(file, 'utf8');

const target = `    // Clear typing status
    emitTyping(activeWeddingId, myName, false);

    // 1. OPTIMISTIC INSTANT UI UPDATE (0ms latency!)
    // Appears on the user's screen in 0 milliseconds
    const tempId = \`msg_temp_\${Date.now()}_\${Math.random().toString(36).slice(2, 6)}\`;
    const optimisticMsg = {
      id: tempId,
      wedding_id: activeWeddingId,`;

const replacement = `    // Guarantee valid wedding id
    const resolvedWeddingId =
      activeWeddingId ||
      selectedWedding?.id ||
      user?.wedding_id ||
      (weddings && weddings[0]?.id) ||
      "wedding_01";

    // Clear typing status
    emitTyping(resolvedWeddingId, myName, false);

    // 1. OPTIMISTIC INSTANT UI UPDATE (0ms latency!)
    // Appears on the user's screen in 0 milliseconds
    const tempId = \`msg_temp_\${Date.now()}_\${Math.random().toString(36).slice(2, 6)}\`;
    const optimisticMsg = {
      id: tempId,
      wedding_id: resolvedWeddingId,`;

let normalizedCode = code.replace(/\r\n/g, '\n');
normalizedCode = normalizedCode.replace(target.replace(/\r\n/g, '\n'), replacement.replace(/\r\n/g, '\n'));

fs.writeFileSync(file, normalizedCode.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully updated ChatBotModal.jsx with resolved wedding_id');


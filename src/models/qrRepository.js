const fs = require('fs');

function createQrRepository({ filePath, fileSystem = fs }) {
  function loadLatest() {
    try {
      const raw = fileSystem.readFileSync(filePath, 'utf8');
      if (!raw.trim()) {
        return null;
      }

      const parsed = JSON.parse(raw);
      return parsed && parsed.text ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function saveLatest(result) {
    fileSystem.writeFileSync(filePath, JSON.stringify(result, null, 2));
  }

  return { loadLatest, saveLatest };
}

module.exports = { createQrRepository };

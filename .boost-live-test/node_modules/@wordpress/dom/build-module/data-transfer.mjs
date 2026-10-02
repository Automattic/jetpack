// packages/dom/src/data-transfer.js
function getFilesFromDataTransfer(dataTransfer) {
  const files = Array.from(dataTransfer.files);
  Array.from(dataTransfer.items).forEach((item) => {
    const file = item.getAsFile();
    if (file && !files.find(
      ({ name, type, size }) => name === file.name && type === file.type && size === file.size
    )) {
      files.push(file);
    }
  });
  return files;
}
export {
  getFilesFromDataTransfer
};
//# sourceMappingURL=data-transfer.mjs.map

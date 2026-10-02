"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/dom/src/data-transfer.js
var data_transfer_exports = {};
__export(data_transfer_exports, {
  getFilesFromDataTransfer: () => getFilesFromDataTransfer
});
module.exports = __toCommonJS(data_transfer_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getFilesFromDataTransfer
});
//# sourceMappingURL=data-transfer.cjs.map

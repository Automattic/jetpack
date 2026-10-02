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

// packages/undo-manager/src/index.ts
var index_exports = {};
__export(index_exports, {
  createUndoManager: () => createUndoManager
});
module.exports = __toCommonJS(index_exports);
var import_is_shallow_equal = require("@wordpress/is-shallow-equal");
function mergeHistoryChanges(changes1, changes2) {
  const newChanges = { ...changes1 };
  Object.entries(changes2).forEach(([key, value]) => {
    if (newChanges[key]) {
      newChanges[key] = { ...newChanges[key], to: value.to };
    } else {
      newChanges[key] = value;
    }
  });
  return newChanges;
}
var addHistoryChangesIntoRecord = (record, changes) => {
  const existingChangesIndex = record?.findIndex(
    ({ id: recordIdentifier }) => {
      return typeof recordIdentifier === "string" ? recordIdentifier === changes.id : (0, import_is_shallow_equal.isShallowEqual)(recordIdentifier, changes.id);
    }
  );
  const nextRecord = [...record];
  if (existingChangesIndex !== -1) {
    nextRecord[existingChangesIndex] = {
      id: changes.id,
      changes: mergeHistoryChanges(
        nextRecord[existingChangesIndex].changes,
        changes.changes
      )
    };
  } else {
    nextRecord.push(changes);
  }
  return nextRecord;
};
function createUndoManager() {
  let history = [];
  let stagedRecord = [];
  let offset = 0;
  const dropPendingRedos = () => {
    history = history.slice(0, offset || void 0);
    offset = 0;
  };
  const appendStagedRecordToLatestHistoryRecord = () => {
    const index = history.length === 0 ? 0 : history.length - 1;
    let latestRecord = history[index] ?? [];
    stagedRecord.forEach((changes) => {
      latestRecord = addHistoryChangesIntoRecord(latestRecord, changes);
    });
    stagedRecord = [];
    history[index] = latestRecord;
  };
  const isRecordEmpty = (record) => {
    const filteredRecord = record.filter(({ changes }) => {
      return Object.values(changes).some(
        ({ from, to }) => typeof from !== "function" && typeof to !== "function" && !(0, import_is_shallow_equal.isShallowEqual)(from, to)
      );
    });
    return !filteredRecord.length;
  };
  return {
    addRecord(record, isStaged = false) {
      const isEmpty = !record || isRecordEmpty(record);
      if (isStaged) {
        if (isEmpty) {
          return;
        }
        record.forEach((changes) => {
          stagedRecord = addHistoryChangesIntoRecord(
            stagedRecord,
            changes
          );
        });
      } else {
        dropPendingRedos();
        if (stagedRecord.length) {
          appendStagedRecordToLatestHistoryRecord();
        }
        if (isEmpty) {
          return;
        }
        history.push(record);
      }
    },
    undo() {
      if (stagedRecord.length) {
        dropPendingRedos();
        appendStagedRecordToLatestHistoryRecord();
      }
      const undoRecord = history[history.length - 1 + offset];
      if (!undoRecord) {
        return;
      }
      offset -= 1;
      return undoRecord;
    },
    redo() {
      const redoRecord = history[history.length + offset];
      if (!redoRecord) {
        return;
      }
      offset += 1;
      return redoRecord;
    },
    hasUndo() {
      return !!history[history.length - 1 + offset];
    },
    hasRedo() {
      return !!history[history.length + offset];
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createUndoManager
});
//# sourceMappingURL=index.cjs.map

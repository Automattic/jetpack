// packages/undo-manager/src/index.ts
import { isShallowEqual } from "@wordpress/is-shallow-equal";
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
      return typeof recordIdentifier === "string" ? recordIdentifier === changes.id : isShallowEqual(recordIdentifier, changes.id);
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
        ({ from, to }) => typeof from !== "function" && typeof to !== "function" && !isShallowEqual(from, to)
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
export {
  createUndoManager
};
//# sourceMappingURL=index.mjs.map

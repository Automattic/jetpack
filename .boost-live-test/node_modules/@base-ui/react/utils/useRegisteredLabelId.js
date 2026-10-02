"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useRegisteredLabelId = useRegisteredLabelId;
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useBaseUiId = require("../internals/useBaseUiId");
function useRegisteredLabelId(idProp, setLabelId) {
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    setLabelId(id);
    return () => {
      setLabelId(currentId => currentId === id ? undefined : currentId);
    };
  }, [id, setLabelId]);
  return id;
}
'use client';

import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useBaseUiId } from "../internals/useBaseUiId.mjs";
export function useRegisteredLabelId(idProp, setLabelId) {
  const id = useBaseUiId(idProp);
  useIsoLayoutEffect(() => {
    setLabelId(id);
    return () => {
      setLabelId(currentId => currentId === id ? undefined : currentId);
    };
  }, [id, setLabelId]);
  return id;
}
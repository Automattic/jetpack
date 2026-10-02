'use client';

export function getDefaultLabelId(id) {
  return id == null ? undefined : `${id}-label`;
}
export function resolveAriaLabelledBy(fieldLabelId, localLabelId) {
  return fieldLabelId ?? localLabelId;
}
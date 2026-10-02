import * as React from 'react';
const majorVersion = parseInt(React.version, 10);
export function isReactVersionAtLeast(reactVersionToCheck) {
  return majorVersion >= reactVersionToCheck;
}
'use client';

import * as React from 'react';

/**
 * Returns a previous value of its argument.
 * @param value Current value.
 * @returns Previous value, or null if there is no previous value.
 */
export function usePreviousValue(value) {
  const [state, setState] = React.useState({
    current: value,
    previous: null
  });
  if (!Object.is(value, state.current)) {
    setState({
      current: value,
      previous: state.current
    });
  }
  return state.previous;
}
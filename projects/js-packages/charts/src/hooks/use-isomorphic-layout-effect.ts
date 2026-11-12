import { useEffect, useLayoutEffect } from 'react';

// useLayoutEffect on the client, useEffect on the server to avoid React's SSR warning.
export const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' ? useLayoutEffect : useEffect;

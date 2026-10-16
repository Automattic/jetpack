import { useContext } from 'react';
import { ChartScopeContext } from './chart-scope-context';

/**
 * Returns the nearest chart scope element, or `null` when rendered outside any scope (and during SSR, before the ref is attached).
 *
 * @return {HTMLElement | null} The nearest chart scope element, or `null`.
 */
export const useChartScopeElement = (): HTMLElement | null => useContext( ChartScopeContext );

/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { getDashboardSections, type DashboardSection } from '../config';

/**
 * Get the ordered list of dashboard sections.
 *
 * Wraps the pure `getDashboardSections()` builder in `useMemo` so the section
 * list (and its translated labels) is built once per mount instead of on every
 * render. The section set is static, so an empty dependency array is correct.
 *
 * @return The ordered, memoized list of dashboard sections.
 */
export function useDashboardSections(): DashboardSection[] {
	return useMemo( () => getDashboardSections(), [] );
}

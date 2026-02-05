import { Children, isValidElement, useMemo, type ReactNode } from 'react';
import { Legend } from '../components/legend';

/**
 * Hook to detect if children contain a Legend component (composition pattern).
 *
 * @param {ReactNode} children - React children to search through
 * @return {boolean}           Whether a Legend component is present in children
 */
export function useHasLegendChild( children: ReactNode ): boolean {
	return useMemo( () => {
		let found = false;

		Children.forEach( children, child => {
			if ( isValidElement( child ) && child.type === Legend ) {
				found = true;
			}
		} );

		return found;
	}, [ children ] );
}

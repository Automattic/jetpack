/**
 * External dependencies
 */
import { useCallback, useState } from 'react';

/**
 * A color role of the charts catalog, read from the element's computed style the way the
 * chart library reads its own. The catalog declares the roles as custom properties on the
 * charts scope, so the element has to render under a charts provider.
 *
 * @param role     - The role name after `--a8c-charts-color-`, e.g. `surface-secondary`.
 * @param fallback - The color before the element mounts, and where the catalog is absent.
 * @return A ref callback for the element to read from, and the resolved color.
 */
export function useChartRoleColor< T extends HTMLElement >( role: string, fallback: string ) {
	const [ color, setColor ] = useState( fallback );

	const ref = useCallback(
		( element: T | null ) => {
			if ( ! element ) {
				return;
			}
			const resolved = getComputedStyle( element )
				.getPropertyValue( `--a8c-charts-color-${ role }` )
				.trim();
			setColor( resolved || fallback );
		},
		[ role, fallback ]
	);

	return [ ref, color ] as const;
}

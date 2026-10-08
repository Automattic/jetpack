/**
 * External dependencies
 */
import * as wordpressIcons from '@wordpress/icons';
import { isValidElement } from 'react';
/**
 * Internal dependencies
 */
import * as dashboardIcons from './library';
import type { ReactElement } from 'react';

/**
 * The collection a `widget.json` names an icon under: `jpa/<name>`.
 */
export const ICON_COLLECTION = 'jpa';

const REFERENCE = /^jpa\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/**
 * The export name of a kebab-case icon name: `chart-bar` to `chartBar`.
 *
 * @param name - The kebab-case name.
 * @return The camelCase export name.
 */
function toExportName( name: string ): string {
	return name.replace( /-([a-z0-9])/g, ( _, letter: string ) => letter.toUpperCase() );
}

/**
 * Resolves a `jpa/<name>` reference to a renderable icon: the dashboard's own icons first, then
 * `@wordpress/icons` under the same kebab-case name. Anything else resolves to `null`.
 *
 * @param reference - The icon name a widget record carries.
 * @return The icon element, or `null` when the name resolves to nothing.
 */
export async function resolveWidgetIcon( reference: string ): Promise< ReactElement | null > {
	const match = REFERENCE.exec( reference );
	if ( ! match ) {
		return null;
	}

	const exportName = toExportName( match[ 1 ] );
	for ( const library of [ dashboardIcons, wordpressIcons ] as Record< string, unknown >[] ) {
		const icon = library[ exportName ];
		if ( isValidElement( icon ) ) {
			return icon;
		}
	}

	return null;
}

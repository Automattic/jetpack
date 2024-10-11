import { Filter, View } from '@wordpress/dataviews';
import { code, color, grid, plugins, shield, wordpress } from '@wordpress/icons';
import { Threat } from '../../../../plugins/protect/src/js/types/threats';

const applyFilter = ( data: Record< string, unknown >, filter: Filter ): boolean => {
	const value = data[ filter.field ];

	if ( value === undefined || filter.value === undefined ) {
		return true;
	}

	switch ( filter.operator ) {
		case 'is':
			return value === filter.value;
		case 'isNot':
			return value !== filter.value;
		case 'isAny':
			return filter.value.includes( value );
		case 'isNone':
			return ! filter.value.includes( value );
		case 'isAll':
			return filter.value.every( ( filterValue: unknown ) => filterValue === value );
		case 'isNotAll':
			return ! filter.value.every( ( filterValue: unknown ) => filterValue === value );
		default:
			return true;
	}
};

/**
 * Filter function for determining whether a threat should be displayed, based on a DataView view.
 *
 * @example data.filter( threat => filterThreatByView( threat, view ) )
 *
 * @param {Array}  threat - Threat data.
 * @param {object} view   - DataView view.
 *
 * @return {boolean} Whether the threat should be displayed.
 */
export function filterThreatByView( threat: Threat, view: View ): boolean {
	if ( ! view.filters.every( filter => applyFilter( threat, filter ) ) ) {
		return false;
	}

	if ( view.search ) {
		const searchStr =
			threat.title.toLowerCase() +
			threat.description.toLowerCase() +
			threat.signature.toLowerCase();

		if ( searchStr.indexOf( view.search.toLowerCase() ) === -1 ) {
			return false;
		}
	}

	return true;
}

/**
 * Sort function for comparing two threats, based on a DataView view.
 *
 * @example data.sort( ( a, b ) => sortThreatsByView( a, b, view ) )
 *
 * @param {object} a    - Threat A.
 * @param {object} b    - Threat B.
 * @param {object} view - DataView view.
 *
 * @return {number} Sort order.
 */
export function sortThreatsByView( a: Threat, b: Threat, view: View ): number {
	const field = view.sort.field;

	const direction = view.sort.direction === 'asc' ? 1 : -1;
	if ( a[ field ] < b[ field ] ) {
		return -1 * direction;
	}
	if ( a[ field ] > b[ field ] ) {
		return 1 * direction;
	}
	return 0;
}

export const getThreatIconByType = ( type: string ) => {
	switch ( type ) {
		case 'plugin':
			return plugins;
		case 'theme':
			return color;
		case 'core':
			return wordpress;
		case 'file':
			return code;
		case 'database':
			return grid;
		default:
			return shield;
	}
};

/**
 * External dependencies
 */
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
/**
 * Internal dependencies
 */
import type { UtmUrlBuilderValues } from './utm-url-builder-dialog';
import type { StatsItemAction } from '@jetpack-premium-analytics/data';

const UTM_KEYS = {
	utm_campaign: 'campaign',
	utm_source: 'source',
	utm_medium: 'medium',
} as const;

export function getUtmUrlBuilderValues(
	actions: StatsItemAction[] | undefined
): Partial< UtmUrlBuilderValues > | null {
	const data = actions?.find( action => action.type === 'url-builder' )?.data;
	if ( ! data || typeof data !== 'object' || Array.isArray( data ) ) {
		return null;
	}

	const record = data as Record< string, unknown >;
	const values: Partial< UtmUrlBuilderValues > = {};

	const destination = safeHttpUrl( record.url );
	if ( destination ) {
		values.destination = destination;
	}
	for ( const [ key, field ] of Object.entries( UTM_KEYS ) ) {
		if ( typeof record[ key ] === 'string' ) {
			values[ field ] = record[ key ];
		}
	}

	return Object.keys( values ).length > 0 ? values : null;
}

import { getQueryArg } from '@wordpress/url';
import { ALL_AI_AGENTS_ACTOR_ID } from './actor-elements';
import type { Filter, Operator } from '@wordpress/dataviews';

export const extractActivityLogTypeValues = ( filters: Filter[] ): string[] => {
	const filter = filters.find( item => item.field === 'activity_type' );
	if ( ! filter ) {
		return [];
	}
	const { value } = filter;
	if ( Array.isArray( value ) ) {
		return value.filter( ( item ): item is string => typeof item === 'string' && item.length > 0 );
	}
	if ( typeof value === 'string' && value.length > 0 ) {
		return [ value ];
	}
	return [];
};

export const extractActorIdValues = ( filters: Filter[] ): string[] => {
	const filter = filters.find( item => item.field === 'actor' );
	if ( ! filter ) {
		return [];
	}
	const { value } = filter;
	if ( Array.isArray( value ) ) {
		return value.filter( ( item ): item is string => typeof item === 'string' && item.length > 0 );
	}
	if ( typeof value === 'string' && value.length > 0 ) {
		return [ value ];
	}
	return [];
};

/**
 * Filters to apply on first load from the page URL. Only "All AI agents" is allowed.
 *
 * @param href      - The page URL.
 * @param hasAccess - Whether the site has paid Activity Log access.
 * @return The preset filters, empty when none apply.
 */
export const getPresetFilters = ( href: string, hasAccess: boolean ): Filter[] =>
	hasAccess && getQueryArg( href, 'actor' ) === ALL_AI_AGENTS_ACTOR_ID
		? [ { field: 'actor', operator: 'isAny' as Operator, value: [ ALL_AI_AGENTS_ACTOR_ID ] } ]
		: [];

import type { DataViewsDrilldownGroup } from './dataviews-drilldown';
import type { View } from '@wordpress/dataviews';

const DEFAULT_PER_PAGE = 10;
const GROUP_TYPE_FIELD_ID = 'type';

type DrilldownPaginationInfo = {
	totalItems: number;
	totalPages: number;
};

type ProcessedDrilldownGroups = {
	groups: DataViewsDrilldownGroup[];
	paginationInfo: DrilldownPaginationInfo;
};

/**
 * Normalize search input for case-insensitive drilldown matching.
 *
 * @param value - The search value.
 * @return The normalized value.
 */
function normalizeSearch( value: string | undefined ): string {
	return ( value ?? '' ).trim().toLowerCase();
}

/**
 * Whether a group label matches the current search query.
 *
 * @param group - The drilldown group.
 * @param query - The normalized search query.
 * @return Whether the group label matches.
 */
function groupMatchesSearch( group: DataViewsDrilldownGroup, query: string ): boolean {
	return query !== '' && group.label.toLowerCase().includes( query );
}

/**
 * Read the active group type filter values from the DataViews view.
 *
 * @param view - The DataViews view state.
 * @return The selected filter values, or undefined when no active filter is set.
 */
function getActiveGroupTypeFilterValues( view: View ): ReadonlySet< string > | undefined {
	const filterValues = view.filters
		?.filter( filter => filter.field === GROUP_TYPE_FIELD_ID && filter.operator === 'isAny' )
		.flatMap( filter => ( Array.isArray( filter.value ) ? filter.value : [] ) )
		.filter( ( value ): value is string => typeof value === 'string' );

	if ( ! filterValues?.length ) {
		return undefined;
	}

	return new Set( filterValues );
}

/**
 * Whether a group matches the active group type filter.
 *
 * @param group               - The drilldown group.
 * @param selectedValues      - The active filter values.
 * @param getGroupFilterValue - Resolves the group filter value.
 * @return Whether the group matches the active filter.
 */
function groupMatchesTypeFilter(
	group: DataViewsDrilldownGroup,
	selectedValues: ReadonlySet< string > | undefined,
	getGroupFilterValue?: ( group: DataViewsDrilldownGroup ) => string
): boolean {
	if ( ! selectedValues ) {
		return true;
	}

	if ( ! getGroupFilterValue ) {
		return true;
	}

	return selectedValues.has( getGroupFilterValue( group ) );
}

/**
 * Paginate, search, and expand groups for the custom drill-down list.
 *
 * Pagination counts groups only; children are included only when their group is
 * expanded, or when a child-label search match force-expands the group.
 *
 * @param groups              - The full drilldown groups.
 * @param view                - The DataViews view state.
 * @param expandedIds         - Expanded drilldown group IDs.
 * @param getGroupFilterValue - Optional group filter value resolver.
 * @return The visible groups and pagination metadata.
 */
export function processDrilldownGroups(
	groups: DataViewsDrilldownGroup[],
	view: View,
	expandedIds: ReadonlySet< string >,
	getGroupFilterValue?: ( group: DataViewsDrilldownGroup ) => string
): ProcessedDrilldownGroups {
	const query = normalizeSearch( view.search );
	const selectedTypeValues = getActiveGroupTypeFilterValues( view );
	const filteredGroups = groups.filter( group =>
		groupMatchesTypeFilter( group, selectedTypeValues, getGroupFilterValue )
	);
	const matchingGroups = query
		? filteredGroups
				.map( group => {
					const groupMatches = groupMatchesSearch( group, query );
					const matchingChildren = group.children.filter( child =>
						child.label.toLowerCase().includes( query )
					);

					if ( ! groupMatches && ! matchingChildren.length ) {
						return undefined;
					}

					return {
						group,
						groupMatches,
						matchingChildren,
					};
				} )
				.filter( ( entry ): entry is NonNullable< typeof entry > => Boolean( entry ) )
		: filteredGroups.map( group => ( {
				group,
				groupMatches: false,
				matchingChildren: [],
		  } ) );
	const perPage = Math.max( 1, view.perPage ?? DEFAULT_PER_PAGE );
	const page = Math.max( 1, view.page ?? 1 );
	const totalItems = matchingGroups.length;
	const totalPages = Math.ceil( totalItems / perPage );
	const start = ( page - 1 ) * perPage;
	const pageGroups = matchingGroups.slice( start, start + perPage );

	return {
		groups: pageGroups.map( ( { group, groupMatches, matchingChildren } ) => {
			const isChildSearchMatch = query !== '' && ! groupMatches && matchingChildren.length > 0;
			const isExpanded = expandedIds.has( group.id ) || isChildSearchMatch;
			const expandedChildren = isChildSearchMatch ? matchingChildren : group.children;
			const children = isExpanded ? expandedChildren : [];

			return {
				...group,
				children,
			};
		} ),
		paginationInfo: {
			totalItems,
			totalPages,
		},
	};
}

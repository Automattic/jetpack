import type { DrilldownListGroup } from './drilldown-list';
import type { View } from '@wordpress/dataviews';

const DEFAULT_PER_PAGE = 10;

type DrilldownPaginationInfo = {
	totalItems: number;
	totalPages: number;
};

type ProcessedDrilldownGroups = {
	groups: DrilldownListGroup[];
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
function groupMatchesSearch( group: DrilldownListGroup, query: string ): boolean {
	return query !== '' && group.label.toLowerCase().includes( query );
}

/**
 * Paginate, search, and expand groups for the custom drill-down list.
 *
 * Pagination counts groups only; children are included only when their group is
 * expanded, or when a child-label search match force-expands the group.
 *
 * @param groups      - The full drilldown groups.
 * @param view        - The DataViews view state.
 * @param expandedIds - Expanded drilldown group IDs.
 * @return The visible groups and pagination metadata.
 */
export function processDrilldownGroups(
	groups: DrilldownListGroup[],
	view: View,
	expandedIds: ReadonlySet< string >
): ProcessedDrilldownGroups {
	const query = normalizeSearch( view.search );
	const matchingGroups = query
		? groups
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
		: groups.map( group => ( {
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

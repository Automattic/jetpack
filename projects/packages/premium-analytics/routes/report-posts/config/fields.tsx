/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/route';
/**
 * Internal dependencies
 */
import type { StatsArchivesItem, StatsTopPostsItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

/**
 * DataViews field config for the Posts & Pages records table.
 *
 * Built as a getter (not a module constant) so the labels translate after the
 * i18n locale data has loaded, mirroring the tab/section definitions on the
 * other routes.
 *
 * @return The field config.
 */
export function getPostsFields(): Field< StatsTopPostsItem >[] {
	return [
		{
			id: 'title',
			label: __( 'Title', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => String( item.label ?? '' ),
			render: ( { item } ) => {
				const title = String( item.label ?? '' );

				// Posts with an ID drill into the post/page detail page; rows
				// without one (e.g. the home page archive row) stay plain text.
				if ( ! item.id ) {
					return <>{ title }</>;
				}

				return (
					<Link to="/post/$postId" params={ { postId: String( item.id ) } as unknown as never }>
						{ title }
					</Link>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => <>{ item.views.toLocaleString() }</>,
		},
	];
}

/**
 * A flattened Archives row: the normalized archives report is grouped by
 * archive type (`home`, `tax`, …) with the individual archive pages/terms as
 * children; the table shows the flat list of those entries.
 */
export type ArchiveRow = {
	id: string;
	label: string;
	views: number;
	link?: string;
};

/**
 * Build the visible table label from an archive URL.
 *
 * @param link - The archive URL from the stats response.
 * @return The archive path and query string.
 */
function getArchiveLinkLabel( link: string ): string | undefined {
	try {
		const url = new URL( link, 'https://example.com' );
		const path = url.pathname.replace( /\/+$/, '' ) || '/';

		return `${ path }${ url.search }`;
	} catch {
		return undefined;
	}
}

/**
 * Build a fallback label from the normalized archive group path.
 *
 * @param parts - Archive group labels from root to leaf.
 * @return The slash-joined fallback label.
 */
function getArchiveFallbackLabel( parts: string[] ): string {
	return parts.filter( Boolean ).join( '/' );
}

/**
 * Flatten one normalized archive item to leaf table rows.
 *
 * @param item - The normalized archive item.
 * @param path - Parent archive labels.
 * @param id   - Stable ID prefix for the item.
 * @return Leaf archive rows for the table.
 */
function flattenArchiveEntry( item: StatsArchivesItem, path: string[], id: string ): ArchiveRow[] {
	const label = String( item.label ?? '' );
	const nextPath = label ? [ ...path, label ] : path;
	const children = item.children ?? [];

	if ( children.length ) {
		return children.flatMap( ( child, index ) =>
			flattenArchiveEntry( child, nextPath, `${ id }-${ index }` )
		);
	}

	const link = typeof item.link === 'string' ? item.link : undefined;

	return [
		{
			id,
			label: link
				? getArchiveLinkLabel( link ) ?? getArchiveFallbackLabel( nextPath )
				: getArchiveFallbackLabel( nextPath ),
			views: item.value,
			link,
		},
	];
}

/**
 * Flatten the archives report groups into table rows. The backend groups
 * archive entries by type/taxonomy; DataViews does not show nested rows yet,
 * so the table shows only the leaf archive entries and labels them by URL
 * path/query (`/category/news`, `/?s=analytics`, …).
 *
 * @param items - The top-level archive groups.
 * @return The flat rows.
 */
export function flattenArchiveRows( items: StatsArchivesItem[] ): ArchiveRow[] {
	return items.flatMap( ( group, groupIndex ) =>
		flattenArchiveEntry( group, [], `${ String( group.label ) }-${ groupIndex }` )
	);
}

/**
 * DataViews field config for the Archives records table.
 *
 * @return The field config.
 */
export function getArchivesFields(): Field< ArchiveRow >[] {
	return [
		{
			id: 'title',
			label: __( 'Title', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				if ( ! item.link ) {
					return <>{ item.label }</>;
				}

				return (
					<a href={ item.link } target="_blank" rel="noreferrer">
						{ item.label }
					</a>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => <>{ item.views.toLocaleString() }</>,
		},
	];
}

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
 * Flatten the archives report groups into table rows — each group's children
 * (archive pages, taxonomy terms), or the group itself when it has none.
 *
 * @param items - The top-level archive groups.
 * @return The flat rows.
 */
export function flattenArchiveRows( items: StatsArchivesItem[] ): ArchiveRow[] {
	return items.flatMap( ( group, groupIndex ) => {
		const entries = group.children?.length ? group.children : [ group ];

		return entries.map( ( entry, index ) => ( {
			id: `${ String( group.label ) }-${ groupIndex }-${ index }`,
			label: String( entry.label ?? '' ),
			views: entry.value,
			link: typeof entry.link === 'string' ? entry.link : undefined,
		} ) );
	} );
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

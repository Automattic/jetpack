/**
 * External dependencies
 */
import {
	useSiteHomeUrl,
	type StatsArchivesComparisonItem,
	type StatsArchivesItem,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { MetricWithComparison } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Link as RouteLink } from '@wordpress/route';
import { Link as UiLink } from '@wordpress/ui';
import type { Field } from '@wordpress/dataviews';

const VIEWS_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

/**
 * Render the homepage title using the URL from core site settings.
 *
 * @param props       - Component props.
 * @param props.title - The homepage row title.
 * @return The linked title, or plain text while settings are unavailable.
 */
function HomepageTitle( { title }: { title: string } ) {
	const homeUrl = useSiteHomeUrl();

	if ( ! homeUrl ) {
		return <>{ title }</>;
	}

	return (
		<UiLink href={ homeUrl } variant="unstyled" openInNewTab rel="noopener noreferrer">
			{ title }
		</UiLink>
	);
}

/**
 * DataViews field config for the Posts & Pages records table.
 *
 * Built as a getter (not a module constant) so the labels translate after the
 * i18n locale data has loaded, mirroring the tab/section definitions on the
 * other routes.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getPostsFields( withComparison = false ): Field< StatsTopPostsComparisonItem >[] {
	return [
		{
			id: 'title',
			label: __( 'Title', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => String( item.label ?? '' ),
			render: ( { item } ) => {
				const title = String( item.label ?? '' );

				// The API sends no URL for homepage rows, so link them to the site
				// home resolved from core settings. Posts with an ID drill into the
				// post/page detail page; other rows without an ID stay plain text.
				if ( item.type === 'homepage' ) {
					return <HomepageTitle title={ title } />;
				}

				if ( ! item.id ) {
					return <>{ title }</>;
				}

				return (
					<RouteLink
						to="/post/$postId"
						params={ { postId: String( item.id ) } as unknown as never }
					>
						{ title }
					</RouteLink>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ withComparison ? item.previousViews : undefined }
					dataFormat={ VIEWS_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
	];
}

/** A flat DataViews row carrying its place in the archives hierarchy. */
export type ArchiveRow = {
	id: string;
	parentId?: string;
	label: string;
	views: number;
	previousViews?: number;
	link?: string;
	isGroup: boolean;
};

/**
 * Human-readable labels for the archive-type keys returned by the API.
 *
 * @param archiveType - The raw archive-type key.
 * @return The archive type's display label.
 */
function getArchiveTypeLabel( archiveType: string ): string {
	switch ( archiveType ) {
		case 'author':
			return __( 'Authors', 'jetpack-premium-analytics-pkg' );
		case 'cat':
			return __( 'Categories', 'jetpack-premium-analytics-pkg' );
		case 'err':
			return __( 'Error', 'jetpack-premium-analytics-pkg' );
		case 'home':
			return __( 'Homepage (Latest posts)', 'jetpack-premium-analytics-pkg' );
		case 'search':
			return __( 'Searches', 'jetpack-premium-analytics-pkg' );
		case 'tag':
			return __( 'Tags', 'jetpack-premium-analytics-pkg' );
		case 'tax':
			return __( 'Taxonomies', 'jetpack-premium-analytics-pkg' );
		case 'date':
			return __( 'Dates', 'jetpack-premium-analytics-pkg' );
		case 'multiple':
			return __( 'Aggregated', 'jetpack-premium-analytics-pkg' );
		case 'other':
			return __( 'Others', 'jetpack-premium-analytics-pkg' );
		case 'post_type':
			return __( 'Post types', 'jetpack-premium-analytics-pkg' );
		default:
			return archiveType.charAt( 0 ).toUpperCase() + archiveType.slice( 1 ).toLowerCase();
	}
}

/**
 * Humanize an intermediate archive group such as a taxonomy key.
 *
 * @param label - The raw group label.
 * @return The human-readable group label.
 */
function getArchiveGroupLabel( label: string ): string {
	const spaced = label.replace( /_/g, ' ' );
	return spaced.charAt( 0 ).toUpperCase() + spaced.slice( 1 );
}

/**
 * Convert one normalized archive item into DataViews' flat hierarchy shape.
 *
 * @param item       - The normalized archive item.
 * @param id         - Stable ID for the item.
 * @param parentId   - Stable ID of the parent item, when nested.
 * @param isTopLevel - Whether this item is an archive-type row.
 * @return The item followed by all of its descendants.
 */
function buildArchiveEntryRows(
	item: StatsArchivesItem | StatsArchivesComparisonItem,
	id: string,
	parentId: string | undefined,
	isTopLevel: boolean
): ArchiveRow[] {
	const rawLabel = String( item.label ?? '' );
	const children = item.children ?? [];
	const link = typeof item.link === 'string' ? item.link : undefined;
	const previousViews =
		'previousValue' in item && item.previousValue !== undefined
			? { previousViews: item.previousValue }
			: {};
	let label = rawLabel;
	if ( isTopLevel ) {
		label = getArchiveTypeLabel( rawLabel );
	} else if ( children.length ) {
		label = getArchiveGroupLabel( rawLabel );
	}
	const row: ArchiveRow = {
		id,
		...( parentId ? { parentId } : {} ),
		label: label || __( 'Untitled', 'jetpack-premium-analytics-pkg' ),
		views: item.value,
		...previousViews,
		...( link ? { link } : {} ),
		isGroup: children.length > 0,
	};

	return [
		row,
		...children.flatMap( ( child, index ) =>
			buildArchiveEntryRows( child, `${ id }-${ index }`, id, false )
		),
	];
}

/**
 * Flatten the normalized archives tree while retaining parent IDs for
 * DataViews' native hierarchy. The API's value-sorted order is preserved at
 * each level; the table can also re-sort siblings without breaking nesting.
 *
 * @param items - The top-level archive groups.
 * @return Parent and child rows in depth-first order.
 */
export function buildArchiveRows(
	items: Array< StatsArchivesItem | StatsArchivesComparisonItem >
): ArchiveRow[] {
	return items.flatMap( ( group, groupIndex ) =>
		buildArchiveEntryRows( group, `${ String( group.label ) }-${ groupIndex }`, undefined, true )
	);
}

/**
 * Prepare the archive rows for CSV export the way legacy Stats does: group
 * rows stay in as subtotals, and every descendant carries its ancestors in the
 * label (`Tags > video`) so a row still identifies itself once the table's
 * nesting is gone. `buildArchiveRows` emits parents ahead of their children,
 * so each parent's full label is already resolved by the time a child needs it.
 *
 * @param rows - The flat archive rows, in depth-first order.
 * @return The same rows, with ancestor-qualified labels.
 */
export function buildArchiveCsvRows( rows: ArchiveRow[] ): ArchiveRow[] {
	const pathById = new Map< string, string >();

	return rows.map( row => {
		const parentPath = row.parentId ? pathById.get( row.parentId ) : undefined;
		const label = parentPath ? `${ parentPath } > ${ row.label }` : row.label;

		pathById.set( row.id, label );

		return { ...row, label };
	} );
}

/**
 * DataViews field config for the Archives records table.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getArchivesFields( withComparison = false ): Field< ArchiveRow >[] {
	return [
		{
			id: 'title',
			label: __( 'Title', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				const label = item.isGroup ? <strong>{ item.label }</strong> : <>{ item.label }</>;
				const href = safeHttpUrl( item.link );

				if ( ! href ) {
					return label;
				}

				return (
					<UiLink href={ href } variant="unstyled" openInNewTab rel="noopener noreferrer">
						{ label }
					</UiLink>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ withComparison ? item.previousViews : undefined }
					dataFormat={ VIEWS_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
	];
}

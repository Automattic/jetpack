import { DataViews } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	cloud,
	image,
	post,
	plugins as pluginsIcon,
	color,
	info,
	rotateLeft,
} from '@wordpress/icons';
import { Card, Stack, Text } from '@wordpress/ui';
import { ACTIVITY_LOG_DEFAULT_PER_PAGE, useActivityLog } from '../../hooks/use-activity-log';
import { isBackupItem } from '../../types/activity';
import QueryError from '../query-error';
import './style.scss';
import type { ActivitySortOrder } from '../../data/api/activity-log';
import type { ActivityItem, ActivityKind } from '../../types/activity';
import type { Field, View } from '@wordpress/dataviews';

const ICON_BY_KIND: Record< ActivityKind, typeof cloud > = {
	backup: cloud,
	restore: rotateLeft,
	upload: image,
	post,
	'plugin-update': pluginsIcon,
	'theme-update': color,
	// Catch-all for event families we don't give a dedicated icon.
	other: info,
};

type Props = {
	selectedId: string | null;
	onSelect: ( id: string ) => void;
	view: View;
	onChangeView: ( next: View ) => void;
};

/**
 * The query a DataViews view is asking the server for.
 *
 * Exported so Overview derives the same cache key for `useActivityById` instead
 * of repeating the arithmetic and drifting into a second, needless request.
 *
 * @param view - DataViews view state.
 * @return The page, page size and direction to request.
 */
export function activityQueryArgs( view: View ): {
	page: number;
	pageSize: number;
	sortOrder: ActivitySortOrder;
} {
	return {
		page: view.page ?? 1,
		pageSize: view.perPage ?? ACTIVITY_LOG_DEFAULT_PER_PAGE,
		sortOrder: view.sort?.direction === 'asc' ? 'asc' : 'desc',
	};
}

/**
 * Returns the row's stable id for DataViews selection bookkeeping.
 *
 * Backup rows use their `rewindId` (which the URL persists); everything
 * else uses the activity's `activity_id`.
 *
 * @param item - Activity item.
 * @return The selection id.
 */
function getRowId( item: ActivityItem ): string {
	return isBackupItem( item ) ? item.rewindId : item.id;
}

/**
 * Renders the icon tile that DataViews shows in the `media` slot of the
 * list layout — a small white square with a thin border, matching the
 * legacy admin's row affordance.
 *
 * @param props      - Component props.
 * @param props.item - The activity item to render an icon for.
 * @return The rendered icon tile.
 */
function MediaCell( { item }: { item: ActivityItem } ) {
	return (
		<span className="jpb-activity-list__icon" aria-hidden="true">
			<Icon icon={ ICON_BY_KIND[ item.kind ] } size={ 20 } />
		</span>
	);
}

/**
 * The row's timestamp, formatted once for both the name and the visible line.
 *
 * Drift between the two would announce a different restore point than the one
 * on screen, on the control that picks what Restore and Download act on.
 *
 * @param item - The activity item.
 * @return The formatted timestamp.
 */
function rowDate( item: ActivityItem ): string {
	return dateI18n( 'M j, Y, g:i A', item.publishedAt, undefined );
}

/**
 * Title cell — the visible summary, plus the timestamp for assistive tech.
 *
 * DataViews points the row's `aria-labelledby` at this cell alone, so without
 * the date every row announces the same sentence and a screen-reader user
 * cannot tell which restore point they are about to open, download or restore.
 *
 * @param props      - Component props.
 * @param props.item - The activity item.
 * @return The rendered title.
 */
function TitleCell( { item }: { item: ActivityItem } ) {
	return (
		<>
			{ item.title }
			{ /* JSX drops the newline, and the name computation adds nothing back. */ }{ ' ' }
			<span className="jpb-visually-hidden">{ rowDate( item ) }</span>
		</>
	);
}

/**
 * Descriptions cell — single muted line with the timestamp + optional
 * summary, joined by a thin separator.
 *
 * @param props      - Component props.
 * @param props.item - The activity item.
 * @return The rendered description.
 */
function DescriptionCell( { item }: { item: ActivityItem } ) {
	return (
		<Stack direction="row" align="center" gap="xs">
			<Text variant="body-sm" className="jpb-text-muted jpb-activity-list__date">
				{ rowDate( item ) }
			</Text>
			{ /*
			 * `auto`, not `ltr`: WPCOM may legitimately translate this line into RTL.
			 * Same everywhere `stats` and `summary` are rendered.
			 */ }
			{ item.summary && (
				<Text variant="body-sm" className="jpb-text-muted jpb-activity-list__summary" dir="auto">
					{ item.summary }
				</Text>
			) }
		</Stack>
	);
}

/**
 * Left pane of the modernized Overview, rendered as a DataViews list.
 *
 * DataViews gives us the cog/filter affordance, pagination controls,
 * zebra striping, and row separators for free — the legacy affordances
 * `<ActivityList>` was hand-rolling get swapped out for the
 * design-system primitive.
 *
 * Controlled: view state (page, perPage) lives in the parent so the
 * right-pane row lookup can subscribe to the same paginated query the
 * list reads from. Selection is similarly URL-persisted in the parent.
 *
 * @param props              - Component props.
 * @param props.selectedId   - Currently selected row id, or null when nothing is selected.
 * @param props.onSelect     - Callback invoked with the new selection id when a row is activated.
 * @param props.view         - DataViews view state.
 * @param props.onChangeView - Callback invoked when the view state changes.
 * @return The rendered list.
 */
export default function ActivityList( { selectedId, onSelect, view, onChangeView }: Props ) {
	const { page, pageSize, sortOrder } = activityQueryArgs( view );
	const {
		items,
		totalItems,
		totalPages,
		isLoading,
		isFetching,
		isPlaceholderData,
		isPaused,
		error,
		refetch,
	} = useActivityLog( {
		page,
		pageSize,
		sortOrder,
	} );

	// DataViews' `SortDirectionControl` spreads `...view` and replaces only
	// `sort`, so without this a reorder strands the reader on page 3 of an
	// ordering they have not seen the start of.
	const handleChangeView = useCallback(
		( next: View ) => {
			const reordered = ( next.sort?.direction ?? 'desc' ) !== sortOrder;
			onChangeView( reordered ? { ...next, page: 1 } : next );
		},
		[ onChangeView, sortOrder ]
	);

	// A remembered page can outlive its log, and DataViews hides the footer at one
	// page — so nothing on screen would offer a way back. `totalPages` falls back to
	// 1, so in flight, paused offline and failed all read as a one-page log; a
	// literal 0 survives that `??`, which is what `>= 1` guards against.
	useEffect( () => {
		if ( ! isFetching && ! isPaused && ! error && totalPages >= 1 && page > totalPages ) {
			onChangeView( { ...view, page: totalPages } );
		}
	}, [ isFetching, isPaused, error, totalPages, page, view, onChangeView ] );

	// DataViews shows its own "No results" whenever `data` is empty, and a
	// failed request leaves it empty — so without this a 5xx tells the
	// reader their site has no activity. The `empty` slot is the same node
	// that copy renders in, so replacing it puts the reason exactly where
	// the wrong answer used to be.
	const failure = error ? (
		<QueryError
			title={ __( "We couldn't load your site's activity.", 'jetpack-backup-pkg' ) }
			error={ error }
			onRetry={ refetch }
			isRetrying={ isFetching }
		/>
	) : undefined;

	// A stale page DataViews kept, or a merged restore row, leaves the `empty`
	// slot unrendered — so a failure then needs somewhere else to report from.
	const reportsAboveList = failure !== undefined && items.length > 0;

	// Every field opts out of filtering, and all but `description` out of sorting:
	// `/activity/rewindable` takes no search term and orders only on the event
	// timestamp, so any other control would be a label the server cannot honour.
	// Zero filters also keeps `FiltersToggle` unrendered, and with it a private
	// `@wordpress/components` API that drops the dashboard to its error boundary.
	const fields: Field< ActivityItem >[] = useMemo(
		() => [
			{
				id: 'icon',
				type: 'media',
				label: __( 'Icon', 'jetpack-backup-pkg' ),
				render: MediaCell,
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'title',
				type: 'text',
				label: __( 'Title', 'jetpack-backup-pkg' ),
				render: TitleCell,
				getValue: ( { item } ) => item.title,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'description',
				type: 'text',
				label: __( 'When', 'jetpack-backup-pkg' ),
				render: DescriptionCell,
				getValue: ( { item } ) =>
					`${ rowDate( item ) }${ item.summary ? ` ${ item.summary }` : '' }`,
				enableHiding: false,
				filterBy: false,
			},
		],
		[]
	);

	const onChangeSelection = useCallback(
		( next: string[] ) => {
			const [ first ] = next;
			if ( first ) {
				onSelect( first );
			}
		},
		[ onSelect ]
	);

	const selection = useMemo< string[] >(
		() => ( selectedId ? [ selectedId ] : [] ),
		[ selectedId ]
	);

	// `isLoading` alone is only ever true on the very first load: the query
	// sets `placeholderData: keepPreviousData`, so a page change keeps the
	// previous rows and leaves React Query "not pending". Reporting it by
	// itself told DataViews nothing was happening while the reader looked
	// at rows from the page they had just left.
	//
	// This cannot swallow the `empty` slot: DataViews initialises
	// `hasInitiallyLoaded` to `!isLoading` and latches it true on the first
	// non-loading render, and the spinner branch that would replace the
	// `empty` slot is gated on `!hasInitiallyLoaded`.
	//
	// Placeholder data is the qualifier, not `isFetching` alone: DataViews
	// puts `inert` on the composite that owns every row, so reporting a
	// background refetch — the one a finished backup triggers — would blur
	// the reader out of the list mid-read. A page or sort change still
	// inerts them, and the footer's own copy of this flag inerts the
	// control the reader just used; DataViews offers no way to separate
	// those, so that case is unchanged rather than fixed.
	const isBusy = isLoading || ( isFetching && isPlaceholderData );

	return (
		<Card.Root className="jpb-activity-list" aria-busy={ isBusy }>
			{ reportsAboveList && <div className="jpb-activity-list__failure">{ failure }</div> }
			<DataViews< ActivityItem >
				data={ items }
				fields={ fields }
				view={ view }
				onChangeView={ handleChangeView }
				paginationInfo={ { totalItems, totalPages } }
				defaultLayouts={ { list: {} } }
				getItemId={ getRowId }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				isLoading={ isBusy }
				search={ false }
				empty={ reportsAboveList ? undefined : failure }
			/>
		</Card.Root>
	);
}

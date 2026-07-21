import { DataViews } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, cloud, image, post, plugins as pluginsIcon, color } from '@wordpress/icons';
import { Card, Stack, Text } from '@wordpress/ui';
import { useMockActivityLog } from '../../hooks/use-mock-activity-log';
import { isBackupItem } from '../../types/activity';
import './style.scss';
import type { ActivityItem, ActivityKind } from '../../types/activity';
import type { Field, View } from '@wordpress/dataviews';

const ICON_BY_KIND: Record< ActivityKind, typeof cloud > = {
	backup: cloud,
	upload: image,
	post,
	'plugin-update': pluginsIcon,
	'theme-update': color,
};

type Props = {
	selectedId: string | null;
	onSelect: ( id: string ) => void;
};

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
				{ dateI18n( 'M j, Y, g:i A', item.publishedAt, undefined ) }
			</Text>
			{ item.summary && (
				<Text variant="body-sm" className="jpb-text-muted jpb-activity-list__summary">
					{ item.summary }
				</Text>
			) }
		</Stack>
	);
}

const DEFAULT_PER_PAGE = 10;

/**
 * Left pane of the modernized Overview, rendered as a DataViews list.
 *
 * DataViews gives us the cog/filter affordance, pagination controls,
 * zebra striping, row separators, and search box for free — the legacy
 * affordances `<ActivityList>` was hand-rolling get swapped out for the
 * design-system primitive.
 *
 * Selection lives in the parent (URL-persisted via `?selected=<id>`),
 * with `<DataViews>` driven through its `selection` + `onChangeSelection`
 * props so the row click is the single source of truth for "which row
 * is highlighted".
 *
 * @param props            - Component props.
 * @param props.selectedId - Currently selected row id, or null when nothing is selected.
 * @param props.onSelect   - Callback invoked with the new selection id when a row is activated.
 * @return The rendered list.
 */
export default function ActivityList( { selectedId, onSelect }: Props ) {
	// In DataViews' list layout, the `titleField`, `mediaField` and
	// `descriptionField` fields are rendered implicitly — anything else
	// in `fields` would render a second time as a generic row. Leave
	// `fields` empty so the title + media + description are the only
	// things shown per row.
	const [ view, setView ] = useState< View >( {
		type: 'list',
		page: 1,
		perPage: DEFAULT_PER_PAGE,
		search: '',
		filters: [],
		titleField: 'title',
		mediaField: 'icon',
		descriptionField: 'description',
		fields: [],
	} );

	// Drive the hook with DataViews' own view state so the hook is the
	// single source of truth for the visible slice + counts. The mock
	// hook's contract matches the real `useActivityLog` from the
	// data-layer follow-up, so swapping the import line later is the
	// only change required here.
	const page = view.page ?? 1;
	const perPage = view.perPage ?? DEFAULT_PER_PAGE;
	const search = view.search ?? '';
	const { items, totalItems, totalPages, isLoading } = useMockActivityLog( {
		page,
		pageSize: perPage,
		search,
	} );

	const fields: Field< ActivityItem >[] = useMemo(
		() => [
			{
				id: 'icon',
				type: 'media',
				label: __( 'Icon', 'jetpack-backup-pkg' ),
				render: MediaCell,
				enableHiding: false,
				enableSorting: false,
			},
			{
				id: 'title',
				type: 'text',
				label: __( 'Title', 'jetpack-backup-pkg' ),
				getValue: ( { item } ) => item.title,
				enableGlobalSearch: true,
			},
			{
				id: 'description',
				type: 'text',
				label: __( 'When', 'jetpack-backup-pkg' ),
				render: DescriptionCell,
				getValue: ( { item } ) =>
					`${ dateI18n( 'M j, Y, g:i A', item.publishedAt, undefined ) }${
						item.summary ? ` ${ item.summary }` : ''
					}`,
				enableGlobalSearch: true,
				enableHiding: false,
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

	return (
		<Card.Root className="jpb-activity-list" aria-busy={ isLoading }>
			<DataViews< ActivityItem >
				data={ items }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				paginationInfo={ { totalItems, totalPages } }
				defaultLayouts={ { list: {} } }
				getItemId={ getRowId }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				isLoading={ isLoading }
				search={ true }
				searchLabel={ __( 'Search backups', 'jetpack-backup-pkg' ) }
			/>
		</Card.Root>
	);
}

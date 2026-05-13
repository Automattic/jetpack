import { useEntityRecords } from '@wordpress/core-data';
import { DataViews, type Action, type View, type ViewTable } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

const formatDate = ( iso: string ): string => {
	if ( ! iso ) {
		return '—';
	}
	const datePart = iso.split( 'T' )[ 0 ];
	const [ year, month, day ] = datePart.split( '-' );
	if ( ! year || ! month || ! day ) {
		return iso;
	}
	return `${ year }-${ month }-${ day }`;
};

interface PostRecord {
	id: number;
	title?: { rendered?: string };
	date_gmt?: string;
	date?: string;
}

interface PostRow {
	id: number;
	title: string;
	date: string;
}

interface PostsPickerProps {
	selectedIds: number[];
	onChange: ( ids: number[] ) => void;
	disabled?: boolean;
	maxSelection?: number;
}

const POSTS_PER_PAGE = 20;

const defaultView: ViewTable = {
	type: 'table',
	titleField: 'title',
	showTitle: true,
	fields: [ 'date' ],
	page: 1,
	perPage: POSTS_PER_PAGE,
	sort: { field: 'date', direction: 'desc' },
	layout: {
		styles: {
			title: { minWidth: '260px' },
			date: { width: '160px' },
		},
	},
};

const getItemId = ( item: PostRow ) => String( item.id );

const PostsPicker = ( { selectedIds, onChange, disabled, maxSelection }: PostsPickerProps ) => {
	const [ view, setView ] = useState< View >( defaultView );

	// Fetch a generous page of recent published posts. The DataView paginates client-side.
	const { records, hasResolved } = useEntityRecords< PostRecord >( 'postType', 'post', {
		status: 'publish',
		per_page: 100,
		orderby: 'date',
		order: 'desc',
		_fields: 'id,title,date',
	} );

	const rows = useMemo< PostRow[] >( () => {
		const list = records ?? [];
		return list.map( ( post: PostRecord ) => ( {
			id: post.id,
			title: decodeEntities( post.title?.rendered ?? '' ) || __( '(Untitled)', 'jetpack-podcast' ),
			date: post.date_gmt ?? post.date ?? '',
		} ) );
	}, [ records ] );

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Title', 'jetpack-podcast' ),
				enableHiding: false,
				enableSorting: false,
				render: ( { item }: { item: PostRow } ) => item.title,
			},
			{
				id: 'date',
				label: __( 'Date', 'jetpack-podcast' ),
				render: ( { item }: { item: PostRow } ) => formatDate( item.date ),
			},
		],
		[]
	);

	// Empty action list keeps the DataView in selection-only mode (no per-row actions).
	const actions = useMemo< Action< PostRow >[] >( () => [], [] );

	const selection = useMemo( () => selectedIds.map( String ), [ selectedIds ] );

	const handleChangeSelection = useCallback(
		( ids: string[] ) => {
			const next = ids.map( Number ).filter( id => Number.isFinite( id ) );
			const capped = maxSelection ? next.slice( 0, maxSelection ) : next;
			onChange( capped );
		},
		[ onChange, maxSelection ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: rows.length,
			totalPages: Math.max( 1, Math.ceil( rows.length / POSTS_PER_PAGE ) ),
		} ),
		[ rows.length ]
	);

	return (
		<div className={ disabled ? 'podcast__posts-picker--disabled' : undefined }>
			<DataViews
				data={ rows }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				defaultLayouts={ { table: {} } }
				getItemId={ getItemId }
				selection={ selection }
				onChangeSelection={ handleChangeSelection }
				isLoading={ ! hasResolved }
				actions={ actions }
				paginationInfo={ paginationInfo }
			/>
		</div>
	);
};

export default PostsPicker;

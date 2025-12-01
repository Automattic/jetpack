/**
 * External dependencies
 */
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';

/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useEntityRecords } from '@wordpress/core-data';
import { DataViews } from '@wordpress/dataviews';
import { useMemo, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const EMPTY_ARRAY = [];

const defaultLayouts = {
	table: {},
	list: {},
};

const DEFAULT_VIEW = {
	type: 'table',
	filters: [],
	perPage: 20,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	titleField: 'from',
	fields: [ 'from', 'date', 'source' ],
};

/**
 *
 * @param item
 */
function getItemId( item ) {
	return item.id.toString();
}

/**
 *
 */
export function stage() {
	const params = useParams( { from: '/responses/$view' } );
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();
	const status = params.view === 'spam' ? 'spam' : params.view === 'trash' ? 'trash' : 'publish';

	const [ view, setView ] = useState( DEFAULT_VIEW );

	// Selection is driven by URL search params
	const selection = searchParams?.responseIds ?? [];

	const onChangeView = useCallback( newView => {
		setView( newView );
	}, [] );

	const onChangeSelection = useCallback(
		items => {
			navigate( {
				search: {
					...searchParams,
					responseIds: items.length > 0 ? items : undefined,
				},
			} );
		},
		[ searchParams, navigate ]
	);

	const { records, isResolving, totalItems, totalPages } = useEntityRecords(
		'postType',
		'feedback',
		{
			status,
			per_page: view.perPage,
			page: view.page || 1,
			orderby: view.sort?.field || 'date',
			order: view.sort?.direction || 'desc',
		}
	);

	const fields = useMemo(
		() => [
			{
				id: 'from',
				label: __( 'From', 'jetpack-forms' ),
				render: ( { item } ) => item.author_name || item.author_email || 'Anonymous',
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'date',
				label: __( 'Date', 'jetpack-forms' ),
				render: ( { item } ) => new Date( item.date ).toLocaleDateString(),
				enableSorting: false,
			},
			{
				id: 'source',
				label: __( 'Source', 'jetpack-forms' ),
				render: ( { item } ) => item.entry_title || 'Unknown',
				enableSorting: false,
			},
		],
		[]
	);

	// Actions with supportsBulk enable selection checkboxes
	const actions = useMemo(
		() => [
			{
				id: 'view-details',
				label: __( 'View details', 'jetpack-forms' ),
				isPrimary: true,
				callback: items => {
					const ids = items.map( item => getItemId( item ) );
					navigate( {
						search: {
							...searchParams,
							responseIds: ids,
						},
					} );
				},
			},
			{
				id: 'mark-as-spam',
				label: __( 'Mark as spam', 'jetpack-forms' ),
				supportsBulk: true,
				isDestructive: true,
				callback: items => {
					// TODO: Implement mark as spam
					// eslint-disable-next-line no-console
					console.log( 'Mark as spam:', items );
				},
			},
			{
				id: 'move-to-trash',
				label: __( 'Move to trash', 'jetpack-forms' ),
				supportsBulk: true,
				isDestructive: true,
				callback: items => {
					// TODO: Implement move to trash
					// eslint-disable-next-line no-console
					console.log( 'Move to trash:', items );
				},
			},
		],
		[ navigate, searchParams ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: totalItems || 0,
			totalPages: totalPages || 1,
		} ),
		[ totalItems, totalPages ]
	);

	return (
		<Page title={ __( 'Form Responses', 'jetpack-forms' ) }>
			<DataViews
				data={ records || EMPTY_ARRAY }
				fields={ fields }
				view={ view }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
				isLoading={ isResolving }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				actions={ actions }
			/>
		</Page>
	);
}

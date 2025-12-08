/* eslint-disable react-hooks/rules-of-hooks */
/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { useMemo, useState, useCallback, useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useParams, useSearch, useNavigate } from '@wordpress/route';
/**
 * Internal dependencies
 */
import * as Tabs from '../../src/dashboard/components/tabs';

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
	fields: [ 'date', 'source', 'ip' ],
};

/**
 * Get item ID as string.
 *
 * @param {object} item - The item object.
 * @return {string} The item ID as a string.
 */
function getItemId( item ) {
	return item.id.toString();
}

/**
 * Stage component for the form responses DataViews.
 *
 * @return {JSX.Element} The stage component.
 */
export function stage() {
	const params = useParams( { from: '/responses/$view' } );
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();
	let status = 'publish';
	if ( params.view === 'spam' ) {
		status = 'spam';
	} else if ( params.view === 'trash' ) {
		status = 'trash';
	}

	const { saveEntityRecord, deleteEntityRecord, invalidateResolution } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const [ view, setView ] = useState( () => ( {
		...DEFAULT_VIEW,
		search: searchParams?.search || '',
	} ) );

	const selection = searchParams?.responseIds ?? [];

	useEffect( () => {
		const urlSearch = searchParams?.search || '';
		if ( urlSearch !== view.search ) {
			setView( prev => ( { ...prev, search: urlSearch } ) );
		}
	}, [ searchParams?.search ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const onChangeView = useCallback(
		newView => {
			setView( newView );

			if ( newView.search !== view.search ) {
				navigate( {
					search: {
						...searchParams,
						search: newView.search || undefined,
					},
				} );
			}
		},
		[ navigate, searchParams, view.search ]
	);

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

	const queryParams = useMemo( () => {
		const queryArgs = {
			status,
			per_page: view.perPage,
			page: view.page || 1,
			orderby: view.sort?.field || 'date',
			order: view.sort?.direction || 'desc',
		};

		if ( view.search ) {
			queryArgs.search = view.search;
		}

		view.filters?.forEach( filter => {
			if ( ! filter.value ) {
				return;
			}
			if ( filter.field === 'read_status' ) {
				queryArgs.is_unread = filter.value === 'unread';
			}
		} );

		return queryArgs;
	}, [ status, view ] );

	const { records, isResolving, totalItems, totalPages } = useEntityRecords(
		'postType',
		'feedback',
		queryParams
	);

	const fields = useMemo(
		() => [
			{
				id: 'from',
				label: __( 'From', 'jetpack-forms' ),
				render: ( { item } ) => {
					const displayName =
						item.author_name || item.author_email || item.author_url || item.ip || 'Anonymous';
					return (
						<span style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
							{ item.is_unread && (
								<span
									style={ {
										width: '8px',
										height: '8px',
										borderRadius: '50%',
										backgroundColor: 'var(--wp-admin-theme-color, #3858e9)',
										flexShrink: 0,
									} }
									aria-label={ __( 'Unread', 'jetpack-forms' ) }
								/>
							) }
							<span style={ { fontWeight: item.is_unread ? 600 : 400 } }>{ displayName }</span>
						</span>
					);
				},
				getValue: ( { item } ) =>
					item.author_name || item.author_email || item.author_url || item.ip || 'Anonymous',
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'date',
				label: __( 'Date', 'jetpack-forms' ),
				render: ( { item } ) => {
					const dateStr = new Date( item.date ).toLocaleDateString();
					return <span style={ { fontWeight: item.is_unread ? 600 : 400 } }>{ dateStr }</span>;
				},
				enableSorting: false,
			},
			{
				id: 'source',
				label: __( 'Source', 'jetpack-forms' ),
				render: ( { item } ) => {
					const source = item.entry_title || 'Unknown';
					return <span style={ { fontWeight: item.is_unread ? 600 : 400 } }>{ source }</span>;
				},
				enableSorting: false,
			},
			{
				id: 'read_status',
				label: __( 'Status', 'jetpack-forms' ),
				elements: [
					{ label: __( 'Unread', 'jetpack-forms' ), value: 'unread' },
					{ label: __( 'Read', 'jetpack-forms' ), value: 'read' },
				],
				filterBy: { operators: [ 'is' ] },
				enableSorting: false,
				render: ( { item } ) =>
					item.is_unread ? __( 'Unread', 'jetpack-forms' ) : __( 'Read', 'jetpack-forms' ),
			},
			{
				id: 'ip',
				label: __( 'IP Address', 'jetpack-forms' ),
				render: ( { item } ) => item.ip || '-',
				enableSorting: false,
			},
		],
		[]
	);

	const invalidateCache = useCallback( () => {
		invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryParams ] );
	}, [ invalidateResolution, queryParams ] );

	const clearSelection = useCallback( () => {
		navigate( {
			search: {
				...searchParams,
				responseIds: undefined,
			},
		} );
	}, [ navigate, searchParams ] );

	const handleMarkAsSpam = useCallback(
		async items => {
			try {
				await Promise.all(
					items.map( item =>
						saveEntityRecord( 'postType', 'feedback', {
							id: item.id,
							status: 'spam',
						} )
					)
				);

				const message =
					items.length === 1
						? __( 'Response marked as spam.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: number of responses */
								_n(
									'%d response marked as spam.',
									'%d responses marked as spam.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				createSuccessNotice( message, { type: 'snackbar' } );
				invalidateCache();
				clearSelection();
			} catch {
				createErrorNotice( __( 'Failed to mark as spam.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ saveEntityRecord, createSuccessNotice, createErrorNotice, invalidateCache, clearSelection ]
	);

	const handleMarkAsNotSpam = useCallback(
		async items => {
			try {
				await Promise.all(
					items.map( item =>
						saveEntityRecord( 'postType', 'feedback', {
							id: item.id,
							status: 'publish',
						} )
					)
				);

				const message =
					items.length === 1
						? __( 'Response restored from spam.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: number of responses */
								_n(
									'%d response restored from spam.',
									'%d responses restored from spam.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				createSuccessNotice( message, { type: 'snackbar' } );
				invalidateCache();
				clearSelection();
			} catch {
				createErrorNotice( __( 'Failed to restore from spam.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ saveEntityRecord, createSuccessNotice, createErrorNotice, invalidateCache, clearSelection ]
	);

	const handleMoveToTrash = useCallback(
		async items => {
			try {
				await Promise.all(
					items.map( item =>
						deleteEntityRecord( 'postType', 'feedback', item.id, {}, { throwOnError: true } )
					)
				);

				const message =
					items.length === 1
						? __( 'Response moved to trash.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: number of responses */
								_n(
									'%d response moved to trash.',
									'%d responses moved to trash.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				createSuccessNotice( message, { type: 'snackbar' } );
				invalidateCache();
				clearSelection();
			} catch {
				createErrorNotice( __( 'Failed to move to trash.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ deleteEntityRecord, createSuccessNotice, createErrorNotice, invalidateCache, clearSelection ]
	);

	const handleRestore = useCallback(
		async items => {
			try {
				await Promise.all(
					items.map( item =>
						saveEntityRecord( 'postType', 'feedback', {
							id: item.id,
							status: 'publish',
						} )
					)
				);

				const message =
					items.length === 1
						? __( 'Response restored.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: number of responses */
								_n(
									'%d response restored.',
									'%d responses restored.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				createSuccessNotice( message, { type: 'snackbar' } );
				invalidateCache();
				clearSelection();
			} catch {
				createErrorNotice( __( 'Failed to restore.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ saveEntityRecord, createSuccessNotice, createErrorNotice, invalidateCache, clearSelection ]
	);

	const handleDelete = useCallback(
		async items => {
			try {
				await Promise.all(
					items.map( item =>
						deleteEntityRecord(
							'postType',
							'feedback',
							item.id,
							{ force: true },
							{ throwOnError: true }
						)
					)
				);

				const message =
					items.length === 1
						? __( 'Response permanently deleted.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: number of responses */
								_n(
									'%d response permanently deleted.',
									'%d responses permanently deleted.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				createSuccessNotice( message, { type: 'snackbar' } );
				invalidateCache();
				clearSelection();
			} catch {
				createErrorNotice( __( 'Failed to delete.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ deleteEntityRecord, createSuccessNotice, createErrorNotice, invalidateCache, clearSelection ]
	);

	const handleMarkAsRead = useCallback(
		async items => {
			try {
				await Promise.all(
					items.map( item =>
						apiFetch( {
							path: `/wp/v2/feedback/${ item.id }/read`,
							method: 'POST',
							data: { is_unread: false },
						} )
					)
				);

				const message =
					items.length === 1
						? __( 'Response marked as read.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: number of responses */
								_n(
									'%d response marked as read.',
									'%d responses marked as read.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				createSuccessNotice( message, { type: 'snackbar' } );
				invalidateCache();
			} catch {
				createErrorNotice( __( 'Failed to mark as read.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ createSuccessNotice, createErrorNotice, invalidateCache ]
	);

	const handleMarkAsUnread = useCallback(
		async items => {
			try {
				await Promise.all(
					items.map( item =>
						apiFetch( {
							path: `/wp/v2/feedback/${ item.id }/read`,
							method: 'POST',
							data: { is_unread: true },
						} )
					)
				);

				const message =
					items.length === 1
						? __( 'Response marked as unread.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: number of responses */
								_n(
									'%d response marked as unread.',
									'%d responses marked as unread.',
									items.length,
									'jetpack-forms'
								),
								items.length
						  );

				createSuccessNotice( message, { type: 'snackbar' } );
				invalidateCache();
			} catch {
				createErrorNotice( __( 'Failed to mark as unread.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ createSuccessNotice, createErrorNotice, invalidateCache ]
	);

	const actions = useMemo( () => {
		const baseActions = [
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
		];

		if ( params.view === 'inbox' || ! params.view ) {
			return [
				...baseActions,
				{
					id: 'mark-as-read',
					label: __( 'Mark as read', 'jetpack-forms' ),
					supportsBulk: true,
					isEligible: item => item.is_unread,
					callback: handleMarkAsRead,
				},
				{
					id: 'mark-as-unread',
					label: __( 'Mark as unread', 'jetpack-forms' ),
					supportsBulk: true,
					isEligible: item => ! item.is_unread,
					callback: handleMarkAsUnread,
				},
				{
					id: 'mark-as-spam',
					label: __( 'Mark as spam', 'jetpack-forms' ),
					supportsBulk: true,
					isDestructive: true,
					callback: handleMarkAsSpam,
				},
				{
					id: 'move-to-trash',
					label: __( 'Move to trash', 'jetpack-forms' ),
					supportsBulk: true,
					isDestructive: true,
					callback: handleMoveToTrash,
				},
			];
		}

		if ( params.view === 'spam' ) {
			return [
				...baseActions,
				{
					id: 'not-spam',
					label: __( 'Not spam', 'jetpack-forms' ),
					supportsBulk: true,
					callback: handleMarkAsNotSpam,
				},
				{
					id: 'move-to-trash',
					label: __( 'Move to trash', 'jetpack-forms' ),
					supportsBulk: true,
					isDestructive: true,
					callback: handleMoveToTrash,
				},
			];
		}

		if ( params.view === 'trash' ) {
			return [
				...baseActions,
				{
					id: 'restore',
					label: __( 'Restore', 'jetpack-forms' ),
					supportsBulk: true,
					callback: handleRestore,
				},
				{
					id: 'delete-permanently',
					label: __( 'Delete permanently', 'jetpack-forms' ),
					supportsBulk: true,
					isDestructive: true,
					callback: handleDelete,
				},
			];
		}

		return baseActions;
	}, [
		navigate,
		searchParams,
		params.view,
		handleMarkAsRead,
		handleMarkAsUnread,
		handleMarkAsSpam,
		handleMarkAsNotSpam,
		handleMoveToTrash,
		handleRestore,
		handleDelete,
	] );

	const paginationInfo = useMemo(
		() => ( {
			totalItems: totalItems || 0,
			totalPages: totalPages || 1,
		} ),
		[ totalItems, totalPages ]
	);

	const statusTabs = [
		{ slug: 'inbox', label: __( 'Inbox', 'jetpack-forms' ) },
		{ slug: 'spam', label: __( 'Spam', 'jetpack-forms' ) },
		{ slug: 'trash', label: __( 'Trash', 'jetpack-forms' ) },
	];

	const handleTabChange = useCallback(
		newView => {
			navigate( {
				to: '/responses/$view',
				params: { view: newView },
			} );
		},
		[ navigate ]
	);

	const headerActions = useMemo( () => {
		const actionsArray = [];

		actionsArray.push(
			<Button key="export" variant="secondary" size="compact">
				{ __( 'Export', 'jetpack-forms' ) }
			</Button>
		);

		if ( params.view === 'trash' ) {
			actionsArray.push(
				<Button key="empty-trash" variant="primary" isDestructive size="compact">
					{ __( 'Empty Trash', 'jetpack-forms' ) }
				</Button>
			);
		}

		if ( params.view === 'spam' ) {
			actionsArray.push(
				<Button key="empty-spam" variant="primary" isDestructive size="compact">
					{ __( 'Empty Spam', 'jetpack-forms' ) }
				</Button>
			);
		}

		return actionsArray;
	}, [ params.view ] );

	return (
		<Page
			title={ __( 'Forms', 'jetpack-forms' ) }
			subTitle={ __( 'View and manage all your form submissions in one place.', 'jetpack-forms' ) }
			actions={ headerActions }
			hasPadding={ false }
		>
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
			>
				<HStack
					className="dataviews__view-actions"
					alignment="top"
					justify="space-between"
					spacing={ 1 }
				>
					<HStack justify="start" expanded={ false }>
						<Tabs.Root value={ params.view || 'inbox' } onValueChange={ handleTabChange }>
							<Tabs.List density="compact">
								{ statusTabs.map( tab => (
									<Tabs.Tab value={ tab.slug } key={ tab.slug }>
										{ tab.label }
									</Tabs.Tab>
								) ) }
							</Tabs.List>
						</Tabs.Root>
					</HStack>
					<HStack spacing={ 1 } expanded={ false } style={ { flexShrink: 0 } }>
						<DataViews.Search />
						<DataViews.FiltersToggle />
						<DataViews.ViewConfig />
					</HStack>
				</HStack>
				<DataViews.Filters className="dataviews-filters__container" />
				<DataViews.Layout />
				<DataViews.Footer />
			</DataViews>
		</Page>
	);
}

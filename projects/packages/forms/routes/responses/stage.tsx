/* eslint-disable react-hooks/rules-of-hooks */
/**
 * External dependencies
 */
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Badge } from '@automattic/ui';
import '@automattic/ui/style.css';
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
import { dateI18n } from '@wordpress/date';
import { useMemo, useState, useCallback, useEffect } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
import { download, plus } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { useParams, useSearch, useNavigate } from '@wordpress/route';
/**
 * Internal dependencies
 */
import * as Tabs from '../../src/dashboard/components/tabs';
import useCreateForm from '../../src/dashboard/hooks/use-create-form';

/**
 * Hook to fetch response counts for each status.
 *
 * @return {object} Object containing inbox, spam, and trash counts.
 */
function useCounts() {
	const [ counts, setCounts ] = useState( { inbox: 0, spam: 0, trash: 0 } );

	useEffect( () => {
		apiFetch( { path: '/wp/v2/feedback/counts' } ).then( response => {
			setCounts( {
				inbox: response?.inbox || 0,
				spam: response?.spam || 0,
				trash: response?.trash || 0,
			} );
		} );
	}, [] );

	return counts;
}

/**
 * Hook to fetch filter options for date and source fields.
 *
 * @return {object} Object containing date and source filter options.
 */
function useFilterOptions() {
	const [ filterOptions, setFilterOptions ] = useState( { date: [], source: [] } );

	useEffect( () => {
		apiFetch( { path: '/wp/v2/feedback/filters' } ).then( response => {
			setFilterOptions( {
				date: response?.date || [],
				source: response?.source || [],
			} );
		} );
	}, [] );

	return filterOptions;
}

/**
 * Returns a formatted tab label with count badge.
 *
 * @param {string} label - The label for the tab.
 * @param {number} count - The count to display.
 * @return {JSX.Element} The formatted label with count badge.
 */
function getTabLabel( label, count ) {
	return (
		<span style={ { display: 'flex', gap: '4px', alignItems: 'center' } }>
			{ label }
			<Badge intent="default" style={ { backgroundColor: '#f0f0f0' } }>
				{ count }
			</Badge>
		</span>
	);
}

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
	const counts = useCounts();
	const filterOptions = useFilterOptions();
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
			if ( filter.field === 'source' ) {
				queryArgs.parent = filter.value;
			}
			if ( filter.field === 'date' ) {
				const [ year, month ] = filter.value.split( '/' ).map( Number );
				queryArgs.after = new Date( Date.UTC( year, month - 1, 1 ) ).toISOString();
				queryArgs.before = new Date( Date.UTC( year, month, 0, 23, 59, 59 ) ).toISOString();
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
					const showEmail = item.author_email && item.author_name !== item.author_email;
					return (
						<span style={ { display: 'flex', alignItems: 'center', gap: '12px' } }>
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
							{ item.author_avatar && (
								<img
									src={ item.author_avatar }
									alt={ displayName }
									style={ {
										width: 40,
										height: 40,
										borderRadius: '50%',
										flexShrink: 0,
										backgroundColor: '#f0f0f0',
									} }
								/>
							) }
							<span style={ { display: 'flex', flexDirection: 'column', gap: '2px' } }>
								<span style={ { fontWeight: item.is_unread ? 600 : 400 } }>{ displayName }</span>
								{ showEmail && (
									<span style={ { fontSize: '12px', color: '#757575' } }>
										{ item.author_email }
									</span>
								) }
							</span>
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
					const dateStr = new Date( item.date ).toLocaleDateString( undefined, {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					} );
					return <span style={ { fontWeight: item.is_unread ? 600 : 400 } }>{ dateStr }</span>;
				},
				elements: ( filterOptions?.date || [] ).map( filter => {
					const date = new Date();
					date.setDate( 1 );
					date.setMonth( filter.month - 1 );
					date.setFullYear( filter.year );
					return {
						label: dateI18n( __( 'F Y', 'jetpack-forms' ), date ),
						value: `${ filter.year }/${ filter.month }`,
					};
				} ),
				filterBy: { operators: [ 'is' ] },
				enableSorting: false,
			},
			{
				id: 'source',
				label: __( 'Source', 'jetpack-forms' ),
				render: ( { item } ) => {
					const source = item.entry_title || __( 'Unknown', 'jetpack-forms' );
					if ( item.entry_permalink ) {
						return (
							<a
								href={ item.entry_permalink }
								target="_blank"
								rel="noopener noreferrer"
								style={ {
									fontWeight: item.is_unread ? 600 : 400,
									color: 'var(--wp-admin-theme-color, #3858e9)',
									textDecoration: 'none',
									display: 'inline-flex',
									alignItems: 'center',
									gap: '4px',
								} }
							>
								{ source }
								<span aria-hidden="true">↗</span>
							</a>
						);
					}
					return <span style={ { fontWeight: item.is_unread ? 600 : 400 } }>{ source }</span>;
				},
				elements: ( filterOptions?.source || [] ).map( source => ( {
					value: source.id.toString(),
					label: decodeEntities( source.title ) || source.url,
				} ) ),
				filterBy: { operators: [ 'is' ] },
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
				render: ( { item } ) => {
					if ( ! item.ip ) {
						return '-';
					}
					return (
						<span style={ { display: 'inline-flex', alignItems: 'center', gap: '4px' } }>
							<span aria-hidden="true">🌐</span>
							{ item.ip }
						</span>
					);
				},
				enableSorting: false,
			},
		],
		[ filterOptions ]
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
		{ slug: 'inbox', label: getTabLabel( __( 'Inbox', 'jetpack-forms' ), counts.inbox ) },
		{ slug: 'spam', label: getTabLabel( __( 'Spam', 'jetpack-forms' ), counts.spam ) },
		{ slug: 'trash', label: getTabLabel( __( 'Trash', 'jetpack-forms' ), counts.trash ) },
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

	const { openNewForm } = useCreateForm();

	const handleCreateForm = useCallback( () => {
		openNewForm( { showPatterns: false } );
	}, [ openNewForm ] );

	const handleIntegrations = useCallback( () => {
		navigate( { to: '/integrations' } );
	}, [ navigate ] );

	const headerActions = useMemo( () => {
		const actionsArray = [];

		actionsArray.push(
			<Button key="integrations" variant="secondary" size="compact" onClick={ handleIntegrations }>
				{ __( 'Manage integrations', 'jetpack-forms' ) }
			</Button>
		);

		if ( params.view === 'inbox' || ! params.view ) {
			actionsArray.push(
				<Button
					key="create"
					variant="secondary"
					size="compact"
					icon={ plus }
					onClick={ handleCreateForm }
				>
					{ __( 'Create a form', 'jetpack-forms' ) }
				</Button>
			);
		}

		actionsArray.push(
			<Button key="export" variant="primary" size="compact" icon={ download }>
				{ __( 'Export', 'jetpack-forms' ) }
			</Button>
		);

		if ( params.view === 'trash' ) {
			actionsArray.push(
				<Button key="empty-trash" variant="secondary" isDestructive size="compact">
					{ __( 'Empty Trash', 'jetpack-forms' ) }
				</Button>
			);
		}

		if ( params.view === 'spam' ) {
			actionsArray.push(
				<Button key="empty-spam" variant="secondary" isDestructive size="compact">
					{ __( 'Empty Spam', 'jetpack-forms' ) }
				</Button>
			);
		}

		return actionsArray;
	}, [ params.view, handleIntegrations, handleCreateForm ] );

	return (
		<Page
			title={
				<span style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
					<JetpackLogo showText={ false } width={ 20 } />
					{ __( 'Forms', 'jetpack-forms' ) }
				</span>
			}
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

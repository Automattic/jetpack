/**
 * External dependencies
 */
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Badge } from '@automattic/ui';
import '@automattic/ui/style.css';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useMemo, useState, useCallback, useEffect } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
import { download, plus } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { useParams, useSearch, useNavigate } from '@wordpress/route';
import * as React from 'react';
/**
 * Internal dependencies
 */
import IntegrationsModal from '../../src/blocks/contact-form/components/jetpack-integrations-modal';
import Page, { Stack } from '../../src/dashboard/components/page';
import './style.scss';
import * as Tabs from '../../src/dashboard/components/tabs';
import useCreateForm from '../../src/dashboard/hooks/use-create-form';
import { store as dashboardStore } from '../../src/dashboard/store';
import useConfigValue from '../../src/hooks/use-config-value';
import { INTEGRATIONS_STORE, IntegrationsSelectors } from '../../src/store/integrations';
/**
 * Types
 */
import type { SelectActions, DispatchActions } from '../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../src/types/index.ts';
import type { View, Field } from '@wordpress/dataviews';

type FeedbackFilterDate = {
	month: number;
	year: number;
};

type FeedbackFilterSource = {
	id: number;
	title: string;
	url: string;
};

type FeedbackFilters = {
	date: FeedbackFilterDate[];
	source: FeedbackFilterSource[];
};

/**
 * Hook to fetch filter options for date and source fields.
 *
 * @return Object containing date and source filter options.
 */
function useFilterOptions() {
	const [ filterOptions, setFilterOptions ] = useState< FeedbackFilters >( {
		date: [],
		source: [],
	} );

	useEffect( () => {
		apiFetch< FeedbackFilters >( { path: '/wp/v2/feedback/filters' } ).then( response => {
			setFilterOptions( {
				date: response.date || [],
				source: response.source || [],
			} );
		} );
	}, [] );

	return filterOptions;
}

/**
 * Returns a formatted tab label with count badge.
 *
 * @param label - The label for the tab.
 * @param count - The count to display.
 * @return The formatted label with count badge.
 */
function getTabLabel( label: string, count: number ): JSX.Element {
	return (
		<span style={ { display: 'flex', gap: '4px', alignItems: 'center' } }>
			{ label }
			<Badge intent="default" style={ { backgroundColor: '#f0f0f0' } }>
				{ count.toString() }
			</Badge>
		</span>
	);
}

const EMPTY_ARRAY = [];

const defaultLayouts = {
	table: {},
	list: {},
};

type QueryParams = {
	status: string;
	per_page?: number;
	page?: number;
	orderby?: string;
	order?: string;
	is_unread?: boolean;
	parent?: string;
	before?: string;
	after?: string;
	search?: string;
};

const DEFAULT_VIEW: View = {
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
 * @return The stage component.
 */
function Stage() {
	const params = useParams( { from: '/responses/$view' } );
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();
	const counts = useSelect(
		select => ( select( dashboardStore ) as SelectActions ).getCounts(),
		[]
	);
	const { updateCountsOptimistically, invalidateCounts } = useDispatch(
		dashboardStore
	) as DispatchActions;
	const filterOptions = useFilterOptions();
	let status = 'publish';
	if ( params.view === 'spam' ) {
		status = 'spam';
	} else if ( params.view === 'trash' ) {
		status = 'trash';
	}

	const { saveEntityRecord, deleteEntityRecord, invalidateResolution, editEntityRecord } =
		useDispatch( coreStore ) as unknown as DispatchActions;
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const [ isIntegrationsModalOpen, setIsIntegrationsModalOpen ] = useState( false );
	const integrations = useSelect(
		select => ( select( INTEGRATIONS_STORE ) as IntegrationsSelectors ).getIntegrations?.() ?? [],
		[]
	);
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE );
	const isIntegrationsEnabled = useConfigValue( 'isIntegrationsEnabled' );
	const showDashboardIntegrations = useConfigValue( 'showDashboardIntegrations' );

	const [ view, setView ] = useState< View >( () => ( {
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
		( newView: View ) => {
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
		const queryArgs: QueryParams = {
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

	const fields: Field< FormResponse >[] = useMemo(
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
			const originalStatuses = items.map( item => item.status );

			// Optimistic update
			items.forEach( item => {
				editEntityRecord( 'postType', 'feedback', item.id, { status: 'spam' } );
				updateCountsOptimistically( item.status, 'spam', 1 );
			} );
			clearSelection();

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

			try {
				await Promise.all(
					items.map( item =>
						saveEntityRecord( 'postType', 'feedback', {
							id: item.id,
							status: 'spam',
						} )
					)
				);
				invalidateCache();
				invalidateCounts();
			} catch {
				// Revert optimistic update
				items.forEach( ( item, index ) => {
					editEntityRecord( 'postType', 'feedback', item.id, {
						status: originalStatuses[ index ],
					} );
					updateCountsOptimistically( 'spam', originalStatuses[ index ], 1 );
				} );
				createErrorNotice( __( 'Failed to mark as spam.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[
			editEntityRecord,
			saveEntityRecord,
			createSuccessNotice,
			createErrorNotice,
			invalidateCache,
			clearSelection,
			updateCountsOptimistically,
			invalidateCounts,
		]
	);

	const handleMarkAsNotSpam = useCallback(
		async items => {
			const originalStatuses = items.map( item => item.status );

			// Optimistic update
			items.forEach( item => {
				editEntityRecord( 'postType', 'feedback', item.id, { status: 'publish' } );
				updateCountsOptimistically( item.status, 'publish', 1 );
			} );
			clearSelection();

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

			try {
				await Promise.all(
					items.map( item =>
						saveEntityRecord( 'postType', 'feedback', {
							id: item.id,
							status: 'publish',
						} )
					)
				);
				invalidateCache();
				invalidateCounts();
			} catch {
				// Revert optimistic update
				items.forEach( ( item, index ) => {
					editEntityRecord( 'postType', 'feedback', item.id, {
						status: originalStatuses[ index ],
					} );
					updateCountsOptimistically( 'publish', originalStatuses[ index ], 1 );
				} );
				createErrorNotice( __( 'Failed to restore from spam.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[
			editEntityRecord,
			saveEntityRecord,
			createSuccessNotice,
			createErrorNotice,
			invalidateCache,
			clearSelection,
			updateCountsOptimistically,
			invalidateCounts,
		]
	);

	const handleMoveToTrash = useCallback(
		async items => {
			const originalStatuses = items.map( item => item.status );

			// Optimistic update
			items.forEach( item => {
				editEntityRecord( 'postType', 'feedback', item.id, { status: 'trash' } );
				updateCountsOptimistically( item.status, 'trash', 1 );
			} );
			clearSelection();

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

			try {
				await Promise.all(
					items.map( item =>
						deleteEntityRecord( 'postType', 'feedback', item.id, {}, { throwOnError: true } )
					)
				);
				invalidateCache();
				invalidateCounts();
			} catch {
				// Revert optimistic update
				items.forEach( ( item, index ) => {
					editEntityRecord( 'postType', 'feedback', item.id, {
						status: originalStatuses[ index ],
					} );
					updateCountsOptimistically( 'trash', originalStatuses[ index ], 1 );
				} );
				createErrorNotice( __( 'Failed to move to trash.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[
			editEntityRecord,
			deleteEntityRecord,
			createSuccessNotice,
			createErrorNotice,
			invalidateCache,
			clearSelection,
			updateCountsOptimistically,
			invalidateCounts,
		]
	);

	const handleRestore = useCallback(
		async items => {
			const originalStatuses = items.map( item => item.status );

			// Optimistic update
			items.forEach( item => {
				editEntityRecord( 'postType', 'feedback', item.id, { status: 'publish' } );
				updateCountsOptimistically( item.status, 'publish', 1 );
			} );
			clearSelection();

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

			try {
				await Promise.all(
					items.map( item =>
						saveEntityRecord( 'postType', 'feedback', {
							id: item.id,
							status: 'publish',
						} )
					)
				);
				invalidateCache();
				invalidateCounts();
			} catch {
				// Revert optimistic update
				items.forEach( ( item, index ) => {
					editEntityRecord( 'postType', 'feedback', item.id, {
						status: originalStatuses[ index ],
					} );
					updateCountsOptimistically( 'publish', originalStatuses[ index ], 1 );
				} );
				createErrorNotice( __( 'Failed to restore.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[
			editEntityRecord,
			saveEntityRecord,
			createSuccessNotice,
			createErrorNotice,
			invalidateCache,
			clearSelection,
			updateCountsOptimistically,
			invalidateCounts,
		]
	);

	const handleDelete = useCallback(
		async items => {
			// Optimistic update - decrease trash count
			items.forEach( item => {
				updateCountsOptimistically( item.status, '', 1 );
			} );
			clearSelection();

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
				invalidateCache();
				invalidateCounts();
			} catch {
				// Revert optimistic update
				items.forEach( item => {
					updateCountsOptimistically( '', item.status, 1 );
				} );
				createErrorNotice( __( 'Failed to delete.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
				invalidateCache();
			}
		},
		[
			deleteEntityRecord,
			createSuccessNotice,
			createErrorNotice,
			invalidateCache,
			clearSelection,
			updateCountsOptimistically,
			invalidateCounts,
		]
	);

	const handleMarkAsRead = useCallback(
		async items => {
			// Optimistic update
			items.forEach( item => {
				editEntityRecord( 'postType', 'feedback', item.id, { is_unread: false } );
			} );

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
				invalidateCache();
			} catch {
				// Revert optimistic update
				items.forEach( item => {
					editEntityRecord( 'postType', 'feedback', item.id, { is_unread: true } );
				} );
				createErrorNotice( __( 'Failed to mark as read.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ editEntityRecord, createSuccessNotice, createErrorNotice, invalidateCache ]
	);

	const handleMarkAsUnread = useCallback(
		async items => {
			// Optimistic update
			items.forEach( item => {
				editEntityRecord( 'postType', 'feedback', item.id, { is_unread: true } );
			} );

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
				invalidateCache();
			} catch {
				// Revert optimistic update
				items.forEach( item => {
					editEntityRecord( 'postType', 'feedback', item.id, { is_unread: false } );
				} );
				createErrorNotice( __( 'Failed to mark as unread.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ editEntityRecord, createSuccessNotice, createErrorNotice, invalidateCache ]
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
		setIsIntegrationsModalOpen( true );
	}, [] );

	const closeIntegrationsModal = useCallback( () => {
		setIsIntegrationsModalOpen( false );
	}, [] );

	const headerActions = useMemo( () => {
		const actionsArray: React.ReactNode[] = [];

		// Show integrations button on inbox when feature flags are enabled
		if (
			( params.view === 'inbox' || ! params.view ) &&
			isIntegrationsEnabled &&
			showDashboardIntegrations
		) {
			actionsArray.push(
				<Button
					key="integrations"
					variant="secondary"
					size="compact"
					onClick={ handleIntegrations }
				>
					{ __( 'Manage integrations', 'jetpack-forms' ) }
				</Button>
			);
		}

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
	}, [
		params.view,
		handleIntegrations,
		handleCreateForm,
		isIntegrationsEnabled,
		showDashboardIntegrations,
	] );

	return (
		<Page
			showSidebarToggle={ false }
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
				fields={ fields as Field< unknown >[] }
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
				<Stack
					className="jp-forms-dataviews__view-actions"
					direction="row"
					justify="space-between"
					align="center"
				>
					<Stack direction="row" align="center" gap={ 2 }>
						<Tabs.Root value={ params.view || 'inbox' } onValueChange={ handleTabChange }>
							<Tabs.List density="compact">
								{ statusTabs.map( tab => (
									<Tabs.Tab value={ tab.slug } key={ tab.slug }>
										{ tab.label }
									</Tabs.Tab>
								) ) }
							</Tabs.List>
						</Tabs.Root>
					</Stack>
					<Stack direction="row" align="center" gap={ 2 }>
						<DataViews.Search />
						<DataViews.FiltersToggle />
						<DataViews.ViewConfig />
					</Stack>
				</Stack>
				<DataViews.Filters className="dataviews-filters__container" />
				<DataViews.Layout />
				<DataViews.Footer />
			</DataViews>
			<IntegrationsModal
				isOpen={ isIntegrationsModalOpen }
				onClose={ closeIntegrationsModal }
				attributes={ undefined }
				setAttributes={ undefined }
				integrationsData={ integrations }
				refreshIntegrations={ refreshIntegrations }
				context="dashboard"
			/>
		</Page>
	);
}

export { Stage as stage };

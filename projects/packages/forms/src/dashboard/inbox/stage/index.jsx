/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { JetpackLogo } from '@automattic/jetpack-components';
import Gravatar from '@automattic/jetpack-components/gravatar';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { Modal } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Badge, Link } from '@wordpress/ui';
import clsx from 'clsx';
import { useEffect } from 'react';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import { INTEGRATIONS_STORE } from '../../../store/integrations/index.ts';
import BackToFormsButton from '../../components/back-to-forms-button/index.tsx';
import CreateFormButton from '../../components/create-form-button/index.tsx';
import DataViewsHeaderRow from '../../components/dataviews-header-row/index.tsx';
import EditFormButton from '../../components/edit-form-button/index.tsx';
import EmptyResponses from '../../components/empty-responses/index.tsx';
import EmptySpamButton from '../../components/empty-spam-button/index.tsx';
import EmptyTrashButton from '../../components/empty-trash-button/index.tsx';
import ExportResponsesButton from '../../components/export-responses/button.tsx';
import { ResponseMobileView, SingleResponseView } from '../../components/inspector/index.tsx';
import IntegrationsButton from '../../components/integrations-button/index.tsx';
import Page from '../../components/page/index.tsx';
import TextWithFlag from '../../components/text-with-flag/index.tsx';
import useInboxData from '../../hooks/use-inbox-data.ts';
import { useDashboardSearchParams } from '../../router/dashboard-search-params-context.tsx';
import { getPath, getItemId } from '../utils.js';
import {
	viewAction,
	markAsSpamAction,
	markAsNotSpamAction,
	moveToTrashAction,
	deleteAction,
	restoreAction,
	markAsReadAction,
	markAsUnreadAction,
	editFormAction,
} from './actions.tsx';
import { useView, defaultLayouts } from './views.js';

const EMPTY_ARRAY = [];

// Sentinel value used in the Source filter to represent form-preview (test) responses.
// Source IDs are numeric post IDs, so this non-numeric value is safe from collision.
const FORM_PREVIEW_SOURCE_VALUE = 'form_preview';

const updateSidebarWidth = () => {
	const wrapper = document.querySelector( '.dataviews-wrapper' );

	if ( wrapper ) {
		const left = wrapper.getBoundingClientRect().left;
		wrapper.style.setProperty( '--forms-admin-sidebar-width', `${ left }px` );
	}
};

const setupSidebarWidthObserver = () => {
	const wrapper = document.querySelector( '.dataviews-wrapper' );

	if ( ! wrapper ) {
		return () => {};
	}

	updateSidebarWidth();

	const resizeObserver = new ResizeObserver( () => {
		requestAnimationFrame( updateSidebarWidth );
	} );

	resizeObserver.observe( wrapper );

	return () => {
		resizeObserver.disconnect();
	};
};

/**
 * The DataViews implementation.
 *
 * @param {object}                    [props]              - Props.
 * @param {number}                    [props.parentId]     - Optional parent (form/source) ID to scope responses to.
 * @param {import('react').ReactNode} [props.pageTitle]    - Optional page title content. Defaults to "Forms".
 * @param {string}                    [props.pageSubtitle] - Optional page subtitle string.
 * @return {import('react').JSX.Element} The DataViews component.
 */
export default function InboxView( { parentId, pageTitle, pageSubtitle } = {} ) {
	const [ view, setView ] = useView();
	const [ searchParams, setSearchParams ] = useDashboardSearchParams();
	const parent = useMemo( () => {
		const id = Number( parentId );
		return Number.isFinite( id ) && id > 0 ? id : null;
	}, [ parentId ] );
	const isSingleFormView = !! parent;

	const dateSettings = getDateSettings();

	const selectedResponses = searchParams.get( 'r' );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ isResponseModalOpen, setIsResponseModalOpen ] = useState( false );
	const [ responseModal, setResponseModal ] = useState( null );

	const closeResponseModal = useCallback( () => {
		setIsResponseModalOpen( false );
		setResponseModal( null );
	}, [ setIsResponseModalOpen, setResponseModal ] );

	const openResponseModal = useCallback(
		item => {
			const content = <ResponseMobileView response={ item } closeModal={ closeResponseModal } />;

			setResponseModal( content );
			setIsResponseModalOpen( true );
		},
		[ setIsResponseModalOpen, closeResponseModal, setResponseModal ]
	);

	useEffect( () => {
		if ( ! isMobileViewport ) {
			closeResponseModal();
		}
	}, [ isMobileViewport, closeResponseModal ] );

	useEffect( () => {
		return setupSidebarWidthObserver();
	}, [] );

	const isIntegrationsEnabled = useConfigValue( 'isIntegrationsEnabled' );
	const showDashboardIntegrations = useConfigValue( 'showDashboardIntegrations' );
	const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );
	const isInboxStatusToggleView = isSingleFormView || isCentralFormManagementEnabled !== true;
	const urlFolder = useMemo( () => {
		const urlStatus = searchParams.get( 'status' );
		return [ 'inbox', 'spam', 'trash' ].includes( urlStatus ) ? urlStatus : 'inbox';
	}, [ searchParams ] );

	const {
		setCurrentQuery,
		setSelectedResponses,
		statusFilter,
		filterOptions,
		records,
		isLoadingData,
		totalItems,
		totalPages,
	} = useInboxData();
	const isAkismetStatusPending = useSelect(
		select => {
			const store = select( INTEGRATIONS_STORE );
			const integrations = store.getIntegrations() || [];
			const isIntegrationsLoading = store.isIntegrationsLoading();
			const akismetIntegration = integrations.find( integration => integration.id === 'akismet' );

			return (
				statusFilter === 'spam' &&
				! isSimpleSite() &&
				( isIntegrationsLoading || ! akismetIntegration || akismetIntegration.__isPartial )
			);
		},
		[ statusFilter ]
	);

	const isInboxLoading = isLoadingData || isAkismetStatusPending;

	useEffect( () => {
		const _filters = view.filters?.reduce( ( accumulator, { field, value } ) => {
			if ( ! value ) {
				return accumulator;
			}
			if ( field === 'source' ) {
				if ( value === FORM_PREVIEW_SOURCE_VALUE ) {
					accumulator.is_test = true;
				} else {
					accumulator.source = value;
				}
			}
			if ( field === 'date' ) {
				const [ year, month ] = value.split( '/' ).map( Number );
				accumulator.after = new Date( Date.UTC( year, month - 1, 1 ) ).toISOString();
				accumulator.before = new Date( Date.UTC( year, month, 0, 23, 59, 59 ) ).toISOString();
			}
			if ( field === 'read_status' ) {
				accumulator.is_unread = value === 'unread';
			}
			return accumulator;
		}, {} );

		// Single-form view: scope the query directly (no DataViews Source filter pill).
		if ( isSingleFormView && parent ) {
			_filters.parent = parent;
		}

		const _queryArgs = {
			order: 'desc',
			orderby: 'date',
			per_page: view.perPage,
			page: view.page,
			...( view.search ? { search: view.search } : {} ),
			..._filters,
			status: statusFilter,
		};
		// We need to keep the current query args in the store to be used in `export`
		// and for getting the total records per `status`.
		setCurrentQuery( _queryArgs );
	}, [ view, statusFilter, setCurrentQuery, isSingleFormView, parent ] );

	const selection = selectedResponses?.split( ',' ) || EMPTY_ARRAY;

	// We need to keep the valid selection item in state to be used in `export`.
	// We do this because a user can have in their selection either ids that
	// do not exist at all or ids that are not in the current data set.
	useEffect( () => {
		const validSelectedIds = ( selection || [] ).filter( id =>
			records?.some( record => getItemId( record ) === id )
		);

		setSelectedResponses( validSelectedIds );
	}, [ records, selection, setSelectedResponses ] );

	const onChangeSelection = useCallback(
		items => {
			// Update URL params with selected items
			// The useEffect above will handle updating the sidebar
			setSearchParams( previousSearchParams => {
				const _searchParams = new URLSearchParams( previousSearchParams );
				if ( items.length ) {
					_searchParams.set( 'r', items.join( ',' ) );
				} else {
					_searchParams.delete( 'r' );
				}
				return _searchParams;
			} );
		},
		[ setSearchParams ]
	);

	const [ sidePanelItem, setSidePanelItem ] = useState();

	// Manage sidebar visibility based on selection
	// Only show sidebar when exactly one item is selected on desktop
	useEffect( () => {
		if ( isMobileViewport ) {
			// Don't manage sidebar on mobile
			return;
		}

		if ( ! records || selection.length !== 1 ) {
			// Clear sidebar if no records, no selection, or multiple selections
			setSidePanelItem( null );
			return;
		}

		// Single item selected - find it in records
		const selectedId = selection[ 0 ];
		const recordToShow = records.find( record => getItemId( record ) === selectedId );

		if ( ! recordToShow ) {
			// Selected item not in current records - clear sidebar
			setSidePanelItem( null );
			return;
		}

		// Update sidebar if item changed or needs refresh.
		// Items can be updated from row actions (e.g. mark as read/unread) without changing the selected ID.
		const isSameItem = sidePanelItem && getItemId( sidePanelItem ) === getItemId( recordToShow );
		const needsRefresh = ! isSameItem || sidePanelItem.is_unread !== recordToShow.is_unread;

		if ( needsRefresh ) {
			setSidePanelItem( recordToShow );
		}
	}, [ isMobileViewport, records, selection, sidePanelItem ] );

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	const onChangeView = useCallback(
		newView => {
			if ( ! isInboxStatusToggleView ) {
				const folderValue = newView.filters?.find( filter => filter.field === 'folder' )?.value;
				const nextFolder = [ 'inbox', 'spam', 'trash' ].includes( folderValue )
					? folderValue
					: 'inbox';

				// Enforce that Folder is always set (cannot be removed). If the user clears it via the pill "X",
				// re-add it as Inbox to match legacy default behavior.
				if ( ! folderValue ) {
					newView = {
						...newView,
						page: 1,
						filters: [
							{ field: 'folder', operator: 'is', value: 'inbox' },
							...( newView.filters || [] ).filter( filter => filter.field !== 'folder' ),
						],
					};
				}

				// Sync Folder -> URL status (source of truth for querying), clear selection, and reset page.
				if ( nextFolder !== urlFolder ) {
					setSearchParams( previousSearchParams => {
						const params = new URLSearchParams( previousSearchParams );
						params.set( 'status', nextFolder );
						params.delete( 'r' ); // Clear selected responses when changing folder.
						return params;
					} );
					setSelectedResponses( [] );
					newView = { ...newView, page: 1 };
				}
			}
			setView( newView );
		},
		[ isInboxStatusToggleView, setSearchParams, setSelectedResponses, setView, urlFolder ]
	);

	const wrapperUnread = ( isUnread, itemValue ) => {
		if ( isUnread ) {
			return <span className="jp-forms__inbox__unread">{ itemValue }</span>;
		}
		return itemValue;
	};

	const fields = useMemo(
		() => [
			...( ! isInboxStatusToggleView
				? [
						{
							id: 'folder',
							label: __( 'Folder', 'jetpack-forms' ),
							elements: [
								{ label: __( 'Inbox', 'jetpack-forms' ), value: 'inbox' },
								{ label: __( 'Spam', 'jetpack-forms' ), value: 'spam' },
								{ label: __( 'Trash', 'jetpack-forms' ), value: 'trash' },
							],
							// Primary so the filter UI (and its pill) is visible by default.
							filterBy: { operators: [ 'is' ], isPrimary: true },
							enableSorting: false,
							// Prevent this filter-only field from being offered as a configurable column.
							enableHiding: false,
							// Filter-only field; not shown as a column.
							render: () => null,
							getValue: () => null,
						},
				  ]
				: [] ),
			...( ! isSingleFormView
				? [
						{
							id: 'source',
							label: __( 'Source', 'jetpack-forms' ),
							render: ( { item } ) => {
								if ( item.is_test ) {
									const previewLabel = __( 'Form preview', 'jetpack-forms' );
									if ( item.preview_url ) {
										return (
											<Link openInNewTab href={ item.preview_url }>
												{ wrapperUnread( item.is_unread, previewLabel ) }
											</Link>
										);
									}
									return wrapperUnread( item.is_unread, previewLabel );
								}
								if ( ! item.entry_permalink ) {
									return wrapperUnread( item.is_unread, decodeEntities( item.entry_title ) );
								}
								return (
									<Link openInNewTab href={ item.entry_permalink }>
										{ wrapperUnread(
											item.is_unread,
											decodeEntities( item.entry_title ) || getPath( item )
										) }
									</Link>
								);
							},
							elements: [
								{
									value: FORM_PREVIEW_SOURCE_VALUE,
									label: __( 'Form preview', 'jetpack-forms' ),
								},
								...( filterOptions?.source || [] ).map( source => ( {
									value: source.id,
									label:
										decodeEntities( source.title ) || getPath( { entry_permalink: source.url } ),
								} ) ),
							],
							filterBy: { operators: [ 'is' ] },
							enableSorting: false,
						},
				  ]
				: [] ),
			{
				id: 'from',
				label: __( 'From', 'jetpack-forms' ),
				render: ( { item } ) => {
					const authorInfo = decodeEntities(
						item.author_name || item.author_email || item.author_url || item.ip
					);
					const gravatarName = item.author_name
						? decodeEntities( item.author_name )
						: item.author_email?.split( '@' )[ 0 ];
					const defaultImage = gravatarName ? 'initials' : 'mp';
					const secondaryInfo =
						item.author_email && authorInfo !== decodeEntities( item.author_email ) ? (
							<span className="jp-forms__inbox__author-field__email">
								{ decodeEntities( item.author_email ) }
							</span>
						) : null;

					const handleClick = isMobileViewport ? () => openResponseModal( item ) : undefined;

					return (
						<div
							className={ clsx(
								'jp-forms__inbox__author-field',
								isMobileViewport && 'jp-forms__inbox__author-field--mobile'
							) }
							{ ...( isMobileViewport && {
								onClick: handleClick,
								onKeyDown: () => {},
								role: 'button',
								tabIndex: 0,
							} ) }
						>
							{ item.is_unread && (
								<span
									className="jp-forms__inbox__unread-indicator"
									aria-label={ __( '(Unread form response)', 'jetpack-forms' ) }
								>
									●
								</span>
							) }
							<Gravatar
								email={ item.author_email || item.ip } // With IP we still return placeholder image
								defaultImage={ defaultImage }
								displayName={ gravatarName }
								key={ item.id }
								size={ 32 }
								useHovercard={ false }
							/>
							<div className="jp-forms__inbox__author-info-container">
								<span className="jp-forms__inbox__author-info">
									{ wrapperUnread( item.is_unread, authorInfo ) }
								</span>
								{ secondaryInfo }
							</div>
						</div>
					);
				},
				getValue: ( { item } ) => {
					return decodeEntities(
						item.author_name || item.author_email || item.author_url || item.ip
					);
				},
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'date',
				label: __( 'Date', 'jetpack-forms' ),
				render: ( { item } ) => {
					return wrapperUnread(
						item.is_unread,
						dateI18n( dateSettings.formats.datetime, item.date )
					);
				},
				elements: ( filterOptions?.date || [] ).map( _filter => {
					const date = new Date();
					date.setDate( 1 );
					date.setMonth( _filter.month - 1 ); // Months are zero-based in JS Date objects.
					date.setFullYear( _filter.year );
					return {
						label: dateI18n(
							// translators: Date format for date filters' labels. See https://www.php.net/manual/en/datetime.format.php
							__( 'F Y', 'jetpack-forms' ),
							date
						),
						value: `${ _filter.year }/${ _filter.month }`,
					};
				} ),
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
				render: ( { item } ) => {
					return (
						<Badge intent="draft">
							{ item.is_unread ? __( 'Unread', 'jetpack-forms' ) : __( 'Read', 'jetpack-forms' ) }
						</Badge>
					);
				},
			},
			{
				id: 'ip',
				label: __( 'IP Address', 'jetpack-forms' ),
				enableSorting: false,
				render: ( { item } ) => {
					return (
						<TextWithFlag countryCode={ item.country_code } fallbackIcon>
							{ item.ip || '' }
						</TextWithFlag>
					);
				},
			},
		],
		[
			filterOptions?.date,
			filterOptions?.source,
			isMobileViewport,
			openResponseModal,
			dateSettings.formats.datetime,
			isInboxStatusToggleView,
			isSingleFormView,
		]
	);

	// When CFM is enabled, keep the DataViews "Folder" filter in sync with the URL `status` param
	// (and default to Inbox on first load).
	useEffect( () => {
		if ( isInboxStatusToggleView ) {
			return;
		}
		setView( previousView => {
			const previousFilters = previousView.filters || [];
			const existing = previousFilters.find( filter => filter.field === 'folder' );
			if ( existing?.value === urlFolder ) {
				return previousView;
			}
			const nextFilters = [
				{ field: 'folder', operator: 'is', value: urlFolder },
				...previousFilters.filter( filter => filter.field !== 'folder' ),
			];
			return {
				...previousView,
				filters: nextFilters,
			};
		} );
	}, [ isInboxStatusToggleView, setView, urlFolder ] );

	const actions = useMemo( () => {
		const mobileViewAction = {
			...viewAction,
			RenderModal: ( { items, closeModal } ) => {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
					action: 'view-response',
					multiple: items.length > 1,
				} );

				const [ item ] = items;

				return <ResponseMobileView response={ item } closeModal={ closeModal } />;
			},
			hideModalHeader: true,
		};

		const desktopViewAction = {
			...viewAction,
			callback( items ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
					action: 'view-response',
					multiple: items.length > 1,
				} );

				const [ item ] = items;
				const selectedId = item.id.toString();

				// Select only this item to show it in the sidebar
				onChangeSelection( [ selectedId ] );
			},
		};

		const viewResponseAction = isMobileViewport ? mobileViewAction : desktopViewAction;

		const primaryActions = [ viewResponseAction ];
		const secondaryActions = [ markAsUnreadAction, editFormAction ];

		switch ( statusFilter ) {
			case 'trash':
				return [ ...primaryActions, restoreAction, deleteAction, ...secondaryActions ];
			case 'spam':
				return [ ...primaryActions, markAsNotSpamAction, moveToTrashAction, ...secondaryActions ];
			default:
				return [
					...primaryActions,
					markAsReadAction,
					markAsSpamAction,
					moveToTrashAction,
					...secondaryActions,
				];
		}
	}, [ isMobileViewport, onChangeSelection, statusFilter ] );

	const onClickItem = useCallback(
		item => {
			onChangeSelection( [ item.id.toString() ] );
		},
		[ onChangeSelection ]
	);

	const resetPage = useCallback( () => {
		// Reset to page 1 when switching legacy Inbox statuses (Inbox/Spam/Trash).
		setView( previousView => ( { ...previousView, page: 1 } ) );
	}, [ setView ] );

	// Check if read_status filter is applied
	const readStatusFilter = view.filters?.find( filter => filter.field === 'read_status' )?.value;

	// Conditional header actions based on status filter
	const headerActions = useMemo( () => {
		const exportIsPrimary =
			! isSingleFormView && statusFilter !== 'trash' && statusFilter !== 'spam';
		const headerActionsArray = [
			<ExportResponsesButton key="export" isPrimary={ exportIsPrimary } />,
		];

		// On the single form screen, always show navigation actions regardless of folder (Inbox/Spam/Trash).
		if ( isSingleFormView ) {
			headerActionsArray.unshift( <BackToFormsButton key="back-to-forms" /> );
			headerActionsArray.splice( 1, 0, <EditFormButton key="edit-form" formId={ parent } /> );
		}

		if ( statusFilter === 'trash' ) {
			headerActionsArray.push( <EmptyTrashButton key="empty-trash" /> );
		} else if ( statusFilter === 'spam' ) {
			headerActionsArray.push( <EmptySpamButton key="empty-spam" /> );
		} else if ( ! isSingleFormView ) {
			// When not on the single form screen, show create / integrations.
			headerActionsArray.unshift( <CreateFormButton key="create" /> );
			// Only show Create Form and Integrations buttons on inbox (when not in trash or spam)
			if ( isIntegrationsEnabled && showDashboardIntegrations ) {
				headerActionsArray.unshift( <IntegrationsButton key="integrations" /> );
			}
		}

		return headerActionsArray;
	}, [ parent, isSingleFormView, statusFilter, isIntegrationsEnabled, showDashboardIntegrations ] );

	const pageContent = (
		<Page
			title={
				<div className="jp-forms-page-header-title">
					<JetpackLogo showText={ false } width={ 20 } />
					{ pageTitle ? pageTitle : __( 'Forms', 'jetpack-forms' ) }
				</div>
			}
			subTitle={
				pageSubtitle ??
				__( 'View and manage all your form responses in one place.', 'jetpack-forms' )
			}
			actions={ headerActions }
			hasPadding={ false }
		>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ records || EMPTY_ARRAY }
				isLoading={ isInboxLoading }
				view={ view }
				onChangeView={ onChangeView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				onClickItem={ onClickItem }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
				empty={
					<EmptyResponses
						status={ statusFilter }
						isSearch={ !! view.search }
						isSingleFormView={ isSingleFormView }
						readStatusFilter={ readStatusFilter }
					/>
				}
			>
				<DataViewsHeaderRow
					onLegacyStatusChange={ resetPage }
					isInboxStatusToggleView={ isInboxStatusToggleView }
				/>
				<div className="jp-forms-dataviews-layout-container">
					<DataViews.Layout />
					<DataViews.Footer />
				</div>
			</DataViews>
		</Page>
	);

	return (
		<>
			<div className="jp-forms-layout__surface is-stage">{ pageContent }</div>
			{ isResponseModalOpen && (
				<Modal
					title={ __( 'Response', 'jetpack-forms' ) }
					__experimentalHideHeader={ true }
					onRequestClose={ closeResponseModal }
				>
					{ responseModal }
				</Modal>
			) }
			{ selection.length === 1 && sidePanelItem && ! isMobileViewport && (
				<div className="jp-forms-layout__surface is-inspector">
					<SingleResponseView
						sidePanelItem={ sidePanelItem }
						setSidePanelItem={ setSidePanelItem }
						isLoadingData={ isLoadingData }
						isMobile={ isMobileViewport }
						onChangeSelection={ onChangeSelection }
						selection={ selection }
					/>
				</div>
			) }
		</>
	);
}

/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { JetpackLogo } from '@automattic/jetpack-components';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { Badge } from '@automattic/ui';
import { ExternalLink, Modal } from '@wordpress/components';
import { useResizeObserver, useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Icon, globe } from '@wordpress/icons';
import clsx from 'clsx';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import { INTEGRATIONS_STORE } from '../../../store/integrations/index.ts';
import CreateFormButton from '../../components/create-form-button/index.tsx';
import EmptyResponses from '../../components/empty-responses/index.tsx';
import EmptySpamButton from '../../components/empty-spam-button/index.tsx';
import EmptyTrashButton from '../../components/empty-trash-button/index.tsx';
import ExportResponsesButton from '../../components/export-responses/button.tsx';
import Flag from '../../components/flag/index.tsx';
import FormsResponsesTabs from '../../components/forms-responses-tabs/index.tsx';
import Gravatar from '../../components/gravatar/index.tsx';
import InboxStatusToggle from '../../components/inbox-status-toggle/index.tsx';
import { ResponseMobileView, SingleResponseView } from '../../components/inspector/index.tsx';
import IntegrationsButton from '../../components/integrations-button/index.tsx';
import Page from '../../components/page/index.tsx';
import useInboxData from '../../hooks/use-inbox-data.ts';
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
 * @return {import('react').JSX.Element} The DataViews component.
 */
export default function InboxView() {
	const [ view, setView ] = useView();
	const [ searchParams, setSearchParams ] = useSearchParams();
	const [ containerWidth, setContainerWidth ] = useState( 0 );

	const dateSettings = getDateSettings();
	const containerRef = useResizeObserver(
		resizeObserverEntries => {
			setContainerWidth( resizeObserverEntries[ 0 ].borderBoxSize[ 0 ].inlineSize );
		},
		{ box: 'border-box' }
	);

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

	const urlStatus = searchParams.get( 'status' ) || 'inbox';
	const normalizedUrlFolder = [ 'inbox', 'spam', 'trash' ].includes( urlStatus )
		? urlStatus
		: 'inbox';
	const currentFolderValue = view.filters?.find( filter => filter.field === 'folder' )?.value;

	// When central form management is enabled, ensure the Folder filter has a value
	// so it renders as "Folder: Inbox/Spam/Trash" in the DataViews filters UI.
	// We only seed it when missing to avoid fighting user edits.
	useEffect( () => {
		if ( ! isCentralFormManagementEnabled ) {
			return;
		}

		if ( currentFolderValue !== undefined ) {
			return;
		}

		setView( {
			...view,
			page: 1,
			filters: [
				...( view.filters || [] ).filter( f => f.field !== 'folder' ),
				{
					field: 'folder',
					operator: 'is',
					value: normalizedUrlFolder,
				},
			],
		} );
	}, [ isCentralFormManagementEnabled, currentFolderValue, normalizedUrlFolder, setView, view ] );

	const onChangeView = useCallback(
		newView => {
			if ( isCentralFormManagementEnabled ) {
				const getFolder = filters => {
					const raw = filters?.find( f => f.field === 'folder' )?.value;
					const value = Array.isArray( raw ) ? raw[ 0 ] : raw;
					return [ 'inbox', 'spam', 'trash' ].includes( value ) ? value : 'inbox';
				};

				const prevFolder = getFolder( view.filters );
				const nextFolder = getFolder( newView.filters );

				if ( prevFolder !== nextFolder ) {
					setSearchParams( previousSearchParams => {
						const params = new URLSearchParams( previousSearchParams );
						params.set( 'status', nextFolder );
						params.delete( 'r' ); // Clear selection when changing folder.
						return params;
					} );
					setSelectedResponses( [] );
				}
			}

			setView( newView );
		},
		[ isCentralFormManagementEnabled, setSearchParams, setSelectedResponses, setView, view.filters ]
	);
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
				accumulator.parent = value;
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
	}, [ view, statusFilter, setCurrentQuery ] );

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

		// Update sidebar if item changed or needs refresh
		if ( ! sidePanelItem || getItemId( sidePanelItem ) !== getItemId( recordToShow ) ) {
			setSidePanelItem( recordToShow );
		}
	}, [ isMobileViewport, records, selection, sidePanelItem ] );

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	const wrapperUnread = ( isUnread, itemValue ) => {
		if ( isUnread ) {
			return <span className="jp-forms__inbox__unread">{ itemValue }</span>;
		}
		return itemValue;
	};

	const fields = useMemo(
		() => [
			...( isCentralFormManagementEnabled
				? [
						{
							id: 'folder',
							label: __( 'Folder', 'jetpack-forms' ),
							elements: [
								{ label: __( 'Inbox', 'jetpack-forms' ), value: 'inbox' },
								{ label: __( 'Spam', 'jetpack-forms' ), value: 'spam' },
								{ label: __( 'Trash', 'jetpack-forms' ), value: 'trash' },
							],
							filterBy: { operators: [ 'is' ], isPrimary: true },
							enableSorting: false,
							enableHiding: false,
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
					const defaultImage = item.author_name || item.author_email ? 'initials' : 'mp';
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
								displayName={ authorInfo }
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
					return wrapperUnread( item.is_unread, dateI18n( dateSettings.formats.date, item.date ) );
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
				id: 'source',
				label: __( 'Source', 'jetpack-forms' ),
				render: ( { item } ) => {
					if ( ! item.entry_permalink ) {
						return wrapperUnread( item.is_unread, decodeEntities( item.entry_title ) );
					}
					return (
						<ExternalLink href={ item.entry_permalink }>
							{ wrapperUnread(
								item.is_unread,
								decodeEntities( item.entry_title ) || getPath( item )
							) }
						</ExternalLink>
					);
				},
				elements: ( filterOptions?.source || [] ).map( source => ( {
					value: source.id,
					label: decodeEntities( source.title ) || getPath( { entry_permalink: source.url } ),
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
				render: ( { item } ) => {
					return (
						<Badge intent="default">
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
						<>
							<span className="jp-forms__inbox-response-country-flag">
								{ ! item.country_code && <Icon icon={ globe } size={ 20 } /> }
								{ item.country_code && <Flag countryCode={ item.country_code } /> }
							</span>
							{ item.ip || '' }
						</>
					);
				},
			},
		],
		[
			filterOptions?.date,
			filterOptions?.source,
			isCentralFormManagementEnabled,
			isMobileViewport,
			openResponseModal,
			dateSettings.formats.date,
		]
	);

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

	const resetPage = useCallback( () => {
		view.page = 1;
	}, [ view ] );

	// Check if read_status filter is applied
	const readStatusFilter = view.filters?.find( filter => filter.field === 'read_status' )?.value;

	// Conditional header actions based on status filter
	const headerActions = useMemo( () => {
		const exportIsPrimary = statusFilter !== 'trash' && statusFilter !== 'spam';
		const headerActionsArray = [
			<ExportResponsesButton key="export" isPrimary={ exportIsPrimary } />,
		];

		if ( statusFilter === 'trash' ) {
			headerActionsArray.push( <EmptyTrashButton key="empty-trash" /> );
		} else if ( statusFilter === 'spam' ) {
			headerActionsArray.push( <EmptySpamButton key="empty-spam" /> );
		} else {
			headerActionsArray.unshift( <CreateFormButton key="create" /> );
			// Only show Create Form and Integrations buttons on inbox (when not in trash or spam)
			if ( isIntegrationsEnabled && showDashboardIntegrations ) {
				headerActionsArray.unshift( <IntegrationsButton key="integrations" /> );
			}
		}

		return headerActionsArray;
	}, [ statusFilter, isIntegrationsEnabled, showDashboardIntegrations ] );

	const pageContent = (
		<Page
			title={
				<div className="jp-forms-page-header-title">
					<JetpackLogo showText={ false } width={ 20 } />
					{ __( 'Forms', 'jetpack-forms' ) }
				</div>
			}
			subTitle={ __( 'View and manage all your form submissions in one place.', 'jetpack-forms' ) }
			actions={ headerActions }
			tabs={ isCentralFormManagementEnabled ? <FormsResponsesTabs /> : undefined }
			hasPadding={ false }
		>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ records || EMPTY_ARRAY }
				isLoading={ isInboxLoading }
				view={ view }
				onChangeView={ isCentralFormManagementEnabled ? onChangeView : setView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
				empty={
					<EmptyResponses
						status={ statusFilter }
						isSearch={ !! view.search }
						readStatusFilter={ readStatusFilter }
					/>
				}
			>
				{ isCentralFormManagementEnabled ? (
					<div className="jp-forms-filters-bar">
						<div className="jp-forms-filters-bar__chips">
							<DataViews.FiltersToggled className="jp-forms-filters-container" />
						</div>
						<div
							className="jp-forms-filters-bar__controls"
							style={ {
								display: 'flex',
								gap: '8px',
								justifyContent: containerWidth < 600 ? 'unset' : 'flex-end',
							} }
						>
							<DataViews.Search />
							<DataViews.FiltersToggle />
							<DataViews.ViewConfig />
						</div>
					</div>
				) : (
					<>
						<div className="jp-forms-view-actions">
							<div>
								<InboxStatusToggle onChange={ resetPage } />
							</div>
							<div
								style={ {
									display: 'flex',
									gap: '8px',
									justifyContent: containerWidth < 600 ? 'unset' : 'flex-end',
								} }
							>
								<DataViews.Search />
								<DataViews.FiltersToggle />
								<DataViews.ViewConfig />
							</div>
						</div>
						<DataViews.FiltersToggled className="jp-forms-filters-container" />
					</>
				) }
				<div className="jp-forms-dataviews-layout-container">
					<DataViews.Layout />
					<DataViews.Footer />
				</div>
			</DataViews>
		</Page>
	);

	return (
		<>
			<div ref={ containerRef } className="jp-forms-layout__surface is-stage">
				{ pageContent }
			</div>
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

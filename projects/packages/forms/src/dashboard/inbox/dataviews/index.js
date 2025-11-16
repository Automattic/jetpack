/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Badge } from '@automattic/ui';
import {
	ExternalLink,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	Modal,
} from '@wordpress/components';
import { useResizeObserver, useViewportMatch } from '@wordpress/compose';
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
import Flag from '../../components/flag';
import Gravatar from '../../components/gravatar';
import InboxStatusToggle from '../../components/inbox-status-toggle';
import { ResponseMobileView, SingleResponseView } from '../../components/response-view';
import useInboxData from '../../hooks/use-inbox-data';
import EmptyResponses from '../empty-responses';
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
} from './actions';
import { useView, defaultLayouts } from './views';

const EMPTY_ARRAY = [];
const MOBILE_BREAKPOINT = 780;

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
	const isMobile = containerWidth <= MOBILE_BREAKPOINT;
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
		if ( isMobile ) {
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
		if (
			! sidePanelItem ||
			getItemId( sidePanelItem ) !== getItemId( recordToShow ) ||
			sidePanelItem !== recordToShow
		) {
			setSidePanelItem( recordToShow );
		}
	}, [ isMobile, records, selection, sidePanelItem ] );

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
							<span className="response-country-flag">
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

		const viewResponseAction = isMobile ? mobileViewAction : desktopViewAction;

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
	}, [ isMobile, onChangeSelection, statusFilter ] );

	const resetPage = useCallback( () => {
		view.page = 1;
	}, [ view ] );

	// Check if read_status filter is applied
	const readStatusFilter = view.filters?.find( filter => filter.field === 'read_status' )?.value;

	return (
		<HStack
			spacing={ 0 }
			alignment="top"
			justify="flex-start"
			ref={ containerRef }
			className="jp-forms__inbox__dataviews__container"
		>
			<div className="jp-forms__inbox__dataviews">
				<DataViews
					paginationInfo={ paginationInfo }
					fields={ fields }
					actions={ actions }
					data={ records || EMPTY_ARRAY }
					isLoading={ isLoadingData }
					view={ view }
					onChangeView={ setView }
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
					<HStack
						className="jp-forms__inbox__view-actions"
						spacing={ 2 }
						alignment="center"
						justify="space-between"
					>
						<HStack spacing={ 2 }>
							<InboxStatusToggle onChange={ resetPage } />
						</HStack>
						<HStack spacing={ 2 } justify={ containerWidth < 600 ? 'space-between' : 'flex-end' }>
							<DataViews.Search />
							<DataViews.FiltersToggle />
							<DataViews.ViewConfig />
						</HStack>
					</HStack>
					<DataViews.FiltersToggled className="jp-forms__inbox__filters-container" />
					<DataViews.Layout />
					<DataViews.Footer />
				</DataViews>
				{ isResponseModalOpen && (
					<Modal
						title={ __( 'Response', 'jetpack-forms' ) }
						__experimentalHideHeader={ true }
						onRequestClose={ closeResponseModal }
					>
						{ responseModal }
					</Modal>
				) }
			</div>
			<SingleResponseView
				sidePanelItem={ selection.length === 1 && sidePanelItem }
				setSidePanelItem={ setSidePanelItem }
				isLoadingData={ isLoadingData }
				isMobile={ isMobile }
				onChangeSelection={ onChangeSelection }
				selection={ selection }
			/>
		</HStack>
	);
}

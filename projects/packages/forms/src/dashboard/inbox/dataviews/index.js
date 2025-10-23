/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import {
	ExternalLink,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
/**
 * Internal dependencies
 */
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

	const [ sidePanelItem, setSidePanelItem ] = useState();
	const onChangeSelection = useCallback(
		items => {
			// Set the side panel item only when we are not on mobile.
			if ( ! isMobile ) {
				setSidePanelItem(
					!! items?.length &&
						records?.find( record => getItemId( record ) === items[ items.length - 1 ] )
				);
			}
			setSearchParams( previousSearchParams => {
				const _searchParams = new URLSearchParams( previousSearchParams );
				const currentURLSelection = _searchParams.get( 'r' )?.split( ',' ) || [];

				// Filter out IDs from the current URL selection that are either already selected in the current view
				// or already present in the current records, to avoid duplication when merging selections across pages.
				const currentSelection = currentURLSelection.filter(
					id => ! ( items.includes( id ) || records?.some( record => getItemId( record ) === id ) )
				);

				// merge items with the current URL
				const mergedItems = [ ...new Set( [ ...currentSelection, ...items ] ) ];
				if ( mergedItems.length ) {
					_searchParams.set( 'r', mergedItems.join( ',' ) );
				} else {
					_searchParams.delete( 'r' );
				}
				return _searchParams;
			} );
		},
		[ records, setSearchParams, isMobile ]
	);
	// Because selection is in sync with the URL and data takes some time to load,
	// We need to carefully (avoid infinite loops by always updating the state)
	// set the sidePanelItem when we have data and selection.
	// We don't need to do this in `mobile`,  because we don't render the side panel.
	if ( ! isMobile && !! records && !! selection.length ) {
		// Find the last (most recently selected) valid selection instead of the first
		const lastValidSelection = selection
			.slice()
			.reverse()
			.find( id => records.some( record => getItemId( record ) === id ) );
		const recordToShow = records?.find( record => getItemId( record ) === lastValidSelection );
		if ( ! sidePanelItem && recordToShow ) {
			setSidePanelItem( recordToShow );
		} else if ( !! sidePanelItem && ! recordToShow ) {
			// This case handles the case where we were having a side panel item
			// visible but the data have changed and the item is not there anymore.
			setSidePanelItem();
		} else if (
			!! sidePanelItem &&
			!! recordToShow &&
			getItemId( sidePanelItem ) === getItemId( recordToShow ) &&
			sidePanelItem !== recordToShow
		) {
			// Update side panel item if the data has been refreshed for the SAME item (e.g., after an action)
			// This ensures the side panel shows the latest version of the same entity
			setSidePanelItem( recordToShow );
		} else if (
			!! recordToShow &&
			( ! sidePanelItem || getItemId( sidePanelItem ) !== getItemId( recordToShow ) )
		) {
			// Set side panel item when selecting a different item
			setSidePanelItem( recordToShow );
		}
	}
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
					return (
						<div className="jp-forms__inbox__author-field">
							{ item.is_unread && (
								<span
									className="jp-forms__inbox__unread-indicator"
									aria-label={ __( '(Unread form response)', 'jetpack-forms' ) }
								>
									●
								</span>
							) }
							{ item.author_email && (
								<Gravatar
									email={ item.author_email }
									displayName={ authorInfo }
									key={ decodeEntities( item.author_email ) }
									size={ 32 }
									useHovercard={ false }
								/>
							) }
							{ wrapperUnread( item.is_unread, authorInfo ) }
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
				label: __( 'Read status', 'jetpack-forms' ),
				elements: [
					{ label: __( 'Unread', 'jetpack-forms' ), value: 'unread' },
					{ label: __( 'Read', 'jetpack-forms' ), value: 'read' },
				],
				filterBy: { operators: [ 'is' ] },
				enableSorting: false,
			},
			{ id: 'ip', label: __( 'IP Address', 'jetpack-forms' ), enableSorting: false },
		],
		[ filterOptions, dateSettings.formats.date ]
	);

	const actions = useMemo( () => {
		const _actions = [
			markAsReadAction,
			markAsUnreadAction,
			markAsSpamAction,
			markAsNotSpamAction,
			editFormAction,
			restoreAction,
			deleteAction,
		];
		if ( isMobile ) {
			_actions.unshift( {
				...viewAction,
				RenderModal: ( { items, closeModal } ) => {
					jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
						action: 'view-response',
						multiple: items.length > 1,
					} );
					const [ item ] = items;
					return <ResponseMobileView response={ item } closeModal={ closeModal } />;
				},
				{
					...moveToTrashAction,
					// Hide as primary action on mobile
					// Can be removed after https://github.com/WordPress/gutenberg/pull/72597
					isPrimary: false,
				}
			);
		} else {
			_actions.unshift( {
				...viewAction,
				callback( items ) {
					jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_action_click', {
						action: 'view-response',
						multiple: items.length > 1,
					} );
					const [ item ] = items;
					const selectedId = item.id.toString();
					const selectionWithoutSelectedId = selection.filter( id => id !== selectedId );
					onChangeSelection( [ ...selectionWithoutSelectedId, selectedId ] );
				},
				moveToTrashAction
			);
		}
		return _actions;
	}, [ isMobile, onChangeSelection, selection ] );

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
					header={ <InboxStatusToggle onChange={ resetPage } /> }
					empty={
						<EmptyResponses
							status={ statusFilter }
							isSearch={ !! view.search }
							readStatusFilter={ readStatusFilter }
						/>
					}
				/>
			</div>
			<SingleResponseView
				sidePanelItem={ selection.length && sidePanelItem }
				setSidePanelItem={ setSidePanelItem }
				isLoadingData={ isLoadingData }
				isMobile={ isMobile }
				onChangeSelection={ onChangeSelection }
				selection={ selection }
			/>
		</HStack>
	);
}

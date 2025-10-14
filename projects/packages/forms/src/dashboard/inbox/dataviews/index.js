/**
 * External dependencies
 */
import {
	ExternalLink,
	Modal,
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
import InboxStatusToggle from '../../components/inbox-status-toggle';
import ResponseActions from '../../components/response-actions';
import ResponseNavigation from '../../components/response-navigation';
import useInboxData from '../../hooks/use-inbox-data';
import EmptyResponses from '../empty-responses';
import InboxResponse from '../response';
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

	const [ selection, setSelection ] = useState( selectedResponses?.split( ',' ) || EMPTY_ARRAY );
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
			setSelection( items );
			// Set the side panel item only when we are not on mobile.
			if ( ! isMobile ) {
				setSidePanelItem(
					!! items?.length &&
						records?.find( record => getItemId( record ) === items[ items.length - 1 ] )
				);
			}
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
						<>
							{ item.is_unread && (
								<span
									className="jp-forms__inbox__unread-indicator"
									aria-label={ __( '(Unread form response)', 'jetpack-forms' ) }
								>
									●
								</span>
							) }
							{ wrapperUnread( item.is_unread, authorInfo ) }
						</>
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
			moveToTrashAction,
			restoreAction,
			deleteAction,
		];
		if ( isMobile ) {
			_actions.unshift( {
				...viewAction,
				RenderModal: ( { items, closeModal } ) => {
					const [ item ] = items;
					return (
						<InboxResponseMobile response={ item } data={ records } closeModal={ closeModal } />
					);
				},
				hideModalHeader: true,
			} );
		} else {
			_actions.unshift( {
				...viewAction,
				callback( items ) {
					const [ item ] = items;
					const selectedId = item.id.toString();
					const selectionWithoutSelectedId = selection.filter( id => id !== selectedId );
					onChangeSelection( [ ...selectionWithoutSelectedId, selectedId ] );
				},
			} );
		}
		return _actions;
	}, [ isMobile, onChangeSelection, selection, records ] );

	const resetPage = useCallback( () => {
		view.page = 1;
	}, [ view ] );

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
					empty={ <EmptyResponses status={ statusFilter } isSearch={ !! view.search } /> }
				/>
			</div>
			<SingleResponse
				sidePanelItem={ sidePanelItem }
				setSidePanelItem={ setSidePanelItem }
				isLoadingData={ isLoadingData }
				isMobile={ isMobile }
				data={ records }
				onChangeSelection={ onChangeSelection }
				selection={ selection }
			/>
		</HStack>
	);
}

/**
 * Component wrapper for InboxResponse in DataViews modal
 * Renders response with navigation in modal header for mobile view
 * @param {object}   props            - The props object.
 * @param {Array}    props.data       - The responses list array.
 * @param {object}   props.response   - The response item.
 * @param {Function} props.closeModal - Function to close the DataViews modal.
 * @return {import('react').JSX.Element} The DataViews component.
 */
const InboxResponseMobile = ( { response, data, closeModal } ) => {
	const [ currentResponse, setCurrentResponse ] = useState( response );

	const currentIndex = useMemo(
		() =>
			currentResponse && data
				? data.findIndex( item => getItemId( item ) === getItemId( currentResponse ) )
				: -1,
		[ currentResponse, data ]
	);

	const hasNext = currentIndex >= 0 && currentIndex < ( data?.length ?? 0 ) - 1;
	const hasPrevious = currentIndex > 0;

	const handleNext = useCallback( () => {
		if ( hasNext && data && currentIndex >= 0 ) {
			const nextItem = data[ currentIndex + 1 ];
			if ( nextItem ) {
				setCurrentResponse( nextItem );
			}
		}
	}, [ hasNext, data, currentIndex ] );

	const handlePrevious = useCallback( () => {
		if ( hasPrevious && data && currentIndex >= 0 ) {
			const prevItem = data[ currentIndex - 1 ];
			if ( prevItem ) {
				setCurrentResponse( prevItem );
			}
		}
	}, [ hasPrevious, data, currentIndex ] );

	// Action complete handler is a bit different on mobile view.
	// We don't close the modal if the response hasn't changed status (read/unread toggle)
	// and we don't change nor mess with the selection.
	const handleActionComplete = useCallback(
		actionedResponse => {
			if ( actionedResponse && actionedResponse.status === response.status ) {
				setCurrentResponse( actionedResponse );
				return;
			}
			closeModal?.();
		},
		[ closeModal, response ]
	);

	return (
		<div className="jp-forms__inbox__response-mobile">
			<HStack
				spacing="2"
				justify="space-between"
				className="jp-forms__inbox__response-mobile__header"
			>
				<h1 className="jp-forms__inbox__response-mobile__header-heading">
					{ __( 'Response', 'jetpack-forms' ) }
				</h1>
				<HStack
					spacing="2"
					justify="space-between"
					className="jp-forms__inbox__response-mobile__header-actions"
				>
					<ResponseActions response={ currentResponse } onActionComplete={ handleActionComplete } />
					<ResponseNavigation
						hasNext={ hasNext }
						hasPrevious={ hasPrevious }
						onNext={ handleNext }
						onPrevious={ handlePrevious }
						onClose={ closeModal }
					/>
				</HStack>
			</HStack>
			<InboxResponse
				isMobile={ true }
				isLoading={ false }
				response={ currentResponse }
				onClose={ null }
			/>
		</div>
	);
};

const useResponseNavigation = ( { data, onChangeSelection, sidePanelItem, setSidePanelItem } ) => {
	const currentIndex = useMemo(
		() =>
			sidePanelItem && data
				? data.findIndex( item => getItemId( item ) === getItemId( sidePanelItem ) )
				: -1,
		[ sidePanelItem, data ]
	);

	const hasNext = currentIndex >= 0 && currentIndex < ( data?.length ?? 0 ) - 1;
	const hasPrevious = currentIndex > 0;

	const handleNext = useCallback( () => {
		if ( hasNext && data && currentIndex >= 0 ) {
			const nextItem = data[ currentIndex + 1 ];
			if ( nextItem ) {
				setSidePanelItem( nextItem );
				onChangeSelection( [ getItemId( nextItem ) ] );
			}
		}
	}, [ hasNext, data, currentIndex, setSidePanelItem, onChangeSelection ] );

	const handlePrevious = useCallback( () => {
		if ( hasPrevious && data && currentIndex >= 0 ) {
			const prevItem = data[ currentIndex - 1 ];
			if ( prevItem ) {
				setSidePanelItem( prevItem );
				onChangeSelection( [ getItemId( prevItem ) ] );
			}
		}
	}, [ hasPrevious, data, currentIndex, setSidePanelItem, onChangeSelection ] );

	return {
		currentIndex,
		hasNext,
		hasPrevious,
		handleNext,
		handlePrevious,
	};
};

const SingleResponse = ( {
	sidePanelItem,
	setSidePanelItem,
	isLoadingData,
	isMobile,
	data,
	onChangeSelection,
	selection,
} ) => {
	const [ isChildModalOpen, setIsChildModalOpen ] = useState( false );

	const onRequestClose = useCallback( () => {
		if ( ! isChildModalOpen ) {
			onChangeSelection( [] );
		}
	}, [ onChangeSelection, isChildModalOpen ] );

	const handleModalStateChange = useCallback(
		isOpen => {
			setIsChildModalOpen( isOpen );
		},
		[ setIsChildModalOpen ]
	);

	const handleActionComplete = useCallback(
		actionedItem => {
			// Remove only the actioned item from selection, keep the rest
			if ( actionedItem?.id && selection ) {
				const newSelection = selection.filter( id => id !== actionedItem.id );
				onChangeSelection( newSelection );
			}
			// if the action is on current response and hasn't changed status,
			// don't close the modal but update the side panel item
			if ( actionedItem?.id === sidePanelItem.id && actionedItem.status === sidePanelItem.status ) {
				setSidePanelItem( actionedItem );
			}
		},
		[ onChangeSelection, selection, sidePanelItem, setSidePanelItem ]
	);

	// Use the navigation hook
	const navigation = useResponseNavigation( {
		data,
		onChangeSelection,
		sidePanelItem,
		setSidePanelItem,
	} );

	if ( ! sidePanelItem ) {
		return null;
	}

	// Navigation props to pass to InboxResponse and ResponseNavigation
	const navigationProps = {
		hasNext: navigation.hasNext,
		hasPrevious: navigation.hasPrevious,
		onNext: navigation.handleNext,
		onPrevious: navigation.handlePrevious,
	};

	const contents = (
		<InboxResponse
			response={ sidePanelItem }
			isLoading={ isLoadingData }
			isMobile={ isMobile }
			onModalStateChange={ handleModalStateChange }
			onClose={ isMobile ? null : onRequestClose }
			{ ...navigationProps }
			onActionComplete={ handleActionComplete }
		/>
	);

	if ( ! isMobile ) {
		return <div className="jp-forms__inbox__dataviews-response">{ contents }</div>;
	}

	return (
		<Modal
			title={ __( 'Response', 'jetpack-forms' ) }
			size="medium"
			onRequestClose={ onRequestClose }
			headerActions={
				<>
					<ResponseActions response={ sidePanelItem } onActionComplete={ handleActionComplete } />
					<ResponseNavigation { ...navigationProps } onClose={ null } />
				</>
			}
		>
			{ contents }
		</Modal>
	);
};

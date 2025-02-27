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
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
/**
 * Internal dependencies
 */
import { getPath } from '../../inbox/util';
import { STORE_NAME } from '../../state';
import InboxResponse from '../response';
import {
	viewAction,
	markAsSpamAction,
	markAsNotSpamAction,
	moveToTrashAction,
	deleteAction,
	restoreAction,
} from './actions';
import { useView, defaultLayouts } from './views';

const EMPTY_ARRAY = [];
const MOBILE_BREAKPOINT = 780;
const isItemClickable = () => true;
const getItemId = item => item.id.toString();

/**
 * Hook to get the status filter to apply from the URL.
 * This is the only way to filter the data by `status` as intentionally
 * we don't want to have a `status` filter in the UI.
 *
 * @param {string} urlStatus - The current status from the URL.
 * @return {string} The status filter to apply.
 */
function useStatusFilter( urlStatus ) {
	// Only allow specific status values.
	const statusFilter = [ 'inbox', 'spam', 'trash' ].includes( urlStatus ) ? urlStatus : 'inbox';
	return statusFilter === 'inbox' ? 'draft,publish' : statusFilter;
}

/**
 * The DataViews implementation.
 *
 * @return {React.ReactElement} The DataViews component.
 */
export default function InboxView() {
	const [ view, setView ] = useView();
	const [ searchParams, setSearchParams ] = useSearchParams();
	const [ containerWidth, setContainerWidth ] = useState( 0 );
	const containerRef = useResizeObserver(
		resizeObserverEntries => {
			setContainerWidth( resizeObserverEntries[ 0 ].borderBoxSize[ 0 ].inlineSize );
		},
		{ box: 'border-box' }
	);
	const isMobile = containerWidth <= MOBILE_BREAKPOINT;
	const { setCurrentQuery, setSelectedResponses } = useDispatch( STORE_NAME );
	const selectedResponses = searchParams.get( 'r' );
	const urlStatus = searchParams.get( 'status' );
	const statusFilter = useStatusFilter( urlStatus );
	const filterOptions = useSelect( select => select( STORE_NAME ).getFilters(), [] );
	const queryArgs = useMemo( () => {
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
				accumulator.before = new Date( Date.UTC( year, month, 0 ) ).toISOString();
			}
			return accumulator;
		}, {} );
		const _queryArgs = {
			per_page: view.perPage,
			page: view.page,
			search: view.search,
			..._filters,
			status: statusFilter,
		};
		// We need to keep the current query args in state to be used in `export`
		// and getting the total records per `status`.
		setCurrentQuery( _queryArgs );
		return _queryArgs;
	}, [ view, statusFilter, setCurrentQuery ] );
	const {
		records,
		isResolving: isLoadingData,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'feedback', queryArgs );
	const data = useMemo(
		() =>
			records?.map( record => ( {
				...record,
				fields: Object.entries( record.fields || {} ).reduce( ( accumulator, [ key, value ] ) => {
					accumulator[ key ] = decodeEntities( value );
					return accumulator;
				}, {} ),
			} ) ),
		[ records ]
	);
	const [ selection, setSelection ] = useState( selectedResponses?.split( ',' ) || EMPTY_ARRAY );

	// We need to keep the valid selection item in state to be used in `export`.
	// We do this because a user can have in their selection either ids that
	// do not exist at all or ids that are not in the current data set.
	useEffect( () => {
		const validSelectedIds = ( selection || [] ).filter( id =>
			data?.some( record => getItemId( record ) === id )
		);
		setSelectedResponses( validSelectedIds );
	}, [ data, selection, setSelectedResponses ] );
	const [ sidePanelItem, setSidePanelItem ] = useState();
	const onChangeSelection = useCallback(
		items => {
			setSelection( items );
			// Set the side panel item only when we are not on mobile.
			if ( ! isMobile ) {
				setSidePanelItem(
					!! items?.length &&
						data?.find( record => getItemId( record ) === items[ items.length - 1 ] )
				);
			}
			setSearchParams( previouSearchParams => {
				const _serachParams = new URLSearchParams( previouSearchParams );
				if ( items.length ) {
					_serachParams.set( 'r', items.join( ',' ) );
				} else {
					_serachParams.delete( 'r' );
				}
				return _serachParams;
			} );
		},
		[ data, setSearchParams, isMobile ]
	);
	// Because selection is in sync with the URL and data takes some time to load,
	// We need to carefully (avoid infinite loops by always updating the state)
	// set the sidePanelItem when we have data and selection.
	// We don't need to do this in `mobile`,  because we don't render the side panel.
	if ( ! isMobile && !! data && !! selection.length ) {
		const firstValidSelection = selection.find( id =>
			data.some( record => getItemId( record ) === id )
		);
		const recordToShow = data?.find( record => getItemId( record ) === firstValidSelection );
		if ( ! sidePanelItem && recordToShow ) {
			setSidePanelItem( recordToShow );
		} else if ( !! sidePanelItem && ! recordToShow ) {
			// This case handles the case where we were having a side panel item
			// visible but the data have changed and the item is not there anymore.
			setSidePanelItem();
		}
	}
	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);
	const fields = useMemo(
		() => [
			{
				id: 'from',
				label: __( 'From', 'jetpack-forms' ),
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
				render: ( { item } ) => dateI18n( 'M j, Y', item.date ),
				elements: ( filterOptions?.date || [] ).map( _filter => {
					const date = new Date();
					date.setDate( 1 );
					date.setMonth( _filter.month - 1 );
					return {
						label: `${ dateI18n( 'F', date ) } ${ _filter.year }`,
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
							{ decodeEntities( item.entry_title ) || getPath( item ) }
						</ExternalLink>
					);
				},
				elements: ( filterOptions?.source || [] ).map( source => ( {
					value: source.id,
					label: source.title,
				} ) ),
				filterBy: { operators: [ 'is' ] },
				enableSorting: false,
			},
			{ id: 'ip', label: __( 'IP Address', 'jetpack-forms' ), enableSorting: false },
		],
		[ filterOptions ]
	);
	const actions = useMemo( () => {
		const _actions = [
			markAsSpamAction,
			markAsNotSpamAction,
			moveToTrashAction,
			restoreAction,
			deleteAction,
		];
		if ( isMobile ) {
			_actions.unshift( viewAction );
		}
		return _actions;
	}, [ isMobile ] );
	return (
		<HStack
			spacing={ 8 }
			alignment="top"
			justify="flex-start"
			className="jp-forms__inbox__dataviews__container"
			ref={ containerRef }
		>
			<div className="jp-forms__inbox__dataviews">
				<DataViews
					paginationInfo={ paginationInfo }
					fields={ fields }
					actions={ actions }
					data={ data || EMPTY_ARRAY }
					isLoading={ isLoadingData }
					view={ view }
					onChangeView={ setView }
					selection={ selection }
					onChangeSelection={ onChangeSelection }
					getItemId={ getItemId }
					isItemClickable={ isItemClickable }
					onClickItem={ setSidePanelItem }
					defaultLayouts={ defaultLayouts }
				/>
			</div>
			<SingleResponse
				sidePanelItem={ sidePanelItem }
				setSidePanelItem={ setSidePanelItem }
				isLoadingData={ isLoadingData }
				isMobile={ isMobile }
			/>
		</HStack>
	);
}

const SingleResponse = ( { sidePanelItem, setSidePanelItem, isLoadingData, isMobile } ) => {
	const onRequestClose = useCallback( () => {
		setSidePanelItem();
	}, [ setSidePanelItem ] );
	if ( ! sidePanelItem ) {
		return null;
	}
	const contents = <InboxResponse response={ sidePanelItem } isLoading={ isLoadingData } />;
	if ( ! isMobile ) {
		return <div className="jp-forms__inbox__dataviews-response">{ contents }</div>;
	}
	return (
		<Modal
			title={ __( 'View response', 'jetpack-forms' ) }
			size="medium"
			onRequestClose={ onRequestClose }
		>
			{ contents }
		</Modal>
	);
};

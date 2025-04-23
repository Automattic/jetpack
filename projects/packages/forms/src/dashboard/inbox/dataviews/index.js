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
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { isArray, isEmpty, join } from 'lodash';
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
/**
 * Internal dependencies
 */
import { store as dashboardStore } from '../../store';
import InboxResponse from '../response';
import { getPath } from '../utils.js';
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
const EMPTY_OBJECT = {};
const MOBILE_BREAKPOINT = 780;
const getItemId = item => item.id.toString();

const formatFieldName = fieldName => {
	const match = fieldName.match( /^(\d+_)?(.*)/i );
	if ( match ) {
		return match[ 2 ];
	}
	return fieldName;
};

const formatFieldValue = fieldValue => {
	if ( isEmpty( fieldValue ) ) {
		return '-';
	} else if ( isArray( fieldValue ) ) {
		return join( fieldValue, ', ' );
	}
	return fieldValue;
};

/**
 * Helper function to get the status filter to apply from the URL.
 * This is the only way to filter the data by `status` as intentionally
 * we don't want to have a `status` filter in the UI.
 *
 * @param {string} urlStatus - The current status from the URL.
 * @return {string} The status filter to apply.
 */
function getStatusFilter( urlStatus ) {
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
	const [ queryArgs, setQueryArgs ] = useState( EMPTY_OBJECT );
	const dateSettings = getDateSettings();
	const [ resizeListener, { width: containerWidth } ] = useResizeObserver();
	const isMobile = containerWidth <= MOBILE_BREAKPOINT;
	const { setCurrentQuery, setSelectedResponses } = useDispatch( dashboardStore );
	const selectedResponses = searchParams.get( 'r' );
	const urlStatus = searchParams.get( 'status' );
	const statusFilter = getStatusFilter( urlStatus );
	const filterOptions = useSelect( select => select( dashboardStore ).getFilters(), [] );
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
			per_page: view.perPage,
			page: view.page,
			search: view.search,
			..._filters,
			status: statusFilter,
		};
		// We need to keep the current query args in the store to be used in `export`
		// and for getting the total records per `status`.
		setCurrentQuery( _queryArgs );
		// We also need to keep the args in local state and update it inside `useEffect`
		// to run after the component mounts. This is because the `status` filter is retrieved
		// from URL and can be changed through the parent components (Tabs), and if we'd used
		// `useMemo` it would run during rendering and would update the component while also
		// rendering different ones.
		setQueryArgs( _queryArgs );
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
				/**
				 * We need to perform some operations to the fields:
				 * 1. Decode the values.
				 * 2. Remove the `number_` prefix from the keys. An example stored key is `1_Name: "Rigas"`.
				 * 3. Normalize the values to handle the case where the value is an array or if is empty.
				 */
				fields: Object.entries( record.fields || {} ).reduce( ( accumulator, [ key, value ] ) => {
					let _key = formatFieldName( key );
					let counter = 2;
					while ( accumulator[ _key ] ) {
						_key = `${ formatFieldName( key ) } (${ counter })`;
						counter++;
					}
					accumulator[ _key ] = formatFieldValue( decodeEntities( value ) );
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
				render: ( { item } ) => dateI18n( dateSettings.formats.date, item.date ),
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
		[ filterOptions, dateSettings.formats.date ]
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
			spacing={ 5 }
			alignment="top"
			justify="flex-start"
			className="jp-forms__inbox__dataviews__container"
		>
			{ resizeListener }
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

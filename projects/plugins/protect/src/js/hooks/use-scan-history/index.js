import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from 'react';
import API from '../../api';
import { STORE_ID } from '../../state/store';

/**
 * Get parsed data from the initial state
 *
 * @returns {object} The information available in Protect's initial state.
 */
export default function useScanHistory() {
	const { viewingScanHistory, scanHistory } = useSelect( select => ( {
		viewingScanHistory: select( STORE_ID ).getViewingScanHistory(),
		scanHistory: select( STORE_ID ).getScanHistory(),
	} ) );

	const { setViewingScanHistory, setScanHistory } = useDispatch( STORE_ID );

	const [ filter, setFilter ] = useState( 'all' );
	const [ allScanHistoryIsLoading, setAllScanHistoryIsLoading ] = useState( false );
	const [ ignoredScanHistoryIsLoading, setIgnoredScanHistoryIsLoading ] = useState( false );
	const [ fixedScanHistoryIsLoading, setFixedScanHistoryIsLoading ] = useState( false );

	const toggleAllScanHistory = useCallback( () => {
		setAllScanHistoryIsLoading( true );
		return API.fetchScanHistory( [ 'ignored', 'fixed' ] ).then( filteredScanHistory => {
			setScanHistory( filteredScanHistory );
			setFilter( 'all' );
			setAllScanHistoryIsLoading( false );
		} );
	}, [ setScanHistory, setAllScanHistoryIsLoading ] );

	const toggleIgnoredScanHistory = useCallback( () => {
		setIgnoredScanHistoryIsLoading( true );
		return API.fetchScanHistory( [ 'ignored' ] ).then( filteredScanHistory => {
			setScanHistory( filteredScanHistory );
			setFilter( 'ignored' );
			setIgnoredScanHistoryIsLoading( false );
		} );
	}, [ setScanHistory ] );

	const toggleFixedScanHistory = useCallback( () => {
		setFixedScanHistoryIsLoading( true );
		return API.fetchScanHistory( [ 'fixed' ] ).then( filteredScanHistory => {
			setScanHistory( filteredScanHistory );
			setFilter( 'fixed' );
			setFixedScanHistoryIsLoading( false );
		} );
	}, [ setScanHistory ] );

	const handleHistoryClick = useCallback( () => {
		toggleAllScanHistory().then( () => {
			setViewingScanHistory( true );
		} );
	}, [ toggleAllScanHistory, setViewingScanHistory ] );

	const handleCurrentClick = useCallback( () => {
		setViewingScanHistory( false );
	}, [ setViewingScanHistory ] );

	return {
		filter,
		viewingScanHistory,
		scanHistory,
		allScanHistoryIsLoading,
		ignoredScanHistoryIsLoading,
		fixedScanHistoryIsLoading,
		toggleIgnoredScanHistory,
		toggleFixedScanHistory,
		toggleAllScanHistory,
		handleHistoryClick,
		handleCurrentClick,
	};
}

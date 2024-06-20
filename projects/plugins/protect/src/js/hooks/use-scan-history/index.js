import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api';
import { STORE_ID } from '../../state/store';

/**
 * Get parsed data from the initial state
 *
 * @returns {object} The information available in Protect's initial state.
 */
export default function useScanHistory() {
	const { viewingScanHistory, scanHistory, hasRequiredPlan } = useSelect( select => ( {
		viewingScanHistory: select( STORE_ID ).getViewingScanHistory(),
		scanHistory: select( STORE_ID ).getScanHistory(),
		hasRequiredPlan: select( STORE_ID ).hasRequiredPlan(),
	} ) );

	const { setViewingScanHistory, setScanHistory } = useDispatch( STORE_ID );
	const [ filter, setFilter ] = useState( 'all' );
	const [ allScanHistoryIsLoading, setAllScanHistoryIsLoading ] = useState( false );
	const [ ignoredScanHistoryIsLoading, setIgnoredScanHistoryIsLoading ] = useState( false );
	const [ fixedScanHistoryIsLoading, setFixedScanHistoryIsLoading ] = useState( false );

	const navigate = useNavigate();
	const location = useLocation();

	useEffect( () => {
		if ( location.pathname === '/history' && ! viewingScanHistory ) {
			setViewingScanHistory( true );
		}
	}, [ location.pathname, viewingScanHistory, setViewingScanHistory ] );

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
			navigate( '/history' );
		} );
	}, [ toggleAllScanHistory, navigate ] );

	const handleCurrentClick = useCallback( () => {
		navigate( '/' );
	}, [ navigate ] );

	const numCoreThreats = useMemo(
		() => scanHistory.core?.threats?.length || 0,
		[ scanHistory.core ]
	);

	const numPluginsThreats = useMemo(
		() =>
			( scanHistory.plugins || [] ).reduce( ( numThreats, plugin ) => {
				return numThreats + plugin.threats.length;
			}, 0 ),
		[ scanHistory.plugins ]
	);

	const numThemesThreats = useMemo(
		() =>
			( scanHistory.themes || [] ).reduce( ( numThreats, theme ) => {
				return numThreats + theme.threats.length;
			}, 0 ),
		[ scanHistory.themes ]
	);

	const numFilesThreats = useMemo( () => scanHistory.files?.length || 0, [ scanHistory.files ] );

	const numDatabaseThreats = useMemo(
		() => scanHistory.database?.length || 0,
		[ scanHistory.database ]
	);

	const numThreats =
		numCoreThreats + numPluginsThreats + numThemesThreats + numFilesThreats + numDatabaseThreats;

	return {
		numThreats,
		numCoreThreats,
		numPluginsThreats,
		numThemesThreats,
		numFilesThreats,
		numDatabaseThreats,
		lastChecked: scanHistory.lastChecked || null,
		error: scanHistory.error || null,
		errorCode: scanHistory.errorCode || null,
		errorMessage: scanHistory.errorMessage || null,
		core: scanHistory.core || {},
		plugins: scanHistory.plugins || [],
		themes: scanHistory.themes || [],
		files: { threats: scanHistory.files || [] },
		database: { threats: scanHistory.database || [] },
		hasRequiredPlan,
		filter,
		viewingScanHistory,
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

import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect } from 'react';
import API from '../../api';
import { STORE_ID } from '../../state/store';

/**
 * Use WAF Data Hook
 *
 * @returns {object} WAF data and methods for interacting with it.
 */
const useWafData = () => {
	const { setWafConfig, setWafIsEnabled, setWafIsLoading } = useDispatch( STORE_ID );
	const waf = useSelect( select => select( STORE_ID ).getWaf() );

	/**
	 * Refresh WAF
	 *
	 * Fetches the firewall data and updates it in application state.
	 */
	const refreshWaf = useCallback( () => {
		setWafIsLoading( true );
		return API.fetchWaf()
			.then( response => {
				setWafIsEnabled( response?.isEnabled );
				setWafConfig( response?.config );
			} )
			.finally( setWafIsLoading( false ) );
	}, [ setWafConfig, setWafIsEnabled, setWafIsLoading ] );

	/**
	 * Toggle WAF
	 *
	 * Flips the switch on the WAF module, and then refreshes the data.
	 */
	const toggleWaf = useCallback( () => {
		setWafIsLoading( true );
		return API.toggleWaf()
			.then( refreshWaf )
			.finally( () => setWafIsLoading( false ) );
	}, [ refreshWaf, setWafIsLoading ] );

	/**
	 * Toggle Manual Rules
	 *
	 * Flips the switch on the WAF IP list feature, and then refreshes the data.
	 */
	const toggleManualRules = useCallback( () => {
		setWafIsLoading( true );
		return API.updateWaf( { jetpack_waf_ip_list: ! waf.config.jetpackWafIpList } )
			.then( refreshWaf )
			.finally( () => setWafIsLoading( false ) );
	}, [ refreshWaf, setWafIsLoading, waf.config.jetpackWafIpList ] );

	const updateConfig = useCallback(
		update => {
			setWafIsLoading( true );
			return API.updateWaf( update )
				.then( refreshWaf )
				.finally( () => setWafIsLoading( false ) );
		},
		[ refreshWaf, setWafIsLoading ]
	);

	/**
	 * Ensures the WAF data is loaded each time the hook is used.
	 */
	useEffect( () => {
		if ( waf.config === undefined && ! waf.isFetching ) {
			refreshWaf();
		}
	}, [ waf.config, waf.isFetching, refreshWaf ] );

	return {
		...waf,
		refreshWaf,
		toggleWaf,
		toggleManualRules,
		updateConfig,
	};
};

export default useWafData;

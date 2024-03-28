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
	const { setWafConfig, setWafStats, setWafIsEnabled, setWafIsUpdating, setWafIsToggling } =
		useDispatch( STORE_ID );
	const waf = useSelect( select => select( STORE_ID ).getWaf() );

	/**
	 * Refresh WAF Configuration
	 *
	 * Fetches the firewall data and updates it in application state.
	 */
	const refreshWaf = useCallback( () => {
		setWafIsUpdating( true );
		return API.fetchWaf()
			.then( response => {
				setWafIsEnabled( response?.isEnabled );
				setWafConfig( response?.config );
				setWafStats( response?.stats );
			} )
			.finally( () => setWafIsUpdating( false ) );
	}, [ setWafConfig, setWafStats, setWafIsEnabled, setWafIsUpdating ] );

	/**
	 * Toggle WAF Module
	 *
	 * Flips the switch on the WAF module, and then refreshes the data.
	 */
	const toggleWaf = useCallback( () => {
		if ( ! waf.isEnabled ) {
			setWafIsToggling( true );
		}
		setWafIsUpdating( true );
		return API.toggleWaf()
			.then( refreshWaf )
			.finally( () => {
				setWafIsToggling( false );
				setWafIsUpdating( false );
			} );
	}, [ refreshWaf, waf.isEnabled, setWafIsToggling, setWafIsUpdating ] );

	/**
	 * Ensure WAF Module Is Enabled
	 */
	const ensureModuleIsEnabled = useCallback( () => {
		if ( ! waf.isEnabled ) {
			return toggleWaf();
		}

		return Promise.resolve();
	}, [ toggleWaf, waf.isEnabled ] );

	/**
	 * Toggle Automatic Rules
	 *
	 * Flips the switch on the WAF automatic rules feature, and then refreshes the data.
	 */
	const toggleAutomaticRules = useCallback( () => {
		setWafIsUpdating( true );
		return ensureModuleIsEnabled()
			.then( () =>
				API.updateWaf( { jetpack_waf_automatic_rules: ! waf.config.jetpackWafAutomaticRules } )
			)
			.then( refreshWaf )
			.finally( () => setWafIsUpdating( false ) );
	}, [ ensureModuleIsEnabled, refreshWaf, setWafIsUpdating, waf.config.jetpackWafAutomaticRules ] );

	/**
	 * Toggle Manual Rules
	 *
	 * Flips the switch on the WAF IP list feature, and then refreshes the data.
	 */
	const toggleManualRules = useCallback( () => {
		setWafIsUpdating( true );
		return API.updateWaf( { jetpack_waf_ip_list: ! waf.config.jetpackWafIpList } )
			.then( refreshWaf )
			.finally( () => setWafIsUpdating( false ) );
	}, [ refreshWaf, setWafIsUpdating, waf.config.jetpackWafIpList ] );

	/**
	 * Toggle Brute Force Protection
	 *
	 * Flips the switch on the brute force protection feature, and then refreshes the data.
	 */
	const toggleBruteForceProtection = useCallback( () => {
		setWafIsUpdating( true );
		return API.updateWaf( { brute_force_protection: ! waf.config.bruteForceProtection } )
			.then( refreshWaf )
			.finally( () => setWafIsUpdating( false ) );
	}, [ refreshWaf, setWafIsUpdating, waf.config.bruteForceProtection ] );

	/**
	 * Toggle Share Data
	 *
	 * Flips the switch on the share data option, and then refreshes the data.
	 */
	const toggleShareData = useCallback( () => {
		setWafIsUpdating( true );
		return ensureModuleIsEnabled()
			.then( () => API.updateWaf( { jetpack_waf_share_data: ! waf.config.jetpackWafShareData } ) )
			.then( refreshWaf )
			.finally( () => setWafIsUpdating( false ) );
	}, [ ensureModuleIsEnabled, refreshWaf, setWafIsUpdating, waf.config.jetpackWafShareData ] );

	/**
	 * Toggle Share Debug Data
	 *
	 * Flips the switch on the share debug data option, and then refreshes the data.
	 */
	const toggleShareDebugData = useCallback( () => {
		setWafIsUpdating( true );
		return ensureModuleIsEnabled()
			.then( () =>
				API.updateWaf( { jetpack_waf_share_debug_data: ! waf.config.jetpackWafShareDebugData } )
			)
			.then( refreshWaf )
			.finally( () => setWafIsUpdating( false ) );
	}, [ ensureModuleIsEnabled, refreshWaf, setWafIsUpdating, waf.config.jetpackWafShareDebugData ] );

	/**
	 * Update WAF Config
	 */
	const updateConfig = useCallback(
		update => {
			setWafIsUpdating( true );
			return API.updateWaf( update )
				.then( refreshWaf )
				.finally( () => setWafIsUpdating( false ) );
		},
		[ refreshWaf, setWafIsUpdating ]
	);

	/**
	 * Ensures the WAF data is loaded each time the hook is used.
	 */
	useEffect( () => {
		if ( waf.config === undefined && ! waf.isFetching ) {
			refreshWaf();
		}
	}, [ waf.config, waf.isFetching, setWafIsUpdating, refreshWaf ] );

	return {
		...waf,
		refreshWaf,
		toggleWaf,
		toggleAutomaticRules,
		toggleManualRules,
		toggleBruteForceProtection,
		toggleShareData,
		toggleShareDebugData,
		updateConfig,
	};
};

export default useWafData;

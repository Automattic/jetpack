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
	const { setWafConfig, setWafIsEnabled, setWafIsUpdating, setWafIsLoading } = useDispatch(
		STORE_ID
	);
	const waf = useSelect( select => select( STORE_ID ).getWaf() );

	/**
	 * Refresh WAF
	 *
	 * Fetches the firewall data and updates it in application state.
	 */
	const refreshWaf = useCallback( () => {
		return API.fetchWaf().then( response => {
			setWafIsEnabled( response?.isEnabled );
			setWafConfig( response?.config );
		} );
	}, [ setWafConfig, setWafIsEnabled ] );

	/**
	 * Toggle WAF
	 *
	 * Flips the switch on the WAF module, and then refreshes the data.
	 */
	const toggleWaf = useCallback( () => {
		setWafIsLoading( true );
		setWafIsUpdating( true );
		return API.toggleWaf()
			.then( refreshWaf )
			.finally( () => {
				setWafIsLoading( false );
				setWafIsUpdating( false );
			} );
	}, [ refreshWaf, setWafIsLoading, setWafIsUpdating ] );

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
	 * Toggle Share Data
	 *
	 * Flips the switch on the share data option, and then refreshes the data.
	 */
	const toggleShareData = useCallback( () => {
		setWafIsUpdating( true );
		return API.updateWaf( { jetpack_waf_share_data: ! waf.config.jetpackWafShareData } )
			.then( refreshWaf )
			.finally( () => setWafIsUpdating( false ) );
	}, [ refreshWaf, setWafIsUpdating, waf.config.jetpackWafShareData ] );

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
			setWafIsUpdating( true );
			refreshWaf().then( setWafIsUpdating( false ) );
		}
	}, [ waf.config, waf.isFetching, setWafIsUpdating, refreshWaf ] );

	return {
		...waf,
		refreshWaf,
		toggleWaf,
		toggleManualRules,
		toggleShareData,
		updateConfig,
	};
};

export default useWafData;

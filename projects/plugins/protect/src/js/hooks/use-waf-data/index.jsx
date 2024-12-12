import { useCallback } from 'react';
import useToggleWafMutation from '../../data/waf/use-toggle-waf-module-mutation';
import useWafMutation from '../../data/waf/use-waf-mutation';
import useWafQuery from '../../data/waf/use-waf-query';
import useAnalyticsTracks from '../use-analytics-tracks';

/**
 * Use WAF Data Hook
 *
 * @return {object} WAF data and methods for interacting with it.
 */
const useWafData = () => {
	const { recordEvent } = useAnalyticsTracks();
	const { data: waf } = useWafQuery();
	const wafMutation = useWafMutation();
	const toggleWafMutation = useToggleWafMutation();

	/**
	 * Toggle WAF Module
	 *
	 * Flips the switch on the WAF module, and then refreshes the data.
	 */
	const toggleWaf = useCallback( async () => {
		toggleWafMutation.mutate();
	}, [ toggleWafMutation ] );

	/**
	 * Ensure WAF Module Is Enabled
	 */
	const ensureModuleIsEnabled = useCallback( async () => {
		if ( ! waf.isEnabled ) {
			return await toggleWaf();
		}

		return true;
	}, [ toggleWaf, waf.isEnabled ] );

	/**
	 * Toggle Automatic Rules
	 *
	 * Flips the switch on the WAF automatic rules feature, and then refreshes the data.
	 */
	const toggleAutomaticRules = useCallback( async () => {
		const value = ! waf.config.jetpackWafAutomaticRules;
		await ensureModuleIsEnabled();
		await wafMutation.mutateAsync( {
			jetpack_waf_automatic_rules: value,
		} );
		recordEvent(
			value ? 'jetpack_protect_automatic_rules_enabled' : 'jetpack_protect_automatic_rules_disabled'
		);
	}, [ ensureModuleIsEnabled, recordEvent, waf.config.jetpackWafAutomaticRules, wafMutation ] );

	/**
	 * Toggle IP Allow List
	 *
	 * Flips the switch on the WAF IP allow list feature, and then refreshes the data.
	 */
	const toggleIpAllowList = useCallback( async () => {
		const value = ! waf.config.jetpackWafIpAllowListEnabled;
		await wafMutation.mutateAsync( {
			jetpack_waf_ip_allow_list_enabled: value,
		} );
		recordEvent(
			value ? 'jetpack_protect_ip_allow_list_enabled' : 'jetpack_protect_ip_allow_list_disabled'
		);
	}, [ recordEvent, waf.config.jetpackWafIpAllowListEnabled, wafMutation ] );

	/**
	 * Save IP Allow List
	 */
	const saveIpAllowList = useCallback(
		async value => {
			await wafMutation.mutateAsync( {
				jetpack_waf_ip_allow_list: value,
			} );
			recordEvent( 'jetpack_protect_ip_allow_list_updated' );
		},
		[ recordEvent, wafMutation ]
	);

	/**
	 * Toggle IP Block List
	 *
	 * Flips the switch on the WAF IP block list feature, and then refreshes the data.
	 */
	const toggleIpBlockList = useCallback( async () => {
		const value = ! waf.config.jetpackWafIpBlockListEnabled;
		await ensureModuleIsEnabled();
		await wafMutation.mutateAsync( {
			jetpack_waf_ip_block_list_enabled: value,
		} );
		recordEvent(
			value ? 'jetpack_protect_ip_block_list_enabled' : 'jetpack_protect_ip_block_list_disabled'
		);
	}, [ ensureModuleIsEnabled, recordEvent, waf.config.jetpackWafIpBlockListEnabled, wafMutation ] );

	/**
	 * Save IP Block List
	 */
	const saveIpBlockList = useCallback(
		async value => {
			await ensureModuleIsEnabled();
			await wafMutation.mutateAsync( {
				jetpack_waf_ip_block_list: value,
			} );
			recordEvent( 'jetpack_protect_ip_block_list_updated' );
		},
		[ ensureModuleIsEnabled, wafMutation, recordEvent ]
	);

	/**
	 * Toggle Brute Force Protection
	 *
	 * Flips the switch on the brute force protection feature, and then refreshes the data.
	 */
	const toggleBruteForceProtection = useCallback( async () => {
		const value = ! waf.config.bruteForceProtection;
		await wafMutation.mutateAsync( { brute_force_protection: value } );
		recordEvent(
			value
				? 'jetpack_protect_brute_force_protection_enabled'
				: 'jetpack_protect_brute_force_protection_disabled'
		);
	}, [ recordEvent, waf.config.bruteForceProtection, wafMutation ] );

	/**
	 * Toggle Share Data
	 *
	 * Flips the switch on the share data option, and then refreshes the data.
	 */
	const toggleShareData = useCallback( async () => {
		const value = ! waf.config.jetpackWafShareData;
		const mutationObj = { jetpack_waf_share_data: value };
		if ( ! value ) {
			mutationObj.jetpack_waf_share_debug_data = false;
		}
		await wafMutation.mutateAsync( mutationObj );
		recordEvent(
			mutationObj ? 'jetpack_protect_share_data_enabled' : 'jetpack_protect_share_data_disabled'
		);
	}, [ recordEvent, waf.config.jetpackWafShareData, wafMutation ] );

	/**
	 * Toggle Share Debug Data
	 *
	 * Flips the switch on the share debug data option, and then refreshes the data.
	 */
	const toggleShareDebugData = useCallback( async () => {
		const value = ! waf.config.jetpackWafShareDebugData;
		const mutationObj = { jetpack_waf_share_debug_data: value };
		if ( value ) {
			mutationObj.jetpack_waf_share_data = true;
		}
		await wafMutation.mutateAsync( mutationObj );
		recordEvent(
			value
				? 'jetpack_protect_share_debug_data_enabled'
				: 'jetpack_protect_share_debug_data_disabled'
		);
	}, [ recordEvent, waf.config.jetpackWafShareDebugData, wafMutation ] );

	return {
		...waf,
		isUpdating: wafMutation.isPending,
		isToggling: toggleWafMutation.isPending,
		toggleWaf,
		toggleAutomaticRules,
		toggleIpAllowList,
		saveIpAllowList,
		toggleIpBlockList,
		saveIpBlockList,
		toggleBruteForceProtection,
		toggleShareData,
		toggleShareDebugData,
	};
};

export default useWafData;

import { useCallback } from 'react';
import useAccountProtectionMutation from '../../data/account-protection/use-account-protection-mutation';
import useAccountProtectionQuery from '../../data/account-protection/use-account-protection-query';
import useToggleAccountProtectionMutation from '../../data/account-protection/use-toggle-account-protection-module-mutation';
import useAnalyticsTracks from '../use-analytics-tracks';

/**
 * Use Account Protection Data Hook
 *
 * @return {object} Account Protection data and methods for interacting with it.
 */
const useAccountProtectionData = () => {
	const { recordEvent } = useAnalyticsTracks();
	const { data: accountProtection } = useAccountProtectionQuery();
	const accountProtectionMutation = useAccountProtectionMutation();
	const toggleAccountProtectionMutation = useToggleAccountProtectionMutation();

	/**
	 * Toggle Account Protection Module
	 *
	 * Flips the switch on the account protection module, and then refreshes the data.
	 */
	const toggleAccountProtection = useCallback( async () => {
		toggleAccountProtectionMutation.mutate();
	}, [ toggleAccountProtectionMutation ] );

	/**
	 * Ensure Account Protection Module Is Enabled
	 */
	const ensureModuleIsEnabled = useCallback( async () => {
		if ( ! accountProtection.isEnabled ) {
			return await toggleAccountProtection();
		}

		return true;
	}, [ toggleAccountProtection, accountProtection.isEnabled ] );

	/**
	 * Toggle Password Detection
	 *
	 * Flips the switch on the WAF automatic rules feature, and then refreshes the data.
	 */
	const togglePasswordDetection = useCallback( async () => {
		const value = ! accountProtection.config.jetpackAccountProtectionPasswordDetection;
		await ensureModuleIsEnabled();
		await accountProtectionMutation.mutateAsync( {
			jetpack_account_protection_password_detection: value,
		} );
		recordEvent(
			value
				? 'jetpack_protect_password_detection_enabled'
				: 'jetpack_protect_password_detection_disabled'
		);
	}, [
		ensureModuleIsEnabled,
		recordEvent,
		accountProtection.config.jetpackAccountProtectionPasswordDetection,
		accountProtectionMutation,
	] );

	/**
	 * Toggle Strong Passwords
	 *
	 * Flips the switch on the strong passwords feature, and then refreshes the data.
	 */
	const toggleStrongPasswords = useCallback( async () => {
		const value = ! accountProtection.config.jetpackAccountProtectionStrongPasswords;
		await ensureModuleIsEnabled();
		await accountProtectionMutation.mutateAsync( {
			jetpack_account_protection_strong_passwords: value,
		} );
	}, [
		ensureModuleIsEnabled,
		accountProtection.config.jetpackAccountProtectionStrongPasswords,
		accountProtectionMutation,
	] );

	return {
		...accountProtection,
		isUpdating: accountProtectionMutation.isPending,
		isToggling: toggleAccountProtectionMutation.isPending,
		toggleAccountProtection,
		togglePasswordDetection,
		toggleStrongPasswords,
	};
};

export default useAccountProtectionData;

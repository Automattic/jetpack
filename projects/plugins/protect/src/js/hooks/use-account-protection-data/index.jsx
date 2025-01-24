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
	 * Flips the switch on the Account Protection module, and then refreshes the data.
	 */
	const toggleAccountProtection = useCallback( async () => {
		toggleAccountProtectionMutation.mutate();
	}, [ toggleAccountProtectionMutation ] );

	/**
	 * Toggle Strict Mode
	 *
	 * Flips the switch on the strict mode option, and then refreshes the data.
	 */
	const toggleStrictMode = useCallback( async () => {
		const value = ! accountProtection.settings.jetpackAccountProtectionStrictMode;
		const mutationObj = { jetpack_account_protection_strict_mode: value };
		if ( ! value ) {
			mutationObj.jetpack_account_protection_strict_mode = false;
		}
		await accountProtectionMutation.mutateAsync( mutationObj );
		recordEvent(
			mutationObj
				? 'jetpack_account_protection_strict_mode_enabled'
				: 'jetpack_account_protection_strict_mode_disabled'
		);
	}, [
		recordEvent,
		accountProtection.settings.jetpackAccountProtectionStrictMode,
		accountProtectionMutation,
	] );

	return {
		...accountProtection,
		isUpdating: accountProtectionMutation.isPending,
		isToggling: toggleAccountProtectionMutation.isPending,
		toggleAccountProtection,
		toggleStrictMode,
	};
};

export default useAccountProtectionData;

/*
 * External dependencies
 */
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';

/**
 * A convenience hook to get and update the status of the AI module.
 *
 * @return {object} - The status of the AI module.
 */
export default function useAiModule(): {
	isAiModuleActive: boolean;
	isChangingStatus: boolean;
	isLoadingModules: boolean;
	changeStatus: ( active: boolean ) => void;
} {
	const {
		isModuleActive: isAiModuleActive,
		isChangingStatus,
		isLoadingModules,
		changeStatus,
	} = useModuleStatus( 'ai' );

	return { isAiModuleActive, isChangingStatus, isLoadingModules, changeStatus };
}

/**
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';

export const usePermission = () => {
	const { isRegistered, hasConnectedOwner, isUserConnected } = useConnection();

	const canPerformAction =
		isRegistered && // The site is registered with Jetpack
		hasConnectedOwner && // The plan owner is connected
		isUserConnected; // The user, which may or may not be the plan owner, is connected

	return {
		isRegistered,
		hasConnectedOwner,
		isUserConnected,
		canPerformAction,
	};
};

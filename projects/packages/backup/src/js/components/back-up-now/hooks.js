import { useMemo } from 'react';
import useCapabilities from '../../hooks/useCapabilities';
import useConnection from '../../hooks/useConnection';
import { useIsFullyConnected } from '../Admin/hooks';

export const useShowBackUpNow = () => {
	const connectionStatus = useConnection();
	const isFullyConnected = useIsFullyConnected();
	const { capabilitiesLoaded, hasBackupPlan } = useCapabilities();

	return useMemo( () => {
		return connectionStatus && isFullyConnected && capabilitiesLoaded && hasBackupPlan;
	}, [ connectionStatus, isFullyConnected, hasBackupPlan, capabilitiesLoaded ] );
};

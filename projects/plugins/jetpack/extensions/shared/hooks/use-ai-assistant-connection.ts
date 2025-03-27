import { useConnection } from '@automattic/jetpack-connection';

const useAiAssistantConnection = () => {
	const { hasConnectedOwner } = useConnection();
	return {
		connected: hasConnectedOwner,
	};
};

export default useAiAssistantConnection;

import { useConnection } from '@automattic/jetpack-connection';

const useAiAssistantConnection = () => {
	const { isRegistered } = useConnection();
	return {
		connected: isRegistered,
	};
};

export default useAiAssistantConnection;

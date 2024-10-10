import { useConnection } from '@automattic/jetpack-connection';
import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';

const useIsUserConnected: () => boolean = () => {
	const { isUserConnected } = useConnection();

	return isSimpleSite() || isUserConnected;
};

export default useIsUserConnected;

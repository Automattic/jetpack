import { useConnection } from '@automattic/jetpack-connection';
import {
	getMyJetpackWindowInitialState,
	getMyJetpackWindowRestState,
	getMyJetpackWindowConnectionState,
} from '../../data/utils/get-my-jetpack-window-state';
/**
 * React custom hook to get the site purchases data.
 *
 * @returns {object} site purchases data
 */

interface MyJetpackConnection {
	apiNonce: string;
	apiRoot: string;
	blogID: number;
	registrationNonce: string;
	isSiteConnected: boolean;
	topJetpackMenuItemUrl: string;
	// The useConnection hook is not typed, so we don't know what other properties it returns.
	// We could define the types here, but that hook returns a lot of data and it's not best practices
	// to duplicate them here. The best approach would be to type the useConnection hook itself.
	[ key: string ]: unknown;
}

const useMyJetpackConnection = (): MyJetpackConnection => {
	const { apiRoot, apiNonce } = getMyJetpackWindowRestState();
	const { topJetpackMenuItemUrl, blogID } = getMyJetpackWindowInitialState();
	const connectionData = useConnection( { apiRoot, apiNonce } );
	const { registrationNonce } = getMyJetpackWindowConnectionState();

	// Alias: https://github.com/Automattic/jetpack/blob/trunk/projects/packages/connection/src/class-rest-connector.php/#L315
	const isSiteConnected = connectionData.isRegistered;

	return {
		apiNonce,
		apiRoot,
		blogID,
		registrationNonce,
		...connectionData,
		isSiteConnected,
		topJetpackMenuItemUrl,
	};
};

export default useMyJetpackConnection;

import { useConnection } from '@automattic/jetpack-connection';
import {
	getMyJetpackWindowInitialState,
	getMyJetpackWindowRestState,
	getMyJetpackWindowConnectionState,
} from '../../data/utils/get-my-jetpack-window-state';
/**
 * React custom hook to get the site purchases data.
 *
 * @return {object} site purchases data
 */

type MyJetpackConnection = {
	apiNonce: string;
	apiRoot: string;
	blogID: string;
	registrationNonce: string;
	isSiteConnected: boolean;
	siteIsRegistered: boolean;
	topJetpackMenuItemUrl: string;
} & ReturnType< typeof useConnection >;

type MyJetpackConnectionOptions = {
	skipUserConnection?: boolean;
	redirectUri?: string;
};

const useMyJetpackConnection = ( {
	skipUserConnection = false,
	redirectUri = '',
}: MyJetpackConnectionOptions = {} ): MyJetpackConnection => {
	const { apiRoot, apiNonce } = getMyJetpackWindowRestState();
	const { topJetpackMenuItemUrl, blogID } = getMyJetpackWindowInitialState();
	const { registrationNonce } = getMyJetpackWindowConnectionState();
	const connectionData = useConnection( {
		apiRoot,
		apiNonce,
		registrationNonce,
		skipUserConnection,
		from: 'my-jetpack',
		redirectUri: redirectUri,
		autoTrigger: false,
	} );

	// Alias: https://github.com/Automattic/jetpack/blob/trunk/projects/packages/connection/src/class-rest-connector.php/#L315
	const isSiteConnected = connectionData.isRegistered;
	const siteIsRegistered = connectionData.isRegistered;
	const hasConnectedOwner = connectionData.hasConnectedOwner;

	return {
		apiNonce,
		apiRoot,
		blogID,
		registrationNonce,
		...connectionData,
		isSiteConnected,
		siteIsRegistered,
		topJetpackMenuItemUrl,
		hasConnectedOwner,
	};
};

export default useMyJetpackConnection;

/**
 * Internal dependencies
 */
import { VideoPressExtensionsProps } from './extensions/types';
declare global {
	interface Window {
		videoPressEditorState: {
			extensions: VideoPressExtensionsProps;
			siteType: 'simple' | 'atomic' | 'jetpack';
			myJetpackConnectUrl: string;
			isVideoPressModuleActive: '' | '1';
			isStandaloneActive: '' | '1';
			jetpackVideoPressSettingUrl: string;
			imagesURLBase: string;
			playerBridgeUrl: string;
		};

		JP_CONNECTION_INITIAL_STATE: {
			apiRoot: string;
			apiNonce: string;
			registrationNonce: string;
			connectionStatus: {
				isActive: boolean;
				isStaging: boolean;
				isRegistered: boolean;
				isUserConnected: boolean;
				hasConnectedOwner: boolean;
				offlineMode: {
					isActive: boolean;
					constant: boolean;
					url: boolean;
					filter: boolean;
					wpLocalConstant: boolean;
				};
				isPublic: boolean;
			};
			userConnectionData: {
				currentUser: {
					isConnected: boolean;
					isMaster: boolean;
					username: string;
					id: number;
					blogId: number;
					wpcomUser: {
						avatar: boolean;
					};
					gravatar: string;
					permissions: {
						connect: boolean;
						connect_user: boolean;
						disconnect: boolean;
					};
				};
				connectionOwner: null;
			};
			connectedPlugins: object;
			wpVersion: string;
			siteSuffix: string;
			connectionErrors: Array;
		};
	}
}

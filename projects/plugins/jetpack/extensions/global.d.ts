import { JETPACK_FORM_AI_COMPOSITION_EXTENSION } from './blocks/ai-assistant/extensions/jetpack-contact-form/constants';
import { JETPACK_CREATE_WITH_VOICE_EXTENSION } from './blocks/create-with-voice/constants';
import { SiteAIAssistantFeatureEndpointResponseProps } from './types';

type AvailableBlockProps =
	| {
			available?: boolean;
	  }
	| undefined;

declare global {
	interface Window {
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
		Jetpack_Editor_Initial_State: {
			available_blocks: {
				[ JETPACK_CREATE_WITH_VOICE_EXTENSION ]: AvailableBlockProps;
				[ JETPACK_FORM_AI_COMPOSITION_EXTENSION ]: AvailableBlockProps;
			};
			adminUrl: string;
			siteLocale: string;
			'ai-assistant': SiteAIAssistantFeatureEndpointResponseProps;
			screenBase?: string;
		};
		wpcomFetch: function;
	}
}

import { JETPACK_FORM_AI_COMPOSITION_EXTENSION } from './blocks/ai-assistant/extensions/jetpack-contact-form/constants';
import { JETPACK_VOICE_TO_CONTENT_EXTENSION } from './blocks/voice-to-content/constants';
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
						admin_page?: boolean;
						connect: boolean;
						connect_user: boolean;
						disconnect: boolean;
						edit_posts?: boolean;
						manage_modules?: boolean;
						manage_options?: boolean;
						manage_plugins?: boolean;
						network_admin?: boolean;
						network_sites_page?: boolean;
						publish_posts?: boolean;
						view_stats?: boolean;
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
				[ JETPACK_VOICE_TO_CONTENT_EXTENSION ]: AvailableBlockProps;
				[ JETPACK_FORM_AI_COMPOSITION_EXTENSION ]: AvailableBlockProps;
			};
			adminUrl: string;
			siteLocale: string;
			'ai-assistant': SiteAIAssistantFeatureEndpointResponseProps;
			screenBase?: string;
			wpcomBlogId?: string;
		};
		wpcomFetch: function;
	}
}

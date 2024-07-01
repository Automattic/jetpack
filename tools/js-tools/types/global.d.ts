declare module '*.mdx';
declare module '*.module.scss' {
	const classes: { [ key: string ]: string };
	export default classes;
}

type AvailableBlockProps =
	| {
			available?: boolean;
	  }
	| undefined;

interface Window {
	Initial_State?: {
		adminUrl?: string;
	};
	JP_CONNECTION_INITIAL_STATE: {
		apiRoot: string;
		apiNonce: string;
		registrationNonce: string;
		calypsoEnv?: string;
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
			'ai-assistant-form-support': AvailableBlockProps;
			'voice-to-content': AvailableBlockProps;
		};
		adminUrl: string;
		siteLocale: string;
		'ai-assistant': {
			'is-enabled': boolean;
			'has-feature': boolean;
			'is-over-limit': boolean;
			'requests-count': number;
			'requests-limit': number;
			'usage-period': {
				'current-start': string;
				'next-start': string;
				'requests-count': number;
			};
			'site-require-upgrade': boolean;
			'error-message'?: string;
			'error-code'?: string;
			'upgrade-type': UpgradeTypeProp;
			'current-tier': TierProp;
			'tier-plans': Array< TierProp >;
			'next-tier'?: TierProp | null;
		};
		screenBase?: string;
		wpcomBlogId?: string;
		tracksUserData?: {
			userid: string;
			username: string;
		};
	};
	myJetpackInitialState?: {
		adminUrl?: string;
	};
	wpcomFetch: function;
}

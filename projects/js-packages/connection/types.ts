export type ConnectionScriptData = {
	apiRoot: string;
	apiNonce: string;
	registrationNonce: string;
	calypsoEnv: string;
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
		/** Why the last registration attempt failed; null when it did not. */
		registrationError: {
			code: string;
			message: string;
			/** Whether retrying could ever succeed without the site's environment changing. */
			isPermanent: boolean;
			attempts: number;
			lastAttemptAt: number;
			/** Unix timestamp of the next automatic attempt; null when there will not be one. */
			nextRetryAfter: number | null;
		} | null;
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
				display_name: string;
				email: string;
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
	connectionErrors: Array< string | object >;
	isOfflineMode: boolean;
	isOwnershipTransferable: boolean;
	/** Owner identity; null when unresolvable or when the viewer lacks the jetpack_connect capability. */
	connectionOwner: {
		id: number;
		displayName: string;
	} | null;
};

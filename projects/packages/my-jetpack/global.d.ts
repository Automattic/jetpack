interface Window {
	myJetpackInitialState?: {
		siteSuffix: string;
		latestBoostSpeedScores: {
			scores: {
				desktop: number;
				mobile: number;
			};
			theme: string;
			timestamp: number;
		};
		IDCContainerID: string;
		adminUrl: string;
		blogID: string;
		fileSystemWriteAccess: 'yes' | 'no';
		isStatsModuleActive: string;
		isUserFromKnownHost: string;
		jetpackManage: {
			isAgencyAccount: boolean;
			isEnabled: boolean;
		};
		loadAddLicenseScreen: string;
		myJetpackCheckoutUri: string;
		myJetpackFlags: {
			showJetpackStatsCard: boolean;
			videoPressStats: boolean;
		};
		myJetpackUrl: string;
		myJetpackVersion: string;
		plugins: {
			[ key: string ]: {
				Name: string;
				PluginURI: string;
				Version: string;
				Title: string;
				Description: string;
				Author: string;
				AuthorName: string;
				AuthorURI: string;
				DomainPath: string;
				textDomain: string;
				RequiresPHP: string;
				RequiresWP: string;
				UpdateURI: string;
				Network: boolean;
				active: boolean;
			};
		};
		products: {
			items: {
				[ key: string ]: {
					class: string;
					description: string;
					disclaimers: Array< string[] >;
					features: string[];
					features_by_tier: Array< string >;
					has_required_plan: boolean;
					has_required_tier: Array< string >;
					is_bundle: boolean;
					is_plugin_active: boolean;
					is_upgradable_by_bundle: string[];
					long_description: string;
					manage_url: string;
					name: string;
					plugin_slug: string;
					post_activation_url: string;
					post_checkout_url?: string;
					pricing_for_ui?: {
						available: boolean;
						wpcom_product_slug: string;
						product_term: string;
						currency_code: string;
						full_price: number;
						discount_price: number;
						coupon_discount: number;
						is_introductory_offer: boolean;
						introductory_offer?: {
							cost_per_interval: number;
							interval_count: number;
							interval_unit: string;
							should_prorate_when_offer_ends: boolean;
							transition_after_renewal_count: number;
							usage_limit?: number;
						};
					};
					purchase_url?: string;
					requires_user_connection: boolean;
					slug: string;
					standalone_plugin_info: {
						has_standalone_plugin: boolean;
						is_standalone_installed: boolean;
						is_standalone_active: boolean;
					};
					status: string;
					supported_products: string[];
					tiers: string[];
					title: string;
					wpcom_product_slug: string;
				};
			};
		};
		purchases: {
			items: Array< object >;
		};
		topJetpackMenuItemUrl: string;
		userIsAdmin: string;
		userIsNewToJetpack: string;
		welcomeBanner: {
			hasBeenDismissed: boolean;
		};
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
	};
}

declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.scss';

// These libraries don't have types, this suppresses the TypeScript errors
declare module '@wordpress/components';
declare module '@wordpress/compose';
declare module '@wordpress/icons';
declare module '@automattic/jetpack-connection';
declare module '@wordpress/url';

type ProductStatus =
	| 'active'
	| 'inactive'
	| 'module_disabled'
	| 'site_connection_error'
	| 'plugin_absent'
	| 'plugin_absent_with_plan'
	| 'needs_plan'
	| 'needs_activation'
	| 'needs_first_site_connection'
	| 'user_connection_error'
	| 'can_upgrade';

type JetpackModule =
	| 'anti-spam'
	| 'backup'
	| 'boost'
	| 'crm'
	| 'creator'
	| 'extras'
	| 'ai'
	| 'jetpack-ai'
	| 'scan'
	| 'search'
	| 'social'
	| 'security'
	| 'protect'
	| 'videopress'
	| 'stats';

type ThreatItem = {
	// Protect API properties (free plan)
	id: string;
	title: string;
	fixed_in: string;
	description: string | null;
	source: string | null;
	// Scan API properties (paid plan)
	context: string | null;
	filename: string | null;
	first_detected: string | null;
	fixable: boolean | null;
	severity: number | null;
	signature: string | null;
	status: number | null;
};

type ScanItem = {
	checked: boolean;
	name: string;
	slug: string;
	threats: ThreatItem[];
	type: string;
	version: string;
};

interface Window {
	myJetpackInitialState?: {
		siteSuffix: string;
		siteUrl: string;
		latestBoostSpeedScores: {
			previousScores: {
				desktop: number;
				mobile: number;
			};
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
			showFullJetpackStatsCard: boolean;
			videoPressStats: boolean;
		};
		lifecycleStats: {
			historicallyActiveModules: JetpackModule[];
			brokenModules: {
				needs_site_connection: JetpackModule[];
				needs_user_connection: JetpackModule[];
			};
			isSiteConnected: boolean;
			isUserConnected: boolean;
			jetpackPlugins: Array< string >;
			ownedProducts: JetpackModule[];
			unownedProducts: JetpackModule[];
			modules: Array< string >;
			purchases: Array< string >;
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
					has_free_offering: boolean;
					has_paid_plan_for_product: boolean;
					features_by_tier: Array< string >;
					is_bundle: boolean;
					is_plugin_active: boolean;
					is_upgradable: boolean;
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
						wpcom_free_product_slug?: string;
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
						tiers?: {
							[ key: string ]: {
								available: boolean;
								currencyCode: string;
								discountPrice: number;
								fullPrice: number;
								introductoryOffer?: {
									costPerInterval: number;
									intervalCount: number;
									intervalUnit: string;
									shouldProrateWhenOfferEnds: boolean;
									transitionAfterRenewalCount: number;
									usageLimit?: number;
								};
								isIntroductoryOffer: boolean;
								productTerm: string;
								wpcomProductSlug: string;
								quantity: number;
							};
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
					status: ProductStatus;
					supported_products: string[];
					tiers: string[];
					title: string;
					wpcom_product_slug: string;
				};
			};
		};
		protect: {
			scanData: {
				core: ScanItem;
				current_progress?: string;
				data_source: string;
				database: string[];
				error: boolean;
				error_code?: string;
				error_message?: string;
				files: string[];
				has_unchecked_items: boolean;
				last_checked: string;
				num_plugins_threats: number;
				num_themes_threats: number;
				num_threats: number;
				plugins: ScanItem[];
				status: string;
				themes: ScanItem[];
			};
			wafConfig: {
				automatic_rules_available: boolean;
				blocked_logins: number;
				bootstrap_path: string;
				brute_force_protection: boolean;
				jetpack_waf_automatic_rules: '1' | '';
				jetpack_waf_ip_allow_list: '1' | '';
				jetpack_waf_ip_block_list: boolean;
				jetpack_waf_ip_list: boolean;
				jetpack_waf_share_data: '1' | '';
				jetpack_waf_share_debug_data: boolean;
				standalone_mode: boolean;
			};
		};
		videopress: {
			featuredStats?: {
				label: string;
				period: 'day' | 'year';
				data: {
					views: {
						current: number;
						previous: number;
					};
					impressions: {
						current: number;
						previous: number;
					};
					watch_time: {
						current: number;
						previous: number;
					};
				};
			};
			videoCount: number;
		};
		purchases: {
			items: Array< {
				ID: string;
				user_id: string;
				blog_id: string;
				product_id: string;
				subscribed_date: string;
				renew: string;
				auto_renew: string;
				renew_date: string;
				inactive_date: string | null;
				active: string;
				meta: string | object;
				ownership_id: string;
				most_recent_renew_date: string;
				amount: number;
				expiry_date: string;
				expiry_message: string;
				expiry_sub_message: string;
				expiry_status: string;
				partner_name: string | null;
				partner_slug: string | null;
				partner_key_id: string | null;
				subscription_status: string;
				product_name: string;
				product_slug: string;
				product_type: string;
				blog_created_date: string;
				blogname: string;
				domain: string;
				description: string;
				attached_to_purchase_id: string | null;
				included_domain: string;
				included_domain_purchase_amount: number;
				currency_code: string;
				currency_symbol: string;
				renewal_price_tier_slug: string | null;
				renewal_price_tier_usage_quantity: number | null;
				current_price_tier_slug: string | null;
				current_price_tier_usage_quantity: number | null;
				price_tier_list: Array< object >;
				price_text: string;
				bill_period_label: string;
				bill_period_days: number;
				regular_price_text: string;
				regular_price_integer: number;
				product_display_price: string;
				price_integer: number;
				is_cancelable: boolean;
				can_explicit_renew: boolean;
				can_disable_auto_renew: boolean;
				can_reenable_auto_renewal: boolean;
				iap_purchase_management_link: string | null;
				is_iap_purchase: boolean;
				is_locked: boolean;
				is_refundable: boolean;
				refund_period_in_days: number;
				is_renewable: boolean;
				is_renewal: boolean;
				has_private_registration: boolean;
				refund_amount: number;
				refund_integer: number;
				refund_currency_symbol: string;
				refund_text: string;
				refund_options: object | null;
				total_refund_amount: number;
				total_refund_integer: number;
				total_refund_currency: string;
				total_refund_text: string;
				check_dns: boolean;
			} >;
		};
		redBubbleAlerts: {
			'missing-connection'?: {
				type: string;
				is_error: boolean;
			};
			'welcome-banner-active'?: null;
			[ key: `${ string }-bad-installation` ]: {
				data: {
					plugin: string;
				};
			};
		};
		recommendedModules: {
			modules: JetpackModule[] | null;
			dismissed: boolean;
			isFirstRun: boolean;
		};
		themes: {
			[ key: string ]: {
				Author: string;
				Name: string;
				RequiresPHP: string;
				RequiresWP: string;
				Status: string;
				Template: string;
				TextDomain: string;
				ThemeURI: string;
				Version: string;
				active: boolean;
				is_block_theme: boolean;
			};
		};
		topJetpackMenuItemUrl: string;
		isAtomic: boolean;
		userIsAdmin: string;
		userIsNewToJetpack: string;
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
	myJetpackRest?: {
		apiRoot: string;
		apiNonce: string;
	};
}

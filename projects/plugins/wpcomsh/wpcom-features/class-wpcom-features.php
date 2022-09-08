<?php
/**
 * THIS FILE EXISTS VERBATIM IN WPCOM AND WPCOMSH.
 *
 * DANGER DANGER DANGER!!!
 * If you make any changes to this class you must MANUALLY update this file in both WPCOM and WPCOMSH.
 *
 * @package WPCOM_Features
 */

/**
 * Map features to purchases.
 */
class WPCOM_Features {
	/*
	 * Private const for every mapped purchase, sorted by product_id.
	 */
	private const SPACE_10GB                                  = '1gb_space_upgrade'; // 9
	private const SPACE_25GB                                  = '5gb_space_upgrade'; // 10
	private const SPACE_50GB                                  = '10gb_space_upgrade'; // 11
	private const NO_ADS                                      = 'no-adverts/no-adverts.php'; // 12
	private const WPCOM_VIDEOPRESS                            = 'videopress'; // 15
	private const SPACE_100GB                                 = '50gb_space_upgrade'; // 19
	private const SPACE_200GB                                 = '100gb_space_upgrade'; // 20
	private const SPACE_3GB                                   = '3gb_space_upgrade'; // 21
	private const WPCOM_CUSTOM_DESIGN                         = 'custom-design'; // 45
	private const WPCOM_VIDEOPRESS_PRO                        = 'videopress-pro'; // 47
	private const WPCOM_UNLIMITED_THEMES                      = 'unlimited_themes'; // 49
	private const GAPPS                                       = 'gapps'; // 69
	private const GAPPS_UNLIMITED                             = 'gapps_unlimited'; // 70
	private const WP_TITAN_MAIL_MONTHLY                       = 'wp_titan_mail_monthly'; // 400
	private const WP_TITAN_MAIL_YEARLY                        = 'wp_titan_mail_yearly'; // 401
	private const WP_GOOGLE_WORKSPACE_BUSINESS_STARTER_YEARLY = 'wp_google_workspace_business_starter_yearly'; // 690
	private const WPCOM_SEARCH                                = 'wpcom_search'; // 800
	private const WPCOM_SEARCH_MONTHLY                        = 'wpcom_search_monthly'; // 801
	private const YOAST_PREMIUM                               = 'yoast_premium'; // 900
	private const VALUE_BUNDLE                                = 'value_bundle'; // 1003
	private const BUNDLE_PRO                                  = 'bundle_pro'; // 1004
	private const BUNDLE_SUPER                                = 'bundle_super'; // 1005
	private const BUNDLE_ENTERPRISE                           = 'wpcom-enterprise'; // 1007
	private const BUSINESS_BUNDLE                             = 'business-bundle'; // 1008
	private const PERSONAL_BUNDLE                             = 'personal-bundle'; // 1009
	private const BLOGGER_BUNDLE                              = 'blogger-bundle'; // 1010
	private const ECOMMERCE_BUNDLE                            = 'ecommerce-bundle'; // 1011
	private const VALUE_BUNDLE_MONTHLY                        = 'value_bundle_monthly'; // 1013
	private const PRO_PLAN_MONTHLY                            = 'pro-plan-monthly'; // 1034
	private const BUSINESS_BUNDLE_MONTHLY                     = 'business-bundle-monthly'; // 1018
	private const PERSONAL_BUNDLE_MONTHLY                     = 'personal-bundle-monthly'; // 1019
	private const ECOMMERCE_BUNDLE_MONTHLY                    = 'ecommerce-bundle-monthly'; // 1021
	private const VALUE_BUNDLE_2Y                             = 'value_bundle-2y'; // 1023
	private const BUSINESS_BUNDLE_2Y                          = 'business-bundle-2y'; // 1028
	private const PERSONAL_BUNDLE_2Y                          = 'personal-bundle-2y'; // 1029
	private const BLOGGER_BUNDLE_2Y                           = 'blogger-bundle-2y'; // 1030
	private const ECOMMERCE_BUNDLE_2Y                         = 'ecommerce-bundle-2y'; // 1031
	private const PRO_PLAN_2Y                                 = 'pro-plan-2y'; // 1035
	private const PRO_PLAN                                    = 'pro-plan'; // 1032
	private const STARTER_PLAN                                = 'starter-plan'; // 1033
	private const WP_P2_PLUS_MONTHLY                          = 'wp_p2_plus_monthly'; // 1040
	private const JETPACK_PREMIUM                             = 'jetpack_premium'; // 2000
	private const JETPACK_BUSINESS                            = 'jetpack_business'; // 2001
	private const JETPACK_FREE                                = 'jetpack_free'; // 2002
	private const JETPACK_PREMIUM_MONTHLY                     = 'jetpack_premium_monthly'; // 2003
	private const JETPACK_BUSINESS_MONTHLY                    = 'jetpack_business_monthly'; // 2004
	private const JETPACK_PERSONAL                            = 'jetpack_personal'; // 2005
	private const JETPACK_PERSONAL_MONTHLY                    = 'jetpack_personal_monthly'; // 2006
	private const JETPACK_SECURITY_DAILY                      = 'jetpack_security_daily'; // 2010
	private const JETPACK_SECURITY_DAILY_MONTHLY              = 'jetpack_security_daily_monthly'; // 2011
	private const JETPACK_SECURITY_REALTIME                   = 'jetpack_security_realtime'; // 2012
	private const JETPACK_SECURITY_REALTIME_MONTHLY           = 'jetpack_security_realtime_monthly'; // 2013
	private const JETPACK_COMPLETE                            = 'jetpack_complete'; // 2014
	private const JETPACK_COMPLETE_MONTHLY                    = 'jetpack_complete_monthly'; // 2015
	private const JETPACK_SECURITY_T1_YEARLY                  = 'jetpack_security_t1_yearly'; // 2016
	private const JETPACK_SECURITY_T1_MONTHLY                 = 'jetpack_security_t1_monthly'; // 2017
	private const JETPACK_SECURITY_T2_YEARLY                  = 'jetpack_security_t2_yearly'; // 2019
	private const JETPACK_SECURITY_T2_MONTHLY                 = 'jetpack_security_t2_monthly'; // 2020
	private const JETPACK_BACKUP_DAILY                        = 'jetpack_backup_daily'; // 2100
	private const JETPACK_BACKUP_DAILY_MONTHLY                = 'jetpack_backup_daily_monthly'; // 2101
	private const JETPACK_BACKUP_REALTIME                     = 'jetpack_backup_realtime'; // 2102
	private const JETPACK_BACKUP_REALTIME_MONTHLY             = 'jetpack_backup_realtime_monthly'; // 2103
	private const JETPACK_SEARCH                              = 'jetpack_search'; // 2104
	private const JETPACK_SEARCH_MONTHLY                      = 'jetpack_search_monthly'; // 2105
	private const JETPACK_SCAN                                = 'jetpack_scan'; // 2106
	private const JETPACK_SCAN_MONTHLY                        = 'jetpack_scan_monthly'; // 2107
	private const JETPACK_SCAN_REALTIME                       = 'jetpack_scan_realtime'; // 2108
	private const JETPACK_SCAN_REALTIME_MONTHLY               = 'jetpack_scan_realtime_monthly'; // 2109
	private const JETPACK_ANTI_SPAM                           = 'jetpack_anti_spam'; // 2110
	private const JETPACK_ANTI_SPAM_MONTHLY                   = 'jetpack_anti_spam_monthly'; // 2111
	private const JETPACK_BACKUP_T1_YEARLY                    = 'jetpack_backup_t1_yearly'; // 2112
	private const JETPACK_BACKUP_T1_MONTHLY                   = 'jetpack_backup_t1_monthly'; // 2113
	private const JETPACK_BACKUP_T2_YEARLY                    = 'jetpack_backup_t2_yearly'; // 2114
	private const JETPACK_BACKUP_T2_MONTHLY                   = 'jetpack_backup_t2_monthly'; // 2115
	private const JETPACK_VIDEOPRESS                          = 'jetpack_videopress'; // 2116
	private const JETPACK_VIDEOPRESS_MONTHLY                  = 'jetpack_videopress_monthly'; // 2117
	private const JETPACK_BACKUP_T0_YEARLY                    = 'jetpack_backup_t0_yearly'; // 2120
	private const JETPACK_BACKUP_T0_MONTHLY                   = 'jetpack_backup_t0_monthly'; // 2121
	private const JETPACK_BACKUP_ONE_TIME                     = 'jetpack_backup_one_time'; // 2201
	private const AKISMET_PLUS_MONTHLY                        = 'ak_plus_monthly'; // 2301
	private const AKISMET_PLUS_YEARLY                         = 'ak_plus_yearly'; // 2302
	private const AKISMET_ENTERPRISE_MONTHLY                  = 'ak_ent_monthly'; // 2303
	private const AKISMET_ENTERPRISE_YEARLY                   = 'ak_ent_yearly'; // 2304
	private const AKISMET_ENTERPRISE_350K_MONTHLY             = 'ak_ep350k_monthly'; // 2305
	private const AKISMET_ENTERPRISE_350K_YEARLY              = 'ak_ep350k_yearly'; // 2306
	private const AKISMET_ENTERPRISE_2M_MONTHLY               = 'ak_ep2m_monthly'; // 2307
	private const AKISMET_ENTERPRISE_2M_YEARLY                = 'ak_ep2m_yearly'; // 2308
	private const JETPACK_BOOST                               = 'jetpack_boost_yearly'; // 2401
	private const JETPACK_BOOST_MONTHLY                       = 'jetpack_boost_monthly'; // 2400
	private const JETPACK_SOCIAL_BASIC_MONTHLY_LEGACY         = 'jetpack_social_monthly'; // 2500
	private const JETPACK_SOCIAL_BASIC                        = 'jetpack_social_basic'; // 2503
	private const JETPACK_SOCIAL_BASIC_MONTHLY                = 'jetpack_social_basic_monthly'; // 2504

	// WPCOM "Level 2": Groups of level 1s.
	private const WPCOM_BLOGGER_PLANS       = array( self::BLOGGER_BUNDLE, self::BLOGGER_BUNDLE_2Y );
	private const WPCOM_PERSONAL_PLANS      = array( self::PERSONAL_BUNDLE, self::PERSONAL_BUNDLE_MONTHLY, self::PERSONAL_BUNDLE_2Y );
	private const WPCOM_STARTER_PLANS       = array( self::STARTER_PLAN );
	private const WPCOM_PREMIUM_PLANS       = array( self::BUNDLE_PRO, self::VALUE_BUNDLE, self::VALUE_BUNDLE_MONTHLY, self::VALUE_BUNDLE_2Y );
	private const WPCOM_PRO_PLANS           = array( self::PRO_PLAN, self::PRO_PLAN_MONTHLY, self::PRO_PLAN_2Y );
	private const WPCOM_BUSINESS_PLANS      = array( self::BUSINESS_BUNDLE, self::BUSINESS_BUNDLE_MONTHLY, self::BUSINESS_BUNDLE_2Y );
	private const WPCOM_ECOMMERCE_PLANS     = array( self::ECOMMERCE_BUNDLE, self::ECOMMERCE_BUNDLE_MONTHLY, self::ECOMMERCE_BUNDLE_2Y );
	private const GOOGLE_WORKSPACE_PRODUCTS = array( self::WP_GOOGLE_WORKSPACE_BUSINESS_STARTER_YEARLY );
	private const GSUITE_PRODUCTS           = array( self::GAPPS, self::GAPPS_UNLIMITED );
	private const WPCOM_TITAN_MAIL_PRODUCTS = array( self::WP_TITAN_MAIL_MONTHLY, self::WP_TITAN_MAIL_YEARLY );

	// WPCOM "Level 3": Groups of level 2s.
	private const WPCOM_BLOGGER_AND_HIGHER_PLANS  = array( self::WPCOM_BLOGGER_PLANS, self::WPCOM_PERSONAL_PLANS, self::WPCOM_STARTER_PLANS, self::WPCOM_PREMIUM_PLANS, self::WPCOM_PRO_PLANS, self::WPCOM_BUSINESS_PLANS, self::WPCOM_ECOMMERCE_PLANS );
	private const WPCOM_PERSONAL_AND_HIGHER_PLANS = array( self::WPCOM_PERSONAL_PLANS, self::WPCOM_STARTER_PLANS, self::WPCOM_PREMIUM_PLANS, self::WPCOM_PRO_PLANS, self::WPCOM_BUSINESS_PLANS, self::WPCOM_ECOMMERCE_PLANS );
	private const WPCOM_STARTER_AND_HIGHER_PLANS  = array( self::WPCOM_STARTER_PLANS, self::WPCOM_PREMIUM_PLANS, self::WPCOM_PRO_PLANS, self::WPCOM_BUSINESS_PLANS, self::WPCOM_ECOMMERCE_PLANS );
	private const WPCOM_PREMIUM_AND_HIGHER_PLANS  = array( self::WPCOM_PREMIUM_PLANS, self::WPCOM_PRO_PLANS, self::WPCOM_BUSINESS_PLANS, self::WPCOM_ECOMMERCE_PLANS );
	private const WPCOM_BUSINESS_AND_HIGHER_PLANS = array( self::WPCOM_BUSINESS_PLANS, self::WPCOM_ECOMMERCE_PLANS );
	private const WPCOM_EMAIL_PRODUCTS            = array( self::GOOGLE_WORKSPACE_PRODUCTS, self::GSUITE_PRODUCTS, self::WPCOM_TITAN_MAIL_PRODUCTS );

	// Jetpack "Level 2": Groups of level 1s.
	private const JETPACK_BUSINESS_PLANS = array( self::JETPACK_BUSINESS, self::JETPACK_BUSINESS_MONTHLY );
	private const JETPACK_PREMIUM_PLANS  = array( self::JETPACK_PREMIUM, self::JETPACK_PREMIUM_MONTHLY );
	private const JETPACK_PERSONAL_PLANS = array( self::JETPACK_PERSONAL, self::JETPACK_PERSONAL_MONTHLY );
	private const JETPACK_COMPLETE_PLANS = array( self::JETPACK_COMPLETE, self::JETPACK_COMPLETE_MONTHLY );

	private const JETPACK_SECURITY_DAILY_PLANS    = array( self::JETPACK_SECURITY_DAILY, self::JETPACK_SECURITY_DAILY_MONTHLY );
	private const JETPACK_SECURITY_REALTIME_PLANS = array( self::JETPACK_SECURITY_REALTIME, self::JETPACK_SECURITY_REALTIME_MONTHLY );
	private const JETPACK_SECURITY_T1_PLANS       = array( self::JETPACK_SECURITY_T1_MONTHLY, self::JETPACK_SECURITY_T1_YEARLY );
	private const JETPACK_SECURITY_T2_PLANS       = array( self::JETPACK_SECURITY_T2_MONTHLY, self::JETPACK_SECURITY_T2_YEARLY );

	private const JETPACK_SCAN_PLANS = array( self::JETPACK_SCAN, self::JETPACK_SCAN_MONTHLY, self::JETPACK_SCAN_REALTIME, self::JETPACK_SCAN_REALTIME_MONTHLY );

	private const JETPACK_BACKUP_DAILY_PLANS    = array( self::JETPACK_BACKUP_DAILY, self::JETPACK_BACKUP_DAILY_MONTHLY );
	private const JETPACK_BACKUP_REALTIME_PLANS = array( self::JETPACK_BACKUP_REALTIME, self::JETPACK_BACKUP_REALTIME_MONTHLY );
	private const JETPACK_BACKUP_T0_PLANS       = array( self::JETPACK_BACKUP_T0_MONTHLY, self::JETPACK_BACKUP_T0_YEARLY );
	private const JETPACK_BACKUP_T1_PLANS       = array( self::JETPACK_BACKUP_T1_MONTHLY, self::JETPACK_BACKUP_T1_YEARLY );
	private const JETPACK_BACKUP_T2_PLANS       = array( self::JETPACK_BACKUP_T2_MONTHLY, self::JETPACK_BACKUP_T2_YEARLY );

	// Jetpack "Level 3": Groups of level 2.
	private const JETPACK_PERSONAL_AND_HIGHER = array(
		self::JETPACK_PERSONAL_PLANS,
		self::JETPACK_PREMIUM_PLANS,
		self::JETPACK_BUSINESS_PLANS,
		self::JETPACK_COMPLETE_PLANS,
		self::JETPACK_SECURITY_DAILY_PLANS,
		self::JETPACK_SECURITY_REALTIME_PLANS,
		self::JETPACK_SECURITY_T1_PLANS,
		self::JETPACK_SECURITY_T2_PLANS,
	);
	private const JETPACK_PREMIUM_AND_HIGHER  = array(
		self::JETPACK_PREMIUM_PLANS,
		self::JETPACK_BUSINESS_PLANS,
		self::JETPACK_COMPLETE_PLANS,
		self::JETPACK_SECURITY_DAILY_PLANS,
		self::JETPACK_SECURITY_REALTIME_PLANS,
		self::JETPACK_SECURITY_T1_PLANS,
		self::JETPACK_SECURITY_T2_PLANS,
	);

	private const AKISMET_PLANS = array(
		self::AKISMET_PLUS_MONTHLY,
		self::AKISMET_PLUS_YEARLY,
		self::AKISMET_ENTERPRISE_MONTHLY,
		self::AKISMET_ENTERPRISE_YEARLY,
		self::AKISMET_ENTERPRISE_350K_MONTHLY,
		self::AKISMET_ENTERPRISE_350K_YEARLY,
		self::AKISMET_ENTERPRISE_2M_MONTHLY,
		self::AKISMET_ENTERPRISE_2M_YEARLY,
	);

	// Features automatically granted to all sites regardless of their purchases are mapped to these constants.
	private const WPCOM_ALL_SITES   = 'wpcom-all-sites';
	private const JETPACK_ALL_SITES = 'jetpack-all-sites';

	/*
	 * Public const for every mapped feature, sorted alphabetically.
	 */
	public const AD_CREDIT_VOUCHERS            = 'ad-credit';
	public const ADVANCED_SEO                  = 'advanced-seo';
	public const AKISMET                       = 'akismet';
	public const ANTISPAM                      = 'antispam';
	public const ARTIFICIAL_50GB_STORAGE_LIMIT = 'artificial-50gb-storage-limit';
	public const ATOMIC                        = 'atomic';
	public const BACKUPS                       = 'backups';
	public const BACKUPS_DAILY                 = 'backups-daily';
	public const BACKUPS_RESTORE               = 'restore';
	public const BACKUP_ONE_TIME               = 'backup-one-time';
	public const BLOG_DOMAIN_ONLY              = 'blog-domain-only';
	public const CALENDLY                      = 'calendly';
	public const CDN                           = 'cdn';
	public const CLASSIC_SEARCH                = 'search';
	public const CLOUD_CRITICAL_CSS            = 'cloud-critical-css';
	public const CLOUDFLARE_ANALYTICS          = 'cloudflare-analytics';
	public const CLOUDFLARE_CDN                = 'cloudflare-cdn';
	public const CONCIERGE                     = 'concierge';
	public const CONCIERGE_BUSINESS            = 'concierge-business';
	public const CORE_AUDIO                    = 'core/audio';
	public const CORE_COVER                    = 'core/cover';
	public const CORE_VIDEO                    = 'core/video';
	public const CREDIT_VOUCHERS               = 'credit-vouchers';
	public const CUSTOM_DESIGN                 = 'custom-design';
	public const CUSTOM_DOMAIN                 = 'custom-domain';
	public const DOMAIN_MAPPING                = 'domain-mapping';
	public const DONATIONS                     = 'donations';
	public const ECOMMERCE_MANAGED_PLUGINS     = 'ecommerce-managed-plugins';
	public const EMAIL_PROFESSIONAL            = 'email-professional';
	public const EMAIL_SUBSCRIPTION            = 'email-subscription';
	public const EMAIL_UNLIMITED_FORWARDS      = 'email-unlimited-forwards';
	public const FREE_BLOG                     = 'free-blog';
	public const FULL_ACTIVITY_LOG             = 'full-activity-log';
	public const GLOBAL_STYLES                 = 'global-styles';
	public const GOOGLE_ANALYTICS              = 'google-analytics';
	public const GOOGLE_MY_BUSINESS            = 'google-my-business';
	public const INSTALL_PLUGINS               = 'install-plugins';
	public const INSTALL_PURCHASED_PLUGINS     = 'install-purchased-plugins';
	public const INSTALL_THEMES                = 'install-themes';
	public const INSTANT_SEARCH                = 'instant-search';
	public const JETPACK_DASHBOARD             = 'jetpack-dashboard';
	public const LIVE_SUPPORT                  = 'live_support';
	public const MANAGE_PLUGINS                = 'manage-plugins';
	public const NO_ADVERTS_NO_ADVERTS_PHP     = 'no-adverts/no-adverts.php';
	public const NO_WPCOM_BRANDING             = 'no-wpcom-branding';
	public const OPENTABLE                     = 'opentable';
	public const OPTIONS_PERMALINK             = 'options-permalink';
	public const PAYMENTS                      = 'payments';
	public const POLLDADDY                     = 'polldaddy';
	public const PREMIUM_CONTENT_CONTAINER     = 'premium-content/container';
	public const PREMIUM_THEMES                = 'premium-themes';
	public const PRIORITY_SUPPORT              = 'priority_support';
	public const PRIVATE_WHOIS                 = 'private_whois';
	public const REAL_TIME_BACKUPS             = 'real-time-backups';
	public const RECURRING_PAYMENTS            = 'recurring-payments';
	public const REPUBLICIZE                   = 'republicize';
	public const SCAN                          = 'scan';
	public const SCAN_MANAGED                  = 'scan-managed';
	public const SECURITY_SETTINGS             = 'security-settings';
	public const SEO_PREVIEW_TOOLS             = 'seo-preview-tools';
	public const SEND_A_MESSAGE                = 'send-a-message';
	public const SET_PRIMARY_CUSTOM_DOMAIN     = 'set-primary-custom-domain';
	public const SFTP                          = 'sftp';
	public const SIMPLE_PAYMENTS               = 'simple-payments';
	public const SOCIAL_PREVIEWS               = 'social-previews';
	public const SOCIAL_SHARES_1000            = 'social-shares-1000';
	public const SPACE                         = 'space';
	public const SPACE_UPGRADED_STORAGE        = 'space-upgraded-storage';
	public const SSH                           = 'ssh';
	public const SUBSCRIBER_UNLIMITED_IMPORTS  = 'subscriber-unlimited-imports';
	public const SUPPORT                       = 'support';
	public const UPGRADED_UPLOAD_FILETYPES     = 'upgraded_upload_filetypes';
	public const UPLOAD_AUDIO_FILES            = 'upload-audio-files';
	public const UPLOAD_PLUGINS                = 'upload-plugins';
	public const UPLOAD_SPACE_3GB              = 'upload-space-3gb';
	public const UPLOAD_SPACE_10GB             = 'upload-space-10gb';
	public const UPLOAD_SPACE_25GB             = 'upload-space-25gb';
	public const UPLOAD_SPACE_50GB             = 'upload-space-50gb';
	public const UPLOAD_SPACE_100GB            = 'upload-space-100gb';
	public const UPLOAD_SPACE_200GB            = 'upload-space-200gb';
	public const UPLOAD_SPACE_UNLIMITED        = 'upload-space-unlimited';
	public const UPLOAD_THEMES                 = 'upload-themes';
	public const UPLOAD_VIDEO_FILES            = 'upload-video-files';
	public const VAULTPRESS_AUTOMATED_RESTORES = 'vaultpress-automated-restores';
	public const VAULTPRESS_BACKUP_ARCHIVE     = 'vaultpress-backup-archive';
	public const VAULTPRESS_BACKUPS            = 'vaultpress-backups';
	public const VAULTPRESS_SECURITY_SCANNING  = 'vaultpress-security-scanning';
	public const VAULTPRESS_STORAGE_SPACE      = 'vaultpress-storage-space';
	public const VIDEO_HOSTING                 = 'video-hosting';
	public const VIDEOPRESS                    = 'videopress';
	public const VIDEOPRESS_1TB_STORAGE        = 'videopress-1tb-storage';
	public const VIDEOPRESS_UNLIMITED_STORAGE  = 'videopress-unlimited-storage';
	public const WHATSAPP_BUTTON               = 'whatsapp-button';
	public const WOOP                          = 'woop';
	public const WORDADS                       = 'wordads';
	public const WORDADS_JETPACK               = 'wordads-jetpack';

	/*
	 * Private const array of features with sub-array of purchases that include that feature. Sorted alphabetically.
	 */
	private const FEATURES_MAP = array(
		self::AD_CREDIT_VOUCHERS            => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		/*
		 * ADVANCED_SEO - Called seo-tools in Jetpack.
		 *
		 * Active for:
		 * - Simple and Atomic sites with Business or up plan.
		 * - Jetpack sites with any plan.
		 * - Not VIP sites.
		 */
		self::ADVANCED_SEO                  => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),
		self::AKISMET                       => array(
			self::AKISMET_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::WPCOM_ALL_SITES,
		),
		self::ANTISPAM                      => array(
			self::JETPACK_ANTI_SPAM,
			self::JETPACK_ANTI_SPAM_MONTHLY,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		/*
		 * Temporary limit until the Pro plan storage is ready to be fully
		 * implemented.
		 */
		self::ARTIFICIAL_50GB_STORAGE_LIMIT => array(
			self::WPCOM_PRO_PLANS,
		),
		self::ATOMIC                        => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			array( 'product_type' => array( 'marketplace_plugin' ) ),
		),
		// BACKUPS - Site has *any* kind of backups.
		self::BACKUPS                       => array(
			self::JETPACK_BACKUP_DAILY_PLANS,
			self::JETPACK_BACKUP_ONE_TIME,
			self::JETPACK_BACKUP_REALTIME_PLANS,
			self::JETPACK_BACKUP_T0_PLANS,
			self::JETPACK_BACKUP_T1_PLANS,
			self::JETPACK_BACKUP_T2_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		// BACKUPS_DAILY - Site has product that includes daily backups.
		self::BACKUPS_DAILY                 => array(
			self::JETPACK_BACKUP_DAILY_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::JETPACK_SECURITY_DAILY_PLANS,
		),
		self::BACKUPS_RESTORE               => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		/*
		 * BACKUP_ONE_TIME - Site has purchased a one-time backup.
		 * Note the jetpack_backup_one_time product never expires. So any feature gated with BACKUP_ONE_TIME will
		 * likewise, never expire.
		 */
		self::BACKUP_ONE_TIME               => array(
			self::JETPACK_BACKUP_ONE_TIME,
		),
		// BLOG_DOMAIN_ONLY - Users on Blogger plan can only purchase .blog domains.
		self::BLOG_DOMAIN_ONLY              => array(
			self::WPCOM_BLOGGER_PLANS,
		),
		self::CALENDLY                      => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_PREMIUM_PLANS,
			self::WP_P2_PLUS_MONTHLY,
		),
		self::CDN                           => array(
			self::JETPACK_ALL_SITES,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::CLASSIC_SEARCH                => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::JETPACK_SEARCH,
			self::JETPACK_SEARCH_MONTHLY,
			self::JETPACK_COMPLETE_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::WPCOM_SEARCH,
			self::WPCOM_SEARCH_MONTHLY,
			self::WP_P2_PLUS_MONTHLY,
		),
		self::CLOUD_CRITICAL_CSS            => array(
			self::JETPACK_BOOST,
			self::JETPACK_BOOST_MONTHLY,
			self::JETPACK_COMPLETE_PLANS,
		),
		self::CLOUDFLARE_ANALYTICS          => array(
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::CLOUDFLARE_CDN                => array(
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::CONCIERGE                     => array(
			self::WPCOM_BUSINESS_PLANS,
			self::WPCOM_ECOMMERCE_PLANS,
		),
		self::CONCIERGE_BUSINESS            => array(
			self::WPCOM_BUSINESS_PLANS,
		),
		// CORE_AUDIO - core/audio requires a paid plan for uploading audio files.
		self::CORE_AUDIO                    => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
		),
		// CORE_COVER - core/cover requires a paid plan for uploading video files.
		self::CORE_COVER                    => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_PREMIUM_PLANS,
		),
		// CORE_VIDEO - core/video requires a paid plan.
		self::CORE_VIDEO                    => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_PREMIUM_PLANS,
		),
		self::CREDIT_VOUCHERS               => array(
			self::BUNDLE_PRO,
			self::BUNDLE_SUPER,
			self::BUNDLE_ENTERPRISE,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
		),
		self::CUSTOM_DESIGN                 => array(
			self::WPCOM_CUSTOM_DESIGN,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
		),
		self::CUSTOM_DOMAIN                 => array(
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
		),
		self::DOMAIN_MAPPING                => array(
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::DONATIONS                     => array(
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
		),
		// ECOMMERCE_MANAGED_PLUGINS - Can install the plugin bundle that comes with eCommerce plans.
		self::ECOMMERCE_MANAGED_PLUGINS     => array(
			self::WPCOM_ECOMMERCE_PLANS,
		),
		// EMAIL_PROFESSIONAL - Access to Titan email hosting, often referred to as WordPress.com "Professional Email".
		self::EMAIL_PROFESSIONAL            => array(
			self::WPCOM_TITAN_MAIL_PRODUCTS,
		),
		// EMAIL_SUBSCRIPTION - Represents having at least one product providing email.
		self::EMAIL_SUBSCRIPTION            => array(
			self::WPCOM_EMAIL_PRODUCTS,
		),
		self::EMAIL_UNLIMITED_FORWARDS      => array(
			self::BUNDLE_ENTERPRISE,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::FREE_BLOG                     => array(
			self::WPCOM_ALL_SITES,
		),
		self::FULL_ACTIVITY_LOG             => array(
			self::JETPACK_BACKUP_DAILY_PLANS,
			self::JETPACK_BACKUP_REALTIME_PLANS,
			self::JETPACK_BACKUP_T0_PLANS,
			self::JETPACK_BACKUP_T1_PLANS,
			self::JETPACK_BACKUP_T2_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::GLOBAL_STYLES                 => array(
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
		),
		self::GOOGLE_ANALYTICS              => array(
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::WPCOM_STARTER_AND_HIGHER_PLANS,
		),
		self::GOOGLE_MY_BUSINESS            => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_SECURITY_REALTIME_PLANS,
			self::JETPACK_COMPLETE_PLANS,
			self::JETPACK_SECURITY_T1_PLANS,
			self::JETPACK_SECURITY_T2_PLANS,
		),
		self::INSTALL_PLUGINS               => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::INSTALL_PURCHASED_PLUGINS     => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::WPCOM_STARTER_PLANS,
		),
		self::INSTALL_THEMES                => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::INSTANT_SEARCH                => array(
			self::WPCOM_SEARCH,
			self::WPCOM_SEARCH_MONTHLY,
			self::WP_P2_PLUS_MONTHLY,
			self::JETPACK_SEARCH,
			self::JETPACK_SEARCH_MONTHLY,
			self::JETPACK_COMPLETE_PLANS,
		),
		self::JETPACK_DASHBOARD             => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),
		// LIVE_SUPPORT - Monthly plans do not get live support. p7DVsv-a9N-p2.
		self::LIVE_SUPPORT                  => array(
			// Premium (Excluding Monthly).
			self::BUNDLE_PRO,
			self::VALUE_BUNDLE,
			self::VALUE_BUNDLE_2Y,
			// Pro.
			self::PRO_PLAN,
			self::PRO_PLAN_2Y,
			// Business (Excluding Monthly).
			self::BUSINESS_BUNDLE,
			self::BUSINESS_BUNDLE_2Y,
			// Ecommerce (Excluding Monthly).
			self::ECOMMERCE_BUNDLE,
			self::ECOMMERCE_BUNDLE_2Y,
		),
		// MANAGE_PLUGINS - Atomic only feature. Can upload, install, and activate any 3rd party plugin.
		self::MANAGE_PLUGINS                => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),
		self::NO_ADVERTS_NO_ADVERTS_PHP     => array(
			self::NO_ADS,
			// Deliberately leaves out the Starter plan.
			self::WPCOM_BLOGGER_PLANS,
			self::WPCOM_PERSONAL_PLANS,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
		),
		// NO_WPCOM_BRANDING - Enable the ability to hide the WP.com branding in the site footer.
		self::NO_WPCOM_BRANDING             => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),
		self::OPENTABLE                     => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_PREMIUM_PLANS,
		),
		// OPTIONS_PERMALINK - Atomic only feature. Enables Settings -> Permalinks menu item & options-permalink page.
		self::OPTIONS_PERMALINK             => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),
		self::PAYMENTS                      => array(
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
		),
		self::POLLDADDY                     => array(
			self::JETPACK_BUSINESS_PLANS,
		),
		// PREMIUM_CONTENT_CONTAINER - premium-content requires a paid wpcom plan.
		self::PREMIUM_CONTENT_CONTAINER     => array(
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::WP_P2_PLUS_MONTHLY,
		),
		self::PREMIUM_THEMES                => array(
			self::WPCOM_UNLIMITED_THEMES,
			self::BUNDLE_ENTERPRISE,
			self::WPCOM_PRO_PLANS,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
		),
		self::PRIORITY_SUPPORT              => array(
			self::JETPACK_BACKUP_T1_PLANS,
			self::JETPACK_BACKUP_T2_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::PRIVATE_WHOIS                 => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
		),
		self::REAL_TIME_BACKUPS             => array(
			self::JETPACK_BACKUP_REALTIME_PLANS,
			self::JETPACK_BACKUP_T0_PLANS,
			self::JETPACK_BACKUP_T1_PLANS,
			self::JETPACK_BACKUP_T2_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_COMPLETE_PLANS,
			self::JETPACK_SECURITY_REALTIME_PLANS,
			self::JETPACK_SECURITY_T1_PLANS,
			self::JETPACK_SECURITY_T2_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::RECURRING_PAYMENTS            => array(
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
		),

		/*
		 * REPUBLICIZE
		 *
		 * Active for:
		 * - Simple and Atomic sites with Premium or up plan.
		 * - Jetpack sites with Premium or up plan.
		 */
		self::REPUBLICIZE                   => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_PREMIUM_AND_HIGHER,
		),
		self::SCAN                          => array(
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::JETPACK_SCAN_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		/*
		 * SCAN_MANAGED - Scan results are managed internally by Atomic guild HEs and not shown in user UI.
		 * See D57207-code.
		 */
		self::SCAN_MANAGED                  => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		/*
		 * SECURITY_SETTINGS - Initially added to determine whether to show /settings/security.
		 * More info: https://github.com/Automattic/wp-calypso/issues/51820
		 *
		 * Active for:
		 * - Simple and Atomic sites with Business or up plan.
		 * - Jetpack sites with any plan.
		 */
		self::SECURITY_SETTINGS             => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),
		self::SEO_PREVIEW_TOOLS             => array(
			self::BUNDLE_ENTERPRISE,
			self::JETPACK_ALL_SITES,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::SEND_A_MESSAGE                => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),

		/*
		 * SET_PRIMARY_CUSTOM_DOMAIN - Set custom domain as primary.
		 * It allows to set a custom domain of the site as primary.
		 *
		 * Active for:
		 * - Simple and Atomic sites with any standard WordPress.com plan
		 */
		self::SET_PRIMARY_CUSTOM_DOMAIN     => array(
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
			self::YOAST_PREMIUM,
		),
		// Hosting Configuration.
		self::SFTP                          => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		self::SSH                           => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),
		self::SIMPLE_PAYMENTS               => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_PREMIUM_AND_HIGHER,
		),
		self::SOCIAL_PREVIEWS               => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),

		/*
		 * SOCIAL_SHARES_1000 - This feature is linked to the ability to share upto 1000 social media shares on the Jetpack Social Plugin.
		 *
		 */
		self::SOCIAL_SHARES_1000            => array(
			self::JETPACK_SOCIAL_BASIC_MONTHLY,
			self::JETPACK_SOCIAL_BASIC_MONTHLY_LEGACY,
			self::JETPACK_SOCIAL_BASIC,
		),

		self::SPACE                         => array(
			self::WPCOM_ALL_SITES,
		),

		/*
		 * Products that have upgraded storage space on WordPress.com, beyond
		 * the bare minimum advertised for free sites. This list includes all
		 * WordPress.com plans and space upgrade products.
		 */
		self::SPACE_UPGRADED_STORAGE        => array(
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
			self::BUNDLE_SUPER,
			self::BUNDLE_ENTERPRISE,
			self::WP_P2_PLUS_MONTHLY,
			self::SPACE_3GB,
			self::SPACE_10GB,
			self::SPACE_25GB,
			self::SPACE_50GB,
			self::SPACE_100GB,
			self::SPACE_200GB,
		),

		// Importing subscribers to the site without limits.
		self::SUBSCRIBER_UNLIMITED_IMPORTS  => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
		),

		// SUPPORT - Everybody needs somebody.
		self::SUPPORT                       => array(
			self::WPCOM_ALL_SITES,
			self::JETPACK_PERSONAL_AND_HIGHER,
		),
		self::UPGRADED_UPLOAD_FILETYPES     => array(
			self::SPACE_3GB,
			self::SPACE_10GB,
			self::SPACE_25GB,
			self::SPACE_50GB,
			self::SPACE_100GB,
			self::SPACE_200GB,
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
			self::WP_P2_PLUS_MONTHLY,
		),
		self::UPLOAD_AUDIO_FILES            => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),
		self::UPLOAD_PLUGINS                => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::UPLOAD_SPACE_3GB              => array(
			self::SPACE_3GB,
		),
		self::UPLOAD_SPACE_10GB             => array(
			self::SPACE_10GB,
		),
		self::UPLOAD_SPACE_25GB             => array(
			self::SPACE_25GB,
		),
		self::UPLOAD_SPACE_50GB             => array(
			self::SPACE_50GB,
		),
		self::UPLOAD_SPACE_100GB            => array(
			self::SPACE_100GB,
		),
		self::UPLOAD_SPACE_200GB            => array(
			self::SPACE_200GB,
		),
		self::UPLOAD_SPACE_UNLIMITED        => array(
			array(
				'before' => '2019-08-01',
				self::WPCOM_BUSINESS_PLANS,
				self::WPCOM_ECOMMERCE_PLANS,
			),
		),
		self::UPLOAD_THEMES                 => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		/*
		 * UPLOAD_VIDEO_FILES - This feature is linked to the ability to upload video files to the website.
		 *
		 * Active for:
		 * - Simple and Atomic sites with Premium or up plan.
		 * - Jetpack sites with any plan.
		 */
		self::UPLOAD_VIDEO_FILES            => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),

		self::VAULTPRESS_AUTOMATED_RESTORES => array(
			self::JETPACK_PREMIUM_PLANS,
			self::JETPACK_BUSINESS_PLANS,
		),
		self::VAULTPRESS_BACKUP_ARCHIVE     => array(
			self::JETPACK_PREMIUM_PLANS,
			self::JETPACK_BUSINESS_PLANS,
		),
		self::VAULTPRESS_BACKUPS            => array(
			self::JETPACK_PERSONAL_AND_HIGHER,
		),
		self::VAULTPRESS_SECURITY_SCANNING  => array(
			self::JETPACK_BUSINESS_PLANS,
		),
		self::VAULTPRESS_STORAGE_SPACE      => array(
			self::JETPACK_PREMIUM_PLANS,
			self::JETPACK_BUSINESS_PLANS,
		),

		/*
		 * VIDEO_HOSTING - Host video effortlessly and deliver it at high speeds to your viewers.
		 * https://jetpack.com/features/design/video-hosting/
		 *
		 * Active for:
		 * - Simple and Atomic sites with Premium or up plan.
		 * - Jetpack sites with Premium or up plan.
		 */
		self::VIDEO_HOSTING                 => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_PREMIUM_AND_HIGHER,
		),
		self::VIDEOPRESS                    => array(
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_COMPLETE_PLANS,
			self::JETPACK_PERSONAL_PLANS,
			self::JETPACK_PREMIUM_PLANS,
			self::JETPACK_VIDEOPRESS,
			self::JETPACK_VIDEOPRESS_MONTHLY,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::WPCOM_VIDEOPRESS,
			self::WPCOM_VIDEOPRESS_PRO,
			self::WP_P2_PLUS_MONTHLY,
			array(
				'before' => '2021-10-07',
				self::JETPACK_SECURITY_DAILY_PLANS,
				self::JETPACK_SECURITY_REALTIME_PLANS,
				self::JETPACK_SECURITY_T1_PLANS,
				self::JETPACK_SECURITY_T2_PLANS,
			),
		),

		/*
		 * Note: VIDEOPRESS_1TB_STORAGE and VIDEOPRESS_UNLIMITED_STORAGE are
		 * currently only checked on standalone Jetpack sites.
		 * For example, adding VIDEOPRESS_UNLIMITED_STORAGE to a WP.com plan
		 * will not provide it with unlimited VideoPress storage.
		 *
		 * All WoA VIDEOPRESS sites currently get 2TB storage on their cache
		 * site for VideoPress.
		 */
		self::VIDEOPRESS_1TB_STORAGE        => array(
			array(
				self::JETPACK_COMPLETE_PLANS,
				self::JETPACK_VIDEOPRESS,
				self::JETPACK_VIDEOPRESS_MONTHLY,
			),
		),
		self::VIDEOPRESS_UNLIMITED_STORAGE  => array(
			array(
				'before' => '2021-10-07',
				self::JETPACK_COMPLETE_PLANS,
				self::JETPACK_SECURITY_DAILY_PLANS,
				self::JETPACK_SECURITY_REALTIME_PLANS,
				self::JETPACK_SECURITY_T1_PLANS,
				self::JETPACK_SECURITY_T2_PLANS,
				self::JETPACK_PREMIUM_PLANS,
				self::JETPACK_BUSINESS_PLANS,
			),
		),
		self::WHATSAPP_BUTTON               => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),

		/*
		 * WOOP - WooCommerce on all Plans is available to install.
		 *
		 * Active for:
		 * - Simple and Atomic sites with Business or up plan.
		 * - Not Jetpack sites
		 */
		self::WOOP                          => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),
		self::WORDADS                       => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_PREMIUM_AND_HIGHER,
		),

		/*
		 * WORDADS_JETPACK - `wordads-jetpack` is maintained as a legacy alias of `wordads` which was used to gate
		 * the feature in old versions of Jetpack.
		 * @see https://github.com/Automattic/jetpack/blob/c4f8fe120e1286e85f49e20e0f7fe22e44641449/projects/plugins/jetpack/class.jetpack-plan.php#L330.
		 */
		self::WORDADS_JETPACK               => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_PREMIUM_AND_HIGHER,
		),
	);

	/**
	 * Checks whether the given feature is declared in our map.
	 *
	 * @param string $feature The feature to check.
	 *
	 * @return bool Whether the given feature exists.
	 */
	public static function feature_exists( $feature ) {
		return ! empty( self::FEATURES_MAP[ $feature ] );
	}

	/**
	 * Given a primitive type $needle, and an array $haystack, recursively
	 * search $haystack for an instance of $needle. If arrays are encountered,
	 * they will also be searched. Only strict comparisons are used.
	 *
	 * @param mixed $needle   What to look for.
	 * @param array $haystack Array of items to check, may contain other arrays.
	 *
	 * @return bool Is the needle in the haystack somewhere?
	 */
	public static function in_array_recursive( $needle, $haystack ) {
		foreach ( $haystack as $item ) {
			if ( is_array( $item ) ) {
				if ( self::in_array_recursive( $needle, $item ) ) {
					return true;
				}
			} elseif ( $item === $needle ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Given an array of $purchases and a single feature name, consult the FEATURES_MAP to determine if the feature
	 * is included in one of the $purchases.
	 *
	 * Use the function wpcom_site_has_feature( $feature ) to determine if a site has access to a certain feature.
	 *
	 * @param string $feature   A singular feature.
	 * @param array  $purchases A collection of purchases.
	 * @param string $site_type Site type to check. Can be 'wpcom' or 'jetpack'. Default empty string.
	 *
	 * @return bool Is the feature included in one of the purchases.
	 */
	public static function has_feature( $feature, $purchases, $site_type = '' ) {
		if ( ! self::feature_exists( $feature ) ) {
			return false;
		}

		$products_map = self::FEATURES_MAP[ $feature ];

		// Automatically grant features that don't require any purchase.
		if (
			( 'wpcom' === $site_type && in_array( self::WPCOM_ALL_SITES, $products_map, true ) ) ||
			( 'jetpack' === $site_type && in_array( self::JETPACK_ALL_SITES, $products_map, true ) )
		) {
			return true;
		}

		foreach ( $purchases as $purchase ) {
			if ( self::purchase_in_products_map( $purchase, $products_map ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * The products definition array ($products_map) may contain 1st-level sub-arrays with 'before' and/or 'after' keys
	 * used to restrict access to a feature based on when the purchase was made. If the $purchase is included in
	 * $products_map, and it was purchased within the defined date range (if a date range is defined), return true.
	 *
	 * @param object $purchase A single purchase.
	 * @param array  $products_map A feature map definition array.
	 *
	 * @return bool If the purchase is included in $products_map and meets any purchase date-range rules.
	 */
	public static function purchase_in_products_map( $purchase, $products_map ) {
		// Loop through the first level of the $products_map array to identify potential legacy feature date ranges.
		foreach ( $products_map as $product_definition ) {
			if ( ! empty( $product_definition['product_type'] ) ) {
				if ( in_array( $purchase->product_type, $product_definition['product_type'], true ) ) {
					return true;
				}
				continue;
			}

			$purchase_eligible_by_date = false;

			// If 'before' & 'after' are empty, this is not a legacy feature.
			if ( empty( $product_definition['before'] ) && empty( $product_definition['after'] ) ) {
				$purchase_eligible_by_date = true;
			} else {
				// If the date key is defined, set its variable to its Unix timestamp, else set invalid or undefined dates to false.
				$before          = isset( $product_definition['before'] ) ? strtotime( $product_definition['before'] ) : false;
				$after           = isset( $product_definition['after'] ) ? strtotime( $product_definition['after'] ) : false;
				$subscribed_date = isset( $purchase->subscribed_date ) ? strtotime( $purchase->subscribed_date ) : false;

				// Remove the date keys so $product_definition is clean for in_array_recursive search.
				unset( $product_definition['before'], $product_definition['after'] );

				// If 'before' or 'after', & the subscribed_date are valid, check if the legacy feature is available.
				if ( ( false !== $before || false !== $after ) && false !== $subscribed_date ) {
					if ( false !== $before && false !== $after ) {
						if (
							$subscribed_date >= $after &&
							$subscribed_date <= $before ) {
							$purchase_eligible_by_date = true;
						}
					} elseif ( false !== $before ) {
						if ( $subscribed_date <= $before ) {
							$purchase_eligible_by_date = true;
						}
					} elseif ( false !== $after ) {
						if ( $subscribed_date >= $after ) {
							$purchase_eligible_by_date = true;
						}
					}
				}
			}

			// If the date range hurtle is cleared, check if the purchase is included in the $product_definition.
			if ( $purchase_eligible_by_date ) {
				if ( self::in_array_recursive( $purchase->product_slug, array( $product_definition ) ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Return a list of all possible feature slugs.
	 *
	 * @return array An array of strings like 'premium-themes', one for each possible feature slug.
	 */
	public static function get_feature_slugs() {
		return array_keys( self::FEATURES_MAP );
	}
}

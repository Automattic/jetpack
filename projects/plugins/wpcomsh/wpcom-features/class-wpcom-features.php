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

	/**
	 * Key used to exclude plans from features.
	 */
	public const EXCLUDE_PLANS = 'exclude_plans';

	/*
	 * Private const for every mapped purchase, sorted by product_id.
	 */
	private const SPACE_1GB                                   = 'wordpress_com_1gb_space_addon_yearly';
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
	private const VALUE_BUNDLE_3Y                             = 'value_bundle-3y'; // 1043
	private const BUSINESS_BUNDLE_3Y                          = 'business-bundle-3y'; // 1048
	private const PERSONAL_BUNDLE_3Y                          = 'personal-bundle-3y'; // 1049
	private const ECOMMERCE_BUNDLE_3Y                         = 'ecommerce-bundle-3y'; // 1051
	private const PRO_PLAN_2Y                                 = 'pro-plan-2y'; // 1035
	private const PRO_PLAN                                    = 'pro-plan'; // 1032
	private const STARTER_PLAN                                = 'starter-plan'; // 1033
	private const WP_P2_PLUS_MONTHLY                          = 'wp_p2_plus_monthly'; // 1040
	private const ECOMMERCE_TRIAL_BUNDLE_MONTHLY              = 'ecommerce-trial-bundle-monthly'; // 1052
	private const WPCOM_WOOEXPRESS_MEDIUM_BUNDLE_MONTHLY      = 'wooexpress-medium-bundle-monthly'; // 1053
	private const WPCOM_WOOEXPRESS_MEDIUM_BUNDLE_YEARLY       = 'wooexpress-medium-bundle-yearly'; // 1055
	private const WPCOM_WOOEXPRESS_SMALL_BUNDLE_MONTHLY       = 'wooexpress-small-bundle-monthly'; // 1054
	private const WPCOM_WOOEXPRESS_SMALL_BUNDLE_YEARLY        = 'wooexpress-small-bundle-yearly'; // 1056
	private const WPCOM_MIGRATION_TRIAL_BUNDLE_MONTHLY        = 'wp_bundle_migration_trial_monthly'; // 1057
	private const WPCOM_HOSTING_TRIAL_BUNDLE_MONTHLY          = 'wp_bundle_hosting_trial_monthly'; // 1058
	private const WPCOM_STAGING_PRODUCT                       = 'wp_staging_site_lifetime'; // 1060
	private const WPCOM_HUNDRED_YEAR_BUNDLE                   = 'wp_com_hundred_year_bundle_centennially'; // 1061
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
	private const JETPACK_GROWTH_BI_YEARLY                    = 'jetpack_growth_bi_yearly'; // 2023
	private const JETPACK_GROWTH_YEARLY                       = 'jetpack_growth_yearly'; // 2022
	private const JETPACK_GROWTH_MONTHLY                      = 'jetpack_growth_monthly'; // 2021
	private const JETPACK_COMPLETE_BI_YEARLY                  = 'jetpack_complete_bi_yearly'; // 2035
	private const JETPACK_COMPLETE                            = 'jetpack_complete'; // 2014
	private const JETPACK_COMPLETE_MONTHLY                    = 'jetpack_complete_monthly'; // 2015
	private const JETPACK_SECURITY_T1_BI_YEARLY               = 'jetpack_security_t1_bi_yearly'; // 2034
	private const JETPACK_SECURITY_T1_YEARLY                  = 'jetpack_security_t1_yearly'; // 2016
	private const JETPACK_SECURITY_T1_MONTHLY                 = 'jetpack_security_t1_monthly'; // 2017
	private const JETPACK_SECURITY_T2_YEARLY                  = 'jetpack_security_t2_yearly'; // 2019
	private const JETPACK_SECURITY_T2_MONTHLY                 = 'jetpack_security_t2_monthly'; // 2020
	private const JETPACK_STARTER_YEARLY                      = 'jetpack_starter_yearly'; // 2030
	private const JETPACK_STARTER_MONTHLY                     = 'jetpack_starter_monthly'; // 2031
	private const JETPACK_BACKUP_DAILY                        = 'jetpack_backup_daily'; // 2100
	private const JETPACK_BACKUP_DAILY_MONTHLY                = 'jetpack_backup_daily_monthly'; // 2101
	private const JETPACK_BACKUP_REALTIME                     = 'jetpack_backup_realtime'; // 2102
	private const JETPACK_BACKUP_REALTIME_MONTHLY             = 'jetpack_backup_realtime_monthly'; // 2103
	private const JETPACK_SEARCH_BI_YEARLY                    = 'jetpack_search_bi_yearly'; // 2031
	private const JETPACK_SEARCH                              = 'jetpack_search'; // 2104
	private const JETPACK_SEARCH_MONTHLY                      = 'jetpack_search_monthly'; // 2105
	private const JETPACK_SCAN_BI_YEARLY                      = 'jetpack_scan_bi_yearly'; // 2038
	private const JETPACK_SCAN                                = 'jetpack_scan'; // 2106
	private const JETPACK_SCAN_MONTHLY                        = 'jetpack_scan_monthly'; // 2107
	private const JETPACK_SCAN_REALTIME                       = 'jetpack_scan_realtime'; // 2108
	private const JETPACK_SCAN_REALTIME_MONTHLY               = 'jetpack_scan_realtime_monthly'; // 2109
	private const JETPACK_ANTI_SPAM_BI_YEARLY                 = 'jetpack_anti_spam_bi_yearly'; // 2039
	private const JETPACK_ANTI_SPAM                           = 'jetpack_anti_spam'; // 2110
	private const JETPACK_ANTI_SPAM_MONTHLY                   = 'jetpack_anti_spam_monthly'; // 2111
	private const JETPACK_BACKUP_T1_BI_YEARLY                 = 'jetpack_backup_t1_bi_yearly'; // 2123
	private const JETPACK_BACKUP_T1_YEARLY                    = 'jetpack_backup_t1_yearly'; // 2112
	private const JETPACK_BACKUP_T1_MONTHLY                   = 'jetpack_backup_t1_monthly'; // 2113
	private const JETPACK_BACKUP_T2_YEARLY                    = 'jetpack_backup_t2_yearly'; // 2114
	private const JETPACK_BACKUP_T2_MONTHLY                   = 'jetpack_backup_t2_monthly'; // 2115
	private const JETPACK_BACKUP_ADDON_STORAGE_10GB_MONTHLY   = 'jetpack_backup_addon_storage_10gb_monthly'; // 2040
	private const JETPACK_BACKUP_ADDON_STORAGE_100GB_MONTHLY  = 'jetpack_backup_addon_storage_100gb_monthly'; // 2044
	private const JETPACK_BACKUP_ADDON_STORAGE_1TB_MONTHLY    = 'jetpack_backup_addon_storage_1tb_monthly'; // 2048
	private const JETPACK_BACKUP_ADDON_STORAGE_3TB_MONTHLY    = 'jetpack_backup_addon_storage_3tb_monthly'; // 2052
	private const JETPACK_BACKUP_ADDON_STORAGE_5TB_MONTHLY    = 'jetpack_backup_addon_storage_5tb_monthly'; // 2056
	private const JETPACK_VIDEOPRESS_BI_YEARLY                = 'jetpack_videopress_bi_yearly'; // 2119
	private const JETPACK_VIDEOPRESS                          = 'jetpack_videopress'; // 2116
	private const JETPACK_VIDEOPRESS_MONTHLY                  = 'jetpack_videopress_monthly'; // 2117
	private const JETPACK_BACKUP_T0_YEARLY                    = 'jetpack_backup_t0_yearly'; // 2120
	private const JETPACK_BACKUP_T0_MONTHLY                   = 'jetpack_backup_t0_monthly'; // 2121
	private const JETPACK_SEARCH_FREE                         = 'jetpack_search_free'; // 2130
	private const JETPACK_BACKUP_ONE_TIME                     = 'jetpack_backup_one_time'; // 2201
	private const JETPACK_STATS_FREE                          = 'jetpack_stats_free_yearly'; // 2221
	private const JETPACK_STATS_PWYW                          = 'jetpack_stats_pwyw_yearly'; // 2222
	private const JETPACK_STATS_MONTHLY                       = 'jetpack_stats_monthly'; // 2220
	private const JETPACK_STATS_YEARLY                        = 'jetpack_stats_yearly'; // 2219
	private const JETPACK_STATS_BI_YEARLY                     = 'jetpack_stats_bi_yearly'; // 2223
	private const JETPACK_MONITOR_MONTHLY                     = 'jetpack_monitor_monthly'; // 2241
	private const JETPACK_MONITOR_YEARLY                      = 'jetpack_monitor_yearly'; // 2242
	private const AKISMET_FREE                                = 'ak_free_yearly'; // 2300
	private const AKISMET_PERSONAL_MONTHLY                    = 'ak_personal_monthly'; // 2309
	private const AKISMET_PERSONAL_YEARLY                     = 'ak_personal_yearly'; // 2310
	private const AKISMET_PLUS_BI_YEARLY                      = 'ak_plus_bi_yearly_1'; // 2327
	private const AKISMET_PLUS_YEARLY                         = 'ak_plus_yearly_1'; // 2311
	private const AKISMET_PLUS_MONTHLY                        = 'ak_plus_monthly_1'; // 2312
	private const AKISMET_PLUS_20K_BI_YEARLY                  = 'ak_plus_bi_yearly_2'; // 2328
	private const AKISMET_PLUS_20K_YEARLY                     = 'ak_plus_yearly_2'; // 2313
	private const AKISMET_PLUS_20K_MONTHLY                    = 'ak_plus_monthly_2'; // 2314
	private const AKISMET_PLUS_30K_BI_YEARLY                  = 'ak_plus_bi_yearly_3'; // 2329
	private const AKISMET_PLUS_30K_YEARLY                     = 'ak_plus_yearly_3'; // 2315
	private const AKISMET_PLUS_30K_MONTHLY                    = 'ak_plus_monthly_3'; // 2316
	private const AKISMET_PLUS_40K_BI_YEARLY                  = 'ak_plus_bi_yearly_4'; // 2330
	private const AKISMET_PLUS_40K_YEARLY                     = 'ak_plus_yearly_4'; // 2317
	private const AKISMET_PLUS_40K_MONTHLY                    = 'ak_plus_monthly_4'; // 2318
	private const AKISMET_ENTERPRISE_BI_YEARLY                = 'ak_ent_bi_yearly_1'; // 2331
	private const AKISMET_ENTERPRISE_YEARLY                   = 'ak_ent_yearly_1'; // 2319
	private const AKISMET_ENTERPRISE_MONTHLY                  = 'ak_ent_monthly_1'; // 2320
	private const AKISMET_ENTERPRISE_350K_YEARLY              = 'ak_ep350k_yearly_1'; // 2321
	private const AKISMET_ENTERPRISE_350K_MONTHLY             = 'ak_ep350k_monthly_1'; // 2322
	private const AKISMET_ENTERPRISE_2M_YEARLY                = 'ak_ep2m_yearly_1'; // 2323
	private const AKISMET_ENTERPRISE_2M_MONTHLY               = 'ak_ep2m_monthly_1'; // 2324
	private const AKISMET_ENTERPRISE_GT2M_YEARLY              = 'ak_epgt2m_yearly_1'; // 2325
	private const AKISMET_ENTERPRISE_GT2M_MONTHLY             = 'ak_epgt2m_monthly_1'; // 2326
	private const AKISMET_PRO_500_MONTHLY                     = 'ak_pro5h_monthly'; // 2332
	private const AKISMET_PRO_500_YEARLY                      = 'ak_pro5h_yearly'; // 2333
	private const AKISMET_PRO_500_BI_YEARLY                   = 'ak_pro5h_bi_yearly'; // 2334
	private const AKISMET_BUSINESS_5K_MONTHLY                 = 'ak_bus5k_monthly'; // 2335
	private const AKISMET_BUSINESS_5K_YEARLY                  = 'ak_bus5k_yearly'; // 2336
	private const AKISMET_BUSINESS_5K_BI_YEARLY               = 'ak_bus5k_bi_yearly'; // 2337
	private const AKISMET_ENTERPRISE_15K_MONTHLY              = 'ak_ep15k_monthly'; // 2338
	private const AKISMET_ENTERPRISE_15K_YEARLY               = 'ak_ep15k_yearly'; // 2339
	private const AKISMET_ENTERPRISE_15K_BI_YEARLY            = 'ak_ep15k_bi_yearly'; // 2340
	private const AKISMET_ENTERPRISE_25K_MONTHLY              = 'ak_ep25k_monthly'; // 2341
	private const AKISMET_ENTERPRISE_25K_YEARLY               = 'ak_ep25k_yearly'; // 2342
	private const AKISMET_ENTERPRISE_25K_BI_YEARLY            = 'ak_ep25k_bi_yearly'; // 2343
	private const JETPACK_BOOST_BI_YEARLY                     = 'jetpack_boost_bi_yearly'; // 2036
	private const JETPACK_BOOST                               = 'jetpack_boost_yearly'; // 2401
	private const JETPACK_BOOST_MONTHLY                       = 'jetpack_boost_monthly'; // 2400
	private const JETPACK_AI_MONTHLY                          = 'jetpack_ai_monthly'; // 2450
	private const JETPACK_AI_YEARLY                           = 'jetpack_ai_yearly'; // 2451
	private const JETPACK_AI_BI_YEARLY                        = 'jetpack_ai_bi_yearly'; // 2452
	private const JETPACK_SOCIAL_BASIC_MONTHLY_LEGACY         = 'jetpack_social_monthly'; // 2500
	private const JETPACK_SOCIAL_BASIC_BI_YEARLY              = 'jetpack_social_basic_bi_yearly'; // 2037
	private const JETPACK_SOCIAL_BASIC                        = 'jetpack_social_basic_yearly'; // 2503
	private const JETPACK_SOCIAL_BASIC_MONTHLY                = 'jetpack_social_basic_monthly'; // 2504
	private const JETPACK_SOCIAL_ADVANCED_BI_YEARLY           = 'jetpack_social_advanced_bi_yearly'; // 2604
	private const JETPACK_SOCIAL_ADVANCED                     = 'jetpack_social_advanced_yearly'; // 2602
	private const JETPACK_SOCIAL_ADVANCED_MONTHLY             = 'jetpack_social_advanced_monthly'; // 2603
	private const JETPACK_GOLDEN_TOKEN                        = 'jetpack_golden_token_lifetime'; // 2900
	private const JETPACK_CREATOR_MONTHLY                     = 'jetpack_creator_monthly'; // 2610
	private const JETPACK_CREATOR_YEARLY                      = 'jetpack_creator_yearly'; // 2611
	private const JETPACK_CREATOR_BI_YEARLY                   = 'jetpack_creator_bi_yearly'; // 2612
	private const JETPACK_SOCIAL_V1_MONTHLY                   = 'jetpack_social_v1_monthly'; // 2606
	private const JETPACK_SOCIAL_V1_YEARLY                    = 'jetpack_social_v1_yearly'; // 2605
	private const JETPACK_SOCIAL_V1_BI_YEARLY                 = 'jetpack_social_v1_bi_yearly'; // 2607

	// WPCOM "Level 2": Groups of level 1s.
	private const WPCOM_BLOGGER_PLANS           = array( self::BLOGGER_BUNDLE, self::BLOGGER_BUNDLE_2Y );
	private const WPCOM_PERSONAL_PLANS          = array( self::PERSONAL_BUNDLE, self::PERSONAL_BUNDLE_MONTHLY, self::PERSONAL_BUNDLE_2Y, self::PERSONAL_BUNDLE_3Y );
	private const WPCOM_STARTER_PLANS           = array( self::STARTER_PLAN );
	private const WPCOM_PREMIUM_PLANS           = array( self::BUNDLE_PRO, self::VALUE_BUNDLE, self::VALUE_BUNDLE_MONTHLY, self::VALUE_BUNDLE_2Y, self::VALUE_BUNDLE_3Y );
	private const WPCOM_PRO_PLANS               = array( self::PRO_PLAN, self::PRO_PLAN_MONTHLY, self::PRO_PLAN_2Y );
	private const WPCOM_MIGRATION_TRIAL_PLANS   = array( self::WPCOM_MIGRATION_TRIAL_BUNDLE_MONTHLY );
	private const WPCOM_HOSTING_TRIAL_PLANS     = array( self::WPCOM_HOSTING_TRIAL_BUNDLE_MONTHLY );
	private const WPCOM_BUSINESS_PLANS          = array( self::BUSINESS_BUNDLE, self::BUSINESS_BUNDLE_MONTHLY, self::BUSINESS_BUNDLE_2Y, self::BUSINESS_BUNDLE_3Y, self::WPCOM_MIGRATION_TRIAL_PLANS, self::WPCOM_HUNDRED_YEAR_BUNDLE, self::WPCOM_HOSTING_TRIAL_BUNDLE_MONTHLY );
	private const WPCOM_ECOMMERCE_PLANS         = array( self::ECOMMERCE_BUNDLE, self::ECOMMERCE_BUNDLE_MONTHLY, self::ECOMMERCE_BUNDLE_2Y, self::ECOMMERCE_BUNDLE_3Y );
	private const WPCOM_ECOMMERCE_TRIAL_PLANS   = array( self::ECOMMERCE_TRIAL_BUNDLE_MONTHLY );
	private const WPCOM_WOOEXPRESS_MEDIUM_PLANS = array( self::WPCOM_WOOEXPRESS_MEDIUM_BUNDLE_MONTHLY, self::WPCOM_WOOEXPRESS_MEDIUM_BUNDLE_YEARLY );
	private const WPCOM_WOOEXPRESS_SMALL_PLANS  = array( self::WPCOM_WOOEXPRESS_SMALL_BUNDLE_MONTHLY, self::WPCOM_WOOEXPRESS_SMALL_BUNDLE_YEARLY );
	private const GOOGLE_WORKSPACE_PRODUCTS     = array( self::WP_GOOGLE_WORKSPACE_BUSINESS_STARTER_YEARLY );
	private const GSUITE_PRODUCTS               = array( self::GAPPS, self::GAPPS_UNLIMITED );
	private const WPCOM_TITAN_MAIL_PRODUCTS     = array( self::WP_TITAN_MAIL_MONTHLY, self::WP_TITAN_MAIL_YEARLY );

	// WPCOM "Level 3" A: Groups of level 2s.
	private const WPCOM_BLOGGER_AND_HIGHER_PLANS  = array( self::WPCOM_BLOGGER_PLANS, self::WPCOM_PERSONAL_PLANS, self::WPCOM_STARTER_PLANS, self::WPCOM_PREMIUM_PLANS, self::WPCOM_PRO_PLANS, self::WPCOM_BUSINESS_PLANS, self::WPCOM_ECOMMERCE_PLANS, self::WPCOM_ECOMMERCE_TRIAL_PLANS, self::WPCOM_WOOEXPRESS_PLANS );
	private const WPCOM_PERSONAL_AND_HIGHER_PLANS = array( self::WPCOM_PERSONAL_PLANS, self::WPCOM_STARTER_PLANS, self::WPCOM_PREMIUM_PLANS, self::WPCOM_PRO_PLANS, self::WPCOM_BUSINESS_PLANS, self::WPCOM_ECOMMERCE_PLANS, self::WPCOM_ECOMMERCE_TRIAL_PLANS, self::WPCOM_WOOEXPRESS_PLANS );
	private const WPCOM_STARTER_AND_HIGHER_PLANS  = array( self::WPCOM_STARTER_PLANS, self::WPCOM_PREMIUM_PLANS, self::WPCOM_PRO_PLANS, self::WPCOM_BUSINESS_PLANS, self::WPCOM_ECOMMERCE_PLANS, self::WPCOM_ECOMMERCE_TRIAL_PLANS, self::WPCOM_WOOEXPRESS_PLANS );
	private const WPCOM_PREMIUM_AND_HIGHER_PLANS  = array( self::WPCOM_PREMIUM_PLANS, self::WPCOM_PRO_PLANS, self::WPCOM_BUSINESS_PLANS, self::WPCOM_ECOMMERCE_PLANS, self::WPCOM_ECOMMERCE_TRIAL_PLANS, self::WPCOM_WOOEXPRESS_PLANS );
	private const WPCOM_BUSINESS_AND_HIGHER_PLANS = array( self::WPCOM_BUSINESS_PLANS, self::WPCOM_ECOMMERCE_PLANS, self::WPCOM_ECOMMERCE_TRIAL_PLANS, self::WPCOM_WOOEXPRESS_PLANS );
	private const WPCOM_WOOEXPRESS_PLANS          = array( self::WPCOM_WOOEXPRESS_MEDIUM_PLANS, self::WPCOM_WOOEXPRESS_SMALL_PLANS );

	// WPCOM "Level 3" C: Misc product groupings unrelated to free plan trials.
	private const WPCOM_EMAIL_PRODUCTS = array( self::GOOGLE_WORKSPACE_PRODUCTS, self::GSUITE_PRODUCTS, self::WPCOM_TITAN_MAIL_PRODUCTS );

	// Jetpack "Level 2": Groups of level 1s.
	private const JETPACK_BUSINESS_PLANS = array( self::JETPACK_BUSINESS, self::JETPACK_BUSINESS_MONTHLY );
	private const JETPACK_PREMIUM_PLANS  = array( self::JETPACK_PREMIUM, self::JETPACK_PREMIUM_MONTHLY );
	private const JETPACK_PERSONAL_PLANS = array( self::JETPACK_PERSONAL, self::JETPACK_PERSONAL_MONTHLY );
	private const JETPACK_GROWTH_PLANS   = array( self::JETPACK_GROWTH_BI_YEARLY, self::JETPACK_GROWTH_YEARLY, self::JETPACK_GROWTH_MONTHLY );
	private const JETPACK_COMPLETE_PLANS = array( self::JETPACK_COMPLETE_BI_YEARLY, self::JETPACK_COMPLETE, self::JETPACK_COMPLETE_MONTHLY );
	private const JETPACK_STARTER_PLANS  = array( self::JETPACK_STARTER_YEARLY, self::JETPACK_STARTER_MONTHLY );

	private const JETPACK_SECURITY_DAILY_PLANS    = array( self::JETPACK_SECURITY_DAILY, self::JETPACK_SECURITY_DAILY_MONTHLY );
	private const JETPACK_SECURITY_REALTIME_PLANS = array( self::JETPACK_SECURITY_REALTIME, self::JETPACK_SECURITY_REALTIME_MONTHLY );
	private const JETPACK_SECURITY_T1_PLANS       = array( self::JETPACK_SECURITY_T1_MONTHLY, self::JETPACK_SECURITY_T1_YEARLY, self::JETPACK_SECURITY_T1_BI_YEARLY );
	private const JETPACK_SECURITY_T2_PLANS       = array( self::JETPACK_SECURITY_T2_MONTHLY, self::JETPACK_SECURITY_T2_YEARLY );

	private const JETPACK_SCAN_PLANS = array( self::JETPACK_SCAN_BI_YEARLY, self::JETPACK_SCAN, self::JETPACK_SCAN_MONTHLY, self::JETPACK_SCAN_REALTIME, self::JETPACK_SCAN_REALTIME_MONTHLY );

	private const JETPACK_SOCIAL_PLANS          = array( self::JETPACK_SOCIAL_BASIC_BI_YEARLY, self::JETPACK_SOCIAL_BASIC, self::JETPACK_SOCIAL_BASIC_MONTHLY, self::JETPACK_SOCIAL_BASIC_MONTHLY_LEGACY );
	private const JETPACK_SOCIAL_ADVANCED_PLANS = array( self::JETPACK_SOCIAL_ADVANCED_BI_YEARLY, self::JETPACK_SOCIAL_ADVANCED, self::JETPACK_SOCIAL_ADVANCED_MONTHLY );
	private const JETPACK_SOCIAL_V1_PLANS       = array( self::JETPACK_SOCIAL_V1_YEARLY, self::JETPACK_SOCIAL_V1_MONTHLY, self::JETPACK_SOCIAL_V1_BI_YEARLY );

	private const JETPACK_STATS_PLANS = array( self::JETPACK_STATS_BI_YEARLY, self::JETPACK_STATS_YEARLY, self::JETPACK_STATS_MONTHLY, self::JETPACK_STATS_PWYW, self::JETPACK_STATS_FREE );

	private const JETPACK_VIDEOPRESS_PLANS = array( self::JETPACK_VIDEOPRESS_BI_YEARLY, self::JETPACK_VIDEOPRESS, self::JETPACK_VIDEOPRESS_MONTHLY );

	private const JETPACK_SEARCH_PLANS = array( self::JETPACK_SEARCH_FREE, self::JETPACK_SEARCH_BI_YEARLY, self::JETPACK_SEARCH, self::JETPACK_SEARCH_MONTHLY );

	private const JETPACK_AI_PLANS = array( self::JETPACK_AI_BI_YEARLY, self::JETPACK_AI_YEARLY, self::JETPACK_AI_MONTHLY );

	private const JETPACK_BOOST_PLANS = array( self::JETPACK_BOOST_BI_YEARLY, self::JETPACK_BOOST, self::JETPACK_BOOST_MONTHLY );

	private const JETPACK_BACKUP_DAILY_PLANS    = array( self::JETPACK_BACKUP_DAILY, self::JETPACK_BACKUP_DAILY_MONTHLY );
	private const JETPACK_BACKUP_REALTIME_PLANS = array( self::JETPACK_BACKUP_REALTIME, self::JETPACK_BACKUP_REALTIME_MONTHLY );
	private const JETPACK_BACKUP_T0_PLANS       = array( self::JETPACK_BACKUP_T0_MONTHLY, self::JETPACK_BACKUP_T0_YEARLY );
	private const JETPACK_BACKUP_T1_PLANS       = array( self::JETPACK_BACKUP_T1_MONTHLY, self::JETPACK_BACKUP_T1_YEARLY, self::JETPACK_BACKUP_T1_BI_YEARLY );
	private const JETPACK_BACKUP_T2_PLANS       = array( self::JETPACK_BACKUP_T2_MONTHLY, self::JETPACK_BACKUP_T2_YEARLY );

	private const JETPACK_CREATOR_PLANS = array( self::JETPACK_CREATOR_MONTHLY, self::JETPACK_CREATOR_YEARLY, self::JETPACK_CREATOR_BI_YEARLY );

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
		self::JETPACK_STARTER_PLANS,
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
		self::AKISMET_FREE,
		self::AKISMET_PERSONAL_MONTHLY,
		self::AKISMET_PERSONAL_YEARLY,
		self::AKISMET_PLUS_MONTHLY,
		self::AKISMET_PLUS_YEARLY,
		self::AKISMET_PLUS_BI_YEARLY,
		self::AKISMET_PLUS_20K_MONTHLY,
		self::AKISMET_PLUS_20K_YEARLY,
		self::AKISMET_PLUS_20K_BI_YEARLY,
		self::AKISMET_PLUS_30K_MONTHLY,
		self::AKISMET_PLUS_30K_YEARLY,
		self::AKISMET_PLUS_30K_BI_YEARLY,
		self::AKISMET_PLUS_40K_MONTHLY,
		self::AKISMET_PLUS_40K_YEARLY,
		self::AKISMET_PLUS_40K_BI_YEARLY,
		self::AKISMET_ENTERPRISE_MONTHLY,
		self::AKISMET_ENTERPRISE_YEARLY,
		self::AKISMET_ENTERPRISE_BI_YEARLY,
		self::AKISMET_ENTERPRISE_350K_MONTHLY,
		self::AKISMET_ENTERPRISE_350K_YEARLY,
		self::AKISMET_ENTERPRISE_2M_MONTHLY,
		self::AKISMET_ENTERPRISE_2M_YEARLY,
		self::AKISMET_PRO_500_MONTHLY,
		self::AKISMET_PRO_500_YEARLY,
		self::AKISMET_PRO_500_BI_YEARLY,
		self::AKISMET_BUSINESS_5K_MONTHLY,
		self::AKISMET_BUSINESS_5K_YEARLY,
		self::AKISMET_BUSINESS_5K_BI_YEARLY,
		self::AKISMET_ENTERPRISE_15K_MONTHLY,
		self::AKISMET_ENTERPRISE_15K_YEARLY,
		self::AKISMET_ENTERPRISE_15K_BI_YEARLY,
		self::AKISMET_ENTERPRISE_25K_MONTHLY,
		self::AKISMET_ENTERPRISE_25K_YEARLY,
		self::AKISMET_ENTERPRISE_25K_BI_YEARLY,
	);

	// Features automatically granted to all sites regardless of their purchases are mapped to these constants.
	private const WPCOM_ALL_SITES   = 'wpcom-all-sites';
	private const JETPACK_ALL_SITES = 'jetpack-all-sites';

	/*
	 * Public const for every mapped feature, sorted alphabetically.
	 */
	public const AI_ASSISTANT                      = 'ai-assistant';
	public const AD_CREDIT_VOUCHERS                = 'ad-credit';
	public const ADVANCED_SEO                      = 'advanced-seo';
	public const AKISMET                           = 'akismet';
	public const ANTISPAM                          = 'antispam';
	public const ARCHIVE_CONTENT                   = 'archive-content';
	public const ARTIFICIAL_50GB_STORAGE_LIMIT     = 'artificial-50gb-storage-limit';
	public const ATOMIC                            = 'atomic';
	public const BACKUPS                           = 'backups';
	public const BACKUPS_DAILY                     = 'backups-daily';
	public const BACKUPS_RESTORE                   = 'restore';
	public const BACKUP_ONE_TIME                   = 'backup-one-time';
	public const BLOG_DOMAIN_ONLY                  = 'blog-domain-only';
	public const CALENDLY                          = 'calendly';
	public const CDN                               = 'cdn';
	public const CLASSIC_SEARCH                    = 'search';
	public const CLOUD_CRITICAL_CSS                = 'cloud-critical-css';
	public const CORNERSTONE_TEN_PAGES             = 'cornerstone-10-pages';
	public const CLOUDFLARE_ANALYTICS              = 'cloudflare-analytics';
	public const CLOUDFLARE_CDN                    = 'cloudflare-cdn';
	public const CONCIERGE                         = 'concierge';
	public const CONCIERGE_BUSINESS                = 'concierge-business';
	public const COPY_SITE                         = 'copy-site';
	public const CORE_AUDIO                        = 'core/audio';
	public const CORE_COVER                        = 'core/cover';
	public const CORE_VIDEO                        = 'core/video';
	public const CREDIT_VOUCHERS                   = 'credit-vouchers';
	public const CUSTOM_DESIGN                     = 'custom-design';
	public const CUSTOM_DOMAIN                     = 'custom-domain';
	public const DOMAIN_MAPPING                    = 'domain-mapping';
	public const DONATIONS                         = 'donations';
	public const ECOMMERCE_MANAGED_PLUGINS         = 'ecommerce-managed-plugins';
	public const ECOMMERCE_MANAGED_PLUGINS_SMALL   = 'ecommerce-managed-plugins-small';
	public const ECOMMERCE_MANAGED_PLUGINS_MEDIUM  = 'ecommerce-managed-plugins-medium';
	public const ECOMMERCE_MANAGED_PLUGINS_TRIAL   = 'ecommerce-managed-plugins-trial';
	public const EDIT_PLUGINS                      = 'edit-plugins';
	public const EDIT_THEMES                       = 'edit-themes';
	public const EMAIL_PROFESSIONAL                = 'email-professional';
	public const EMAIL_SUBSCRIPTION                = 'email-subscription';
	public const EMAIL_FORWARDS_EXTENDED_LIMIT     = 'email-forwards-extended-limit';
	public const FREE_BLOG                         = 'free-blog';
	public const FULL_ACTIVITY_LOG                 = 'full-activity-log';
	public const GLOBAL_STYLES                     = 'global-styles';
	public const GOOGLE_ANALYTICS                  = 'google-analytics';
	public const GOOGLE_MY_BUSINESS                = 'google-my-business';
	public const IMAGE_CDN_LIAR                    = 'image-cdn-liar';
	public const IMAGE_CDN_QUALITY                 = 'image-cdn-quality';
	public const IMAGE_SIZE_ANALYSIS               = 'image-size-analysis';
	public const INSTALL_PLUGINS                   = 'install-plugins';
	public const INSTALL_PURCHASED_PLUGINS         = 'install-purchased-plugins';
	public const INSTALL_THEMES                    = 'install-themes';
	public const INSTALL_WOO_ONBOARDING_PLUGINS    = 'install-woo-onboarding-plugins';
	public const INSTANT_SEARCH                    = 'instant-search';
	public const JETPACK_DASHBOARD                 = 'jetpack-dashboard';
	public const LEGACY_CONTACT                    = 'legacy-contact';
	public const LIST_INSTALLED_PLUGINS            = 'list-installed-plugins';
	public const LIVE_SUPPORT                      = 'live_support';
	public const LOCKED_MODE                       = 'locked-mode';
	public const MAILPOET_BUSINESS                 = 'mailpoet-business';
	public const MANAGE_PLUGINS                    = 'manage-plugins';
	public const MONITOR_1_MINUTE_CHECK_INTERVAL   = 'monitor-1-minute-check-interval';
	public const MONITOR_MULTIPLE_EMAIL_RECIPIENTS = 'monitor-multiple-email-recipients';
	public const MONITOR_SMS_NOTIFICATIONS         = 'monitor-sms-notifications';
	public const NO_ADVERTS_NO_ADVERTS_PHP         = 'no-adverts/no-adverts.php';
	public const NO_WPCOM_BRANDING                 = 'no-wpcom-branding';
	public const OPENTABLE                         = 'opentable';
	public const OPTIONS_PERMALINK                 = 'options-permalink';
	public const PAYMENTS                          = 'payments';
	public const PERFORMANCE_HISTORY               = 'performance-history';
	public const POLLDADDY                         = 'polldaddy';
	public const PREMIUM_CONTENT_CONTAINER         = 'premium-content/container';
	public const PERSONAL_THEMES                   = 'personal-themes';
	public const PREMIUM_THEMES                    = 'premium-themes';
	public const PRIORITY_SUPPORT                  = 'priority_support';
	public const PRIVATE_WHOIS                     = 'private_whois';
	public const REAL_TIME_BACKUPS                 = 'real-time-backups';
	public const RECURRING_PAYMENTS                = 'recurring-payments';
	public const REDUCED_ATOMIC_EMAIL_PRIORITY     = 'reduced-email-priority';
	public const REPUBLICIZE                       = 'republicize';
	public const SCAN                              = 'scan';
	public const SCAN_MANAGED                      = 'scan-managed';
	public const SCHEDULED_UPDATES                 = 'scheduled-updates';
	public const SECURITY_SETTINGS                 = 'security-settings';
	public const SEO_PREVIEW_TOOLS                 = 'seo-preview-tools';
	public const SEND_A_MESSAGE                    = 'send-a-message';
	public const SET_PRIMARY_CUSTOM_DOMAIN         = 'set-primary-custom-domain';
	public const SFTP                              = 'sftp';
	public const SIMPLE_PAYMENTS                   = 'simple-payments';
	public const SITE_PREVIEW_LINKS                = 'site-preview-links';
	public const SOCIAL_IMAGE_GENERATOR            = 'social-image-generator';
	public const SOCIAL_PREVIEWS                   = 'social-previews';
	public const SOCIAL_SHARES_1000                = 'social-shares-1000';
	public const SOCIAL_ENHANCED_PUBLISHING        = 'social-enhanced-publishing';
	public const SOCIAL_MASTODON_CONNECTION        = 'social-mastodon-connection';
	public const SOCIAL_THREADS_CONNECTION         = 'social-threads-connection';
	public const SOCIAL_INSTAGRAM_CONNECTION       = 'social-instagram-connection';
	public const SOCIAL_CONNECTIONS_MANAGEMENT     = 'social-connections-management';
	public const SOCIAL_IMAGE_AUTO_CONVERT         = 'social-image-auto-convert';
	public const SOCIAL_EDITOR_PREVIEW             = 'social-editor-preview';
	public const SOCIAL_SHARE_STATUS               = 'social-share-status';
	public const SOCIAL_MULTI_CONNECTIONS          = 'social-multi-connections';
	public const SPACE                             = 'space';
	public const SPACE_UPGRADED_STORAGE            = 'space-upgraded-storage';
	public const SSH                               = 'ssh';
	public const STAGING_SITES                     = 'staging-sites';
	public const STATS_BASIC_TEMP                  = 'stats-basic';
	public const STATS_COMMERCIAL                  = 'stats-commercial';
	public const STATS_FREE                        = 'stats-free';
	public const STATS_PAID                        = 'stats-paid';
	public const STUDIO_SYNC                       = 'studio-sync';
	public const SUBSCRIBER_UNLIMITED_IMPORTS      = 'subscriber-unlimited-imports';
	public const SUBSCRIPTION_GIFTING              = 'subscription-gifting';
	public const SUPPORT                           = 'support';
	public const UPGRADED_UPLOAD_FILETYPES         = 'upgraded_upload_filetypes';
	public const UPLOAD_AUDIO_FILES                = 'upload-audio-files';
	public const UPLOAD_PLUGINS                    = 'upload-plugins';
	public const UPLOAD_SPACE_1GB                  = 'upload-space-1gb-addon';
	public const UPLOAD_SPACE_3GB                  = 'upload-space-3gb';
	public const UPLOAD_SPACE_10GB                 = 'upload-space-10gb';
	public const UPLOAD_SPACE_25GB                 = 'upload-space-25gb';
	public const UPLOAD_SPACE_50GB                 = 'upload-space-50gb';
	public const UPLOAD_SPACE_100GB                = 'upload-space-100gb';
	public const UPLOAD_SPACE_200GB                = 'upload-space-200gb';
	public const UPLOAD_SPACE_UNLIMITED            = 'upload-space-unlimited';
	public const UPLOAD_THEMES                     = 'upload-themes';
	public const UPLOAD_VIDEO_FILES                = 'upload-video-files';
	public const VAULTPRESS_AUTOMATED_RESTORES     = 'vaultpress-automated-restores';
	public const VAULTPRESS_BACKUP_ARCHIVE         = 'vaultpress-backup-archive';
	public const VAULTPRESS_BACKUPS                = 'vaultpress-backups';
	public const VAULTPRESS_SECURITY_SCANNING      = 'vaultpress-security-scanning';
	public const VAULTPRESS_STORAGE_SPACE          = 'vaultpress-storage-space';
	public const VIDEO_HOSTING                     = 'video-hosting';
	public const VIDEOPRESS                        = 'videopress';
	public const VIDEOPRESS_1TB_STORAGE            = 'videopress-1tb-storage';
	public const VIDEOPRESS_VIDEO                  = 'videopress/video';
	public const VIDEOPRESS_UNLIMITED_STORAGE      = 'videopress-unlimited-storage';
	public const WHATSAPP_BUTTON                   = 'whatsapp-button';
	public const WOOP                              = 'woop';
	public const WORDADS                           = 'wordads';
	public const WORDADS_JETPACK                   = 'wordads-jetpack';

	/*
	 * Private const array of features with sub-array of purchases that include that feature. Sorted alphabetically.
	 */
	private const FEATURES_MAP = array(
		self::AI_ASSISTANT                      => array(
			self::JETPACK_AI_PLANS,
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::JETPACK_COMPLETE_PLANS,
		),
		self::AD_CREDIT_VOUCHERS                => array(
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
		self::ADVANCED_SEO                      => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),
		self::AKISMET                           => array(
			self::AKISMET_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::WPCOM_ALL_SITES,
		),
		self::ANTISPAM                          => array(
			self::JETPACK_ANTI_SPAM_BI_YEARLY,
			self::JETPACK_ANTI_SPAM,
			self::JETPACK_ANTI_SPAM_MONTHLY,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		// Automatically syncs content to the Internet Archive on publish and update.
		self::ARCHIVE_CONTENT                   => array(
			self::WPCOM_HUNDRED_YEAR_BUNDLE,
		),

		/*
		 * Temporary limit until the Pro plan storage is ready to be fully
		 * implemented.
		 */
		self::ARTIFICIAL_50GB_STORAGE_LIMIT     => array(
			self::WPCOM_PRO_PLANS,
		),
		self::ATOMIC                            => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_STAGING_PRODUCT,
			array( 'product_type' => array( 'marketplace_plugin', 'saas_plugin' ) ),
		),
		// BACKUPS - Site has *any* kind of backups.
		self::BACKUPS                           => array(
			self::JETPACK_BACKUP_DAILY_PLANS,
			self::JETPACK_BACKUP_ONE_TIME,
			self::JETPACK_BACKUP_REALTIME_PLANS,
			self::JETPACK_BACKUP_T0_PLANS,
			self::JETPACK_BACKUP_T1_PLANS,
			self::JETPACK_BACKUP_T2_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::JETPACK_GOLDEN_TOKEN,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::WPCOM_STAGING_PRODUCT,
		),
		// BACKUPS_DAILY - Site has product that includes daily backups.
		self::BACKUPS_DAILY                     => array(
			self::JETPACK_BACKUP_DAILY_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::JETPACK_SECURITY_DAILY_PLANS,
		),
		self::BACKUPS_RESTORE                   => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		/*
		 * BACKUP_ONE_TIME - Site has purchased a one-time backup.
		 * Note the jetpack_backup_one_time product never expires. So any feature gated with BACKUP_ONE_TIME will
		 * likewise, never expire.
		 */
		self::BACKUP_ONE_TIME                   => array(
			self::JETPACK_BACKUP_ONE_TIME,
		),
		// BLOG_DOMAIN_ONLY - Users on Blogger plan can only purchase .blog domains.
		self::BLOG_DOMAIN_ONLY                  => array(
			self::WPCOM_BLOGGER_PLANS,
		),
		self::CALENDLY                          => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_PREMIUM_PLANS,
			self::WP_P2_PLUS_MONTHLY,
		),
		self::CDN                               => array(
			self::JETPACK_ALL_SITES,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::CLASSIC_SEARCH                    => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::JETPACK_SEARCH_PLANS,
			self::JETPACK_COMPLETE_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::WPCOM_SEARCH,
			self::WPCOM_SEARCH_MONTHLY,
			self::WP_P2_PLUS_MONTHLY,
		),
		self::CLOUD_CRITICAL_CSS                => array(
			self::JETPACK_BOOST_PLANS,
			self::JETPACK_COMPLETE_PLANS,
		),
		self::CORNERSTONE_TEN_PAGES             => array(
			self::JETPACK_BOOST_PLANS,
			self::JETPACK_COMPLETE_PLANS,
		),
		self::CLOUDFLARE_ANALYTICS              => array(
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::CLOUDFLARE_CDN                    => array(
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::CONCIERGE                         => array(
			self::WPCOM_BUSINESS_PLANS,
			self::WPCOM_ECOMMERCE_PLANS,
		),
		self::CONCIERGE_BUSINESS                => array(
			self::WPCOM_BUSINESS_PLANS,
		),
		self::COPY_SITE                         => array(
			self::WPCOM_BUSINESS_PLANS,
			self::WPCOM_ECOMMERCE_PLANS,
		),
		// CORE_AUDIO - core/audio requires a paid plan for uploading audio files.
		self::CORE_AUDIO                        => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
		),
		// CORE_COVER - core/cover requires a paid plan for uploading video files.
		self::CORE_COVER                        => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_PREMIUM_PLANS,
		),
		// CORE_VIDEO - core/video requires a paid plan.
		self::CORE_VIDEO                        => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_PREMIUM_PLANS,
		),
		self::CREDIT_VOUCHERS                   => array(
			self::BUNDLE_PRO,
			self::BUNDLE_SUPER,
			self::BUNDLE_ENTERPRISE,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
		),
		self::CUSTOM_DESIGN                     => array(
			self::WPCOM_CUSTOM_DESIGN,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
		),
		self::CUSTOM_DOMAIN                     => array(
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
		),
		self::DOMAIN_MAPPING                    => array(
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::DONATIONS                         => array(
			self::WPCOM_ALL_SITES,
			self::JETPACK_ALL_SITES,
		),
		// ECOMMERCE_MANAGED_PLUGINS - Can install the plugin bundle that comes with eCommerce plans.
		self::ECOMMERCE_MANAGED_PLUGINS         => array(
			self::WPCOM_ECOMMERCE_PLANS,
			self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			self::WPCOM_WOOEXPRESS_PLANS,
		),
		// ECOMMERCE_MANAGED_PLUGINS_SMALL - Can install the plugin bundle that comes with eCommerce Small plans.
		self::ECOMMERCE_MANAGED_PLUGINS_SMALL   => array(
			self::WPCOM_WOOEXPRESS_SMALL_PLANS,
		),
		// ECOMMERCE_MANAGED_PLUGINS_MEDIUM - Can install the plugin bundle that comes with eCommerce Medium plans.
		self::ECOMMERCE_MANAGED_PLUGINS_MEDIUM  => array(
			self::WPCOM_ECOMMERCE_PLANS,
			self::WPCOM_WOOEXPRESS_MEDIUM_PLANS,
		),
		// ECOMMERCE_MANAGED_PLUGINS_TRIAL - Can install the plugin bundle that comes with eCommerce Trial plans.
		self::ECOMMERCE_MANAGED_PLUGINS_TRIAL   => array(
			self::WPCOM_ECOMMERCE_TRIAL_PLANS,
		),
		// EDIT_PLUGINS - Provides the edit_plugins capability on atomic sites, does nothing on simple sites.
		self::EDIT_PLUGINS                      => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),
		// EDIT_THEMES - Provides the edit_themes capability on atomic sites, does nothing on simple sites.
		self::EDIT_THEMES                       => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),
		// EMAIL_PROFESSIONAL - Access to Titan email hosting, often referred to as WordPress.com "Professional Email".
		self::EMAIL_PROFESSIONAL                => array(
			self::WPCOM_TITAN_MAIL_PRODUCTS,
		),
		// EMAIL_SUBSCRIPTION - Represents having at least one product providing email.
		self::EMAIL_SUBSCRIPTION                => array(
			self::WPCOM_EMAIL_PRODUCTS,
		),
		self::EMAIL_FORWARDS_EXTENDED_LIMIT     => array(
			self::BUNDLE_ENTERPRISE,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::FREE_BLOG                         => array(
			self::WPCOM_ALL_SITES,
		),
		self::FULL_ACTIVITY_LOG                 => array(
			self::JETPACK_BACKUP_DAILY_PLANS,
			self::JETPACK_BACKUP_REALTIME_PLANS,
			self::JETPACK_BACKUP_T0_PLANS,
			self::JETPACK_BACKUP_T1_PLANS,
			self::JETPACK_BACKUP_T2_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::JETPACK_GOLDEN_TOKEN,
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::GLOBAL_STYLES                     => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
		),
		self::GOOGLE_ANALYTICS                  => array(
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::WPCOM_STARTER_AND_HIGHER_PLANS,
		),
		self::GOOGLE_MY_BUSINESS                => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_SECURITY_REALTIME_PLANS,
			self::JETPACK_COMPLETE_PLANS,
			self::JETPACK_SECURITY_T1_PLANS,
			self::JETPACK_SECURITY_T2_PLANS,
		),
		self::IMAGE_CDN_LIAR                    => array(
			self::JETPACK_BOOST_PLANS,
			self::JETPACK_COMPLETE_PLANS,
		),
		self::IMAGE_CDN_QUALITY                 => array(
			self::JETPACK_BOOST_PLANS,
			self::JETPACK_COMPLETE_PLANS,
		),
		self::IMAGE_SIZE_ANALYSIS               => array(
			self::JETPACK_BOOST_PLANS,
			self::JETPACK_COMPLETE_PLANS,
		),
		self::INSTALL_PLUGINS                   => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),
		self::INSTALL_PURCHASED_PLUGINS         => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::WPCOM_STARTER_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),
		self::INSTALL_THEMES                    => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::JETPACK_ALL_SITES,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),
		self::INSTALL_WOO_ONBOARDING_PLUGINS    => array(
			self::WPCOM_ECOMMERCE_TRIAL_PLANS,
		),
		self::INSTANT_SEARCH                    => array(
			self::WPCOM_SEARCH,
			self::WPCOM_SEARCH_MONTHLY,
			self::WP_P2_PLUS_MONTHLY,
			self::JETPACK_SEARCH_PLANS,
			self::JETPACK_COMPLETE_PLANS,
		),
		self::JETPACK_DASHBOARD                 => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),

		// Allows sites to designate a contact person to look after their site after they pass away.
		self::LEGACY_CONTACT                    => array(
			self::WPCOM_HUNDRED_YEAR_BUNDLE,
		),
		self::LIST_INSTALLED_PLUGINS            => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::WPCOM_STARTER_PLANS,
		),
		// LIVE_SUPPORT - Monthly plans do not get live support. p7DVsv-a9N-p2.
		self::LIVE_SUPPORT                      => array(
			// Premium (Excluding Monthly).
			self::BUNDLE_PRO,
			self::VALUE_BUNDLE,
			self::VALUE_BUNDLE_2Y,
			self::VALUE_BUNDLE_3Y,
			// Pro.
			self::PRO_PLAN,
			self::PRO_PLAN_2Y,
			// Business (Excluding Monthly).
			self::BUSINESS_BUNDLE,
			self::BUSINESS_BUNDLE_2Y,
			self::BUSINESS_BUNDLE_3Y,
			// Ecommerce (Excluding Monthly).
			self::ECOMMERCE_BUNDLE,
			self::ECOMMERCE_BUNDLE_2Y,
			self::ECOMMERCE_BUNDLE_3Y,
			// Woo Express (Small and Medium plans), excluding monthly.
			self::WPCOM_WOOEXPRESS_MEDIUM_BUNDLE_YEARLY,
			self::WPCOM_WOOEXPRESS_SMALL_BUNDLE_YEARLY,
		),

		// Enables a setting to lock the site content to prevent changes (incl. disabling comments site-wide).
		self::LOCKED_MODE                       => array(
			self::WPCOM_HUNDRED_YEAR_BUNDLE,
		),
		self::MAILPOET_BUSINESS                 => array(
			self::WPCOM_ECOMMERCE_PLANS,
			self::WPCOM_WOOEXPRESS_PLANS,
		),
		// MANAGE_PLUGINS - Atomic only feature. Can upload, install, and activate any 3rd party plugin.
		self::MANAGE_PLUGINS                    => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),

		// MONITOR_1_MINUTE_CHECK_INTERVAL - Jetpack Monitor checks site uptime once per minute
		self::MONITOR_1_MINUTE_CHECK_INTERVAL   => array(
			self::JETPACK_MONITOR_MONTHLY,
			self::JETPACK_MONITOR_YEARLY,
		),
		// MONITOR_MULTIPLE_EMAIL_RECIPIENTS - Jetpack Monitor can email more than one recipient when a site goes down
		self::MONITOR_MULTIPLE_EMAIL_RECIPIENTS => array(
			self::JETPACK_MONITOR_MONTHLY,
			self::JETPACK_MONITOR_YEARLY,
		),
		// MONITOR_SMS_NOTIFICATIONS - Jetpack Monitor can send notifications via SMS when a site goes down
		self::MONITOR_SMS_NOTIFICATIONS         => array(
			self::JETPACK_MONITOR_MONTHLY,
			self::JETPACK_MONITOR_YEARLY,
		),

		self::NO_ADVERTS_NO_ADVERTS_PHP         => array(
			self::NO_ADS,
			// Deliberately leaves out the Starter plan.
			self::WPCOM_BLOGGER_PLANS,
			self::WPCOM_PERSONAL_PLANS,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
		),
		// NO_WPCOM_BRANDING - Enable the ability to hide the WP.com branding in the site footer.
		self::NO_WPCOM_BRANDING                 => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),
		self::OPENTABLE                         => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_PREMIUM_PLANS,
		),
		// OPTIONS_PERMALINK - Atomic only feature. Enables Settings -> Permalinks menu item & options-permalink page.
		self::OPTIONS_PERMALINK                 => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),
		self::PAYMENTS                          => array(
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
		),
		self::PERFORMANCE_HISTORY               => array(
			self::JETPACK_BOOST_PLANS,
			self::JETPACK_COMPLETE_PLANS,
		),
		self::POLLDADDY                         => array(
			self::JETPACK_BUSINESS_PLANS,
		),
		// PREMIUM_CONTENT_CONTAINER - premium-content requires a paid wpcom plan.
		self::PREMIUM_CONTENT_CONTAINER         => array(
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::WP_P2_PLUS_MONTHLY,
		),
		self::PERSONAL_THEMES                   => array(
			self::WPCOM_UNLIMITED_THEMES,
			self::BUNDLE_ENTERPRISE,
			self::WPCOM_PRO_PLANS,
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
		),
		self::PREMIUM_THEMES                    => array(
			self::WPCOM_UNLIMITED_THEMES,
			self::BUNDLE_ENTERPRISE,
			self::WPCOM_PRO_PLANS,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
		),
		self::PRIORITY_SUPPORT                  => array(
			self::JETPACK_BACKUP_T1_PLANS,
			self::JETPACK_BACKUP_T2_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::JETPACK_GOLDEN_TOKEN,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::PRIVATE_WHOIS                     => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
		),
		self::REAL_TIME_BACKUPS                 => array(
			self::JETPACK_BACKUP_REALTIME_PLANS,
			self::JETPACK_BACKUP_T0_PLANS,
			self::JETPACK_BACKUP_T1_PLANS,
			self::JETPACK_BACKUP_T2_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_COMPLETE_PLANS,
			self::JETPACK_SECURITY_REALTIME_PLANS,
			self::JETPACK_SECURITY_T1_PLANS,
			self::JETPACK_SECURITY_T2_PLANS,
			self::JETPACK_STARTER_PLANS,
			self::JETPACK_GOLDEN_TOKEN,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::RECURRING_PAYMENTS                => array(
			self::WPCOM_ALL_SITES,
			self::JETPACK_ALL_SITES,
		),

		/*
		 * Reduced email priority when sending emails via SMTP via the Atomic platform.
		 */
		self::REDUCED_ATOMIC_EMAIL_PRIORITY     => array(
			self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			self::WPCOM_MIGRATION_TRIAL_PLANS,
			self::WPCOM_HOSTING_TRIAL_PLANS,
		),

		/*
		 * REPUBLICIZE
		 *
		 * Active for:
		 * - Simple and Atomic sites with Premium or up plan.
		 * - Jetpack sites with Premium or up plan, or a Jetpack Social plan.
		 */
		self::REPUBLICIZE                       => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),
		self::SCAN                              => array(
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::JETPACK_SCAN_PLANS,
			self::JETPACK_GOLDEN_TOKEN,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		/*
		 * SCAN_MANAGED - Scan results are managed internally by Atomic guild HEs and not shown in user UI.
		 * See D57207-code.
		 */
		self::SCAN_MANAGED                      => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),

		/*
		 * SCHEDULED_UPDATES - Allows users to schedule plugin and (eventually) theme updates for their sites.
		 *
		 * @see pcmemI-2O3-p2
		 */
		self::SCHEDULED_UPDATES                 => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),

		/*
		 * SECURITY_SETTINGS - Initially added to determine whether to show /settings/security.
		 * More info: https://github.com/Automattic/wp-calypso/issues/51820
		 *
		 * Active for:
		 * - Simple and Atomic sites with Business or up plan.
		 * - Jetpack sites with any plan.
		 */
		self::SECURITY_SETTINGS                 => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),
		self::SEO_PREVIEW_TOOLS                 => array(
			self::BUNDLE_ENTERPRISE,
			self::JETPACK_ALL_SITES,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
		),
		self::SEND_A_MESSAGE                    => array(
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
		self::SET_PRIMARY_CUSTOM_DOMAIN         => array(
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
			self::YOAST_PREMIUM,
		),
		// Hosting Configuration.
		self::SFTP                              => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),

		self::SSH                               => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),
		self::SIMPLE_PAYMENTS                   => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::JETPACK_CREATOR_PLANS,
			self::JETPACK_GROWTH_PLANS,
		),
		self::SITE_PREVIEW_LINKS                => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),
		self::SOCIAL_PREVIEWS                   => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),

		/*
		 * SOCIAL_SHARES_1000 - This feature is linked to the ability to share upto 1000 social media shares on the Jetpack Social Plugin.
		 *
		 */
		self::SOCIAL_SHARES_1000                => array(
			self::JETPACK_ALL_SITES,
			self::BUNDLE_ENTERPRISE,
		),

		self::SOCIAL_ENHANCED_PUBLISHING        => array(
			self::JETPACK_SOCIAL_ADVANCED_PLANS,
			self::JETPACK_COMPLETE_PLANS,
			self::BUNDLE_ENTERPRISE,
			self::JETPACK_SOCIAL_V1_PLANS,
			self::JETPACK_SOCIAL_PLANS,
			self::JETPACK_GROWTH_PLANS,
		),
		self::SOCIAL_IMAGE_GENERATOR            => array(
			self::JETPACK_SOCIAL_ADVANCED_PLANS,
			self::JETPACK_COMPLETE_PLANS,
			self::BUNDLE_ENTERPRISE,
			self::JETPACK_SOCIAL_V1_PLANS,
			self::JETPACK_SOCIAL_PLANS,
			self::JETPACK_GROWTH_PLANS,
		),
		self::SOCIAL_MASTODON_CONNECTION        => array(
			array(
				// This feature isn't launched yet, so we're ensuring that it's not available on any plans.
				'before' => '1900-01-01',
				self::WPCOM_ALL_SITES,
				self::JETPACK_ALL_SITES,
			),
		),
		self::SOCIAL_THREADS_CONNECTION         => array(
			array(
				// This feature isn't launched yet, so we're ensuring that it's not available on any plans.
				'before' => '1900-01-01',
				self::WPCOM_ALL_SITES,
				self::JETPACK_ALL_SITES,
			),
		),
		self::SOCIAL_INSTAGRAM_CONNECTION       => array(
			array(
				// This feature isn't launched yet, so we're ensuring that it's not available on any plans.
				'before' => '1900-01-01',
				self::WPCOM_ALL_SITES,
				self::JETPACK_ALL_SITES,
			),
		),
		self::SOCIAL_CONNECTIONS_MANAGEMENT     => array(
			array(
				// This feature isn't launched yet, so we're ensuring that it's not available on any plans.
				'before' => '1900-01-01',
				self::WPCOM_ALL_SITES,
				self::JETPACK_ALL_SITES,
			),
		),
		self::SOCIAL_EDITOR_PREVIEW             => array(
			array(
				// This feature isn't launched yet, so we're ensuring that it's not available on any plans.
				'before' => '1900-01-01',
				self::WPCOM_ALL_SITES,
				self::JETPACK_ALL_SITES,
			),
		),
		self::SOCIAL_SHARE_STATUS               => array(
			array(
				// This feature isn't launched yet, so we're ensuring that it's not available on any plans.
				'before' => '1900-01-01',
				self::WPCOM_ALL_SITES,
				self::JETPACK_ALL_SITES,
			),
		),
		self::SOCIAL_IMAGE_AUTO_CONVERT         => array(
			self::WPCOM_ALL_SITES,
		),
		self::SPACE                             => array(
			self::WPCOM_ALL_SITES,
		),

		/*
		 * Products that have upgraded storage space on WordPress.com, beyond
		 * the bare minimum advertised for free sites. This list includes all
		 * WordPress.com plans and space upgrade products.
		 */
		self::SPACE_UPGRADED_STORAGE            => array(
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
			self::BUNDLE_SUPER,
			self::BUNDLE_ENTERPRISE,
			self::WP_P2_PLUS_MONTHLY,
			self::SPACE_1GB,
			self::SPACE_3GB,
			self::SPACE_10GB,
			self::SPACE_25GB,
			self::SPACE_50GB,
			self::SPACE_100GB,
			self::SPACE_200GB,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_HOSTING_TRIAL_PLANS,
			),
		),
		self::STAGING_SITES                     => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),
		// Gives near full access to all stats features. All features except new commercial level modules like UTM and device stats.
		self::STATS_FREE                        => array(
			self::JETPACK_STATS_PLANS,
			self::JETPACK_GROWTH_PLANS,
			// Provides legacy access for free and personal sites created before 2024-01-09.
			// Can be removed once we are ready to paywall all free and/or old personal sites.
			array(
				'before' => '2024-01-09',
				self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
				self::WPCOM_ALL_SITES,
			),
		),
		// Provides limited stats for free and personal sites created before 2024-12-06.
		// Features: Posts/Locations/Emails/File downloads
		// Can be removed once we are ready to paywall all free sites.
		self::STATS_BASIC_TEMP                  => array(
			array(
				'before' => '2024-12-12',
				self::WPCOM_ALL_SITES,
			),
		),
		// Provides personal sites and higher access to all stats features except commercial level modules.
		// Features: Posts/Locations/Emails/File downloads/Referrers/Clicks
		self::STATS_PAID                        => array(
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::WP_P2_PLUS_MONTHLY,
			self::JETPACK_STATS_PWYW,
			self::JETPACK_STATS_MONTHLY,
			self::JETPACK_STATS_BI_YEARLY,
			self::JETPACK_STATS_YEARLY,
			self::JETPACK_COMPLETE_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_GROWTH_PLANS,
		),
		// Provides premium sites and higher access to all stats features.
		// Features: STATS_PAID + UTM & Devices modules
		self::STATS_COMMERCIAL                  => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_STATS_MONTHLY,
			self::JETPACK_STATS_BI_YEARLY,
			self::JETPACK_STATS_YEARLY,
			self::JETPACK_COMPLETE_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_GROWTH_PLANS,
		),
		self::STUDIO_SYNC                       => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),

		// Importing subscribers to the site without limits.
		self::SUBSCRIBER_UNLIMITED_IMPORTS      => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::JETPACK_SOCIAL_PLANS,
			self::JETPACK_SOCIAL_ADVANCED_PLANS,
			self::JETPACK_SOCIAL_V1_PLANS,
			self::JETPACK_CREATOR_PLANS,
			self::JETPACK_GROWTH_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_MIGRATION_TRIAL_PLANS,
				self::WPCOM_HOSTING_TRIAL_PLANS,
			),
		),

		self::SUBSCRIPTION_GIFTING              => array(
			self::WPCOM_PERSONAL_AND_HIGHER_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_MIGRATION_TRIAL_PLANS,
				self::WPCOM_HOSTING_TRIAL_PLANS,
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),

		// SUPPORT - Everybody needs somebody.
		self::SUPPORT                           => array(
			self::WPCOM_ALL_SITES,
			self::JETPACK_PERSONAL_AND_HIGHER,
			self::JETPACK_GOLDEN_TOKEN,
		),
		self::UPGRADED_UPLOAD_FILETYPES         => array(
			self::SPACE_1GB,
			self::SPACE_3GB,
			self::SPACE_10GB,
			self::SPACE_25GB,
			self::SPACE_50GB,
			self::SPACE_100GB,
			self::SPACE_200GB,
			self::WPCOM_BLOGGER_AND_HIGHER_PLANS,
			self::WP_P2_PLUS_MONTHLY,
		),
		self::UPLOAD_AUDIO_FILES                => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),
		self::UPLOAD_PLUGINS                    => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),
		self::UPLOAD_SPACE_1GB                  => array(
			self::SPACE_1GB,
		),
		self::UPLOAD_SPACE_3GB                  => array(
			self::SPACE_3GB,
		),
		self::UPLOAD_SPACE_10GB                 => array(
			self::SPACE_10GB,
		),
		self::UPLOAD_SPACE_25GB                 => array(
			self::SPACE_25GB,
		),
		self::UPLOAD_SPACE_50GB                 => array(
			self::SPACE_50GB,
		),
		self::UPLOAD_SPACE_100GB                => array(
			self::SPACE_100GB,
		),
		self::UPLOAD_SPACE_200GB                => array(
			self::SPACE_200GB,
			array(
				'before' => LEGACY_200GB_CUTOFF_DATE,
				self::WPCOM_BUSINESS_PLANS,
				self::WPCOM_ECOMMERCE_PLANS,
			),
		),
		self::UPLOAD_SPACE_UNLIMITED            => array(
			array(
				'before' => '2019-08-01',
				self::WPCOM_BUSINESS_PLANS,
				self::WPCOM_ECOMMERCE_PLANS,
			),
		),
		self::UPLOAD_THEMES                     => array(
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
			self::WPCOM_PRO_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),

		/*
		 * UPLOAD_VIDEO_FILES - This feature is linked to the ability to upload video files to the website.
		 *
		 * Active for:
		 * - Simple and Atomic sites with Premium or up plan.
		 * - Jetpack sites with any plan.
		 */
		self::UPLOAD_VIDEO_FILES                => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_ALL_SITES,
		),

		self::VAULTPRESS_AUTOMATED_RESTORES     => array(
			self::JETPACK_PREMIUM_PLANS,
			self::JETPACK_BUSINESS_PLANS,
		),
		self::VAULTPRESS_BACKUP_ARCHIVE         => array(
			self::JETPACK_PREMIUM_PLANS,
			self::JETPACK_BUSINESS_PLANS,
		),
		self::VAULTPRESS_BACKUPS                => array(
			self::JETPACK_PERSONAL_AND_HIGHER,
		),
		self::VAULTPRESS_SECURITY_SCANNING      => array(
			self::JETPACK_BUSINESS_PLANS,
		),
		self::VAULTPRESS_STORAGE_SPACE          => array(
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
		self::VIDEO_HOSTING                     => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),
		self::VIDEOPRESS                        => array(
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_COMPLETE_PLANS,
			self::JETPACK_PERSONAL_PLANS,
			self::JETPACK_PREMIUM_PLANS,
			self::JETPACK_VIDEOPRESS_PLANS,
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
		self::VIDEOPRESS_1TB_STORAGE            => array(
			array(
				self::JETPACK_COMPLETE_PLANS,
				self::JETPACK_VIDEOPRESS_PLANS,
				self::JETPACK_PREMIUM_PLANS,
				self::JETPACK_BUSINESS_PLANS,
			),
		),
		// VIDEOPRESS_VIDEO - videopress/video requires a paid plan.
		self::VIDEOPRESS_VIDEO                  => array(
			self::WP_P2_PLUS_MONTHLY,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_BUSINESS_PLANS,
			self::JETPACK_PREMIUM_PLANS,
			self::EXCLUDE_PLANS => array(
				self::WPCOM_ECOMMERCE_TRIAL_PLANS,
			),
		),
		self::VIDEOPRESS_UNLIMITED_STORAGE      => array(
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
		self::WHATSAPP_BUTTON                   => array(
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
		self::WOOP                              => array(
			self::WPCOM_PRO_PLANS,
			self::WPCOM_BUSINESS_AND_HIGHER_PLANS,
		),
		self::WORDADS                           => array(
			self::JETPACK_STARTER_PLANS,
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_PREMIUM_AND_HIGHER,
			self::JETPACK_CREATOR_PLANS,
			self::JETPACK_GROWTH_PLANS,
		),

		/*
		 * WORDADS_JETPACK - `wordads-jetpack` is maintained as a legacy alias of `wordads` which was used to gate
		 * the feature in old versions of Jetpack.
		 * @see https://github.com/Automattic/jetpack/blob/c4f8fe120e1286e85f49e20e0f7fe22e44641449/projects/plugins/jetpack/class.jetpack-plan.php#L330.
		 */
		self::WORDADS_JETPACK                   => array(
			self::WPCOM_PREMIUM_AND_HIGHER_PLANS,
			self::JETPACK_PREMIUM_AND_HIGHER,
		),
	);
	/**
	 * Some A8C owned sites have additional features enabled. e.g. Jetpack SEO.
	 * This is an array of blog IDs where these features are enabled.
	 */
	public const A8C_SITES_WITH_ADDITIONAL_SEO_FEATURES = array(
		1, // https://wordpress.com/
		69197545, // br.support.wordpress.com
		69197545, // br.support.wordpress.com
		12084301, // he.support.wordpress.com
		12358344, // pt.support.wordpress.com
		20614491, // de.support.wordpress.com
		110643074, // es.support.wordpress.com
		9619154, // en.support.wordpress.com
		9620355, // fr.support.wordpress.com
		22718864, // ru.support.wordpress.com
		26068228, // ja.support.wordpress.com
		151395884, // ko.support.wordpress.com
		151398260, // sv.support.wordpress.com
		151398564, // ar.support.wordpress.com
		150300509, // it.support.wordpress.com
		150381433, // nl.support.wordpress.com
		150645278, // id.support.wordpress.com
		150881074, // tr.support.wordpress.com
		151397720, // zh-cn.support.wordpress.com
		151397956, // zh-tw.support.wordpress.com
		3584907, // en.blog.wordpress.com
		7944537, // ja.blog.wordpress.com
		11241806, // es.blog.wordpress.com
		8181651, // pt.blog.wordpress.com
		8994420, // fr.blog.wordpress.com
		66243751, // br.blog.wordpress.com
		196931530, // enwpgo.wordpress.com
		173323553, // eswpgo.wordpress.com
		173331416, // dewpgo.wordpress.com
		162814143, // frwpgo.wordpress.com
		173328699, // itwpgo.wordpress.com
		163161552, // brwpgo.wordpress.com
		53424024, // discover.wordpress.com
		489937, // dailypost.wordpress.com
		33534099, // developer.wordpress.com
		22994, // theme.wordpress.com
		16390, // learn.wordpress.com
		54117, // automattic.wordpress.com
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
	 * Treat free plan as a purchase so the logic for purchase_in_products_map are applied when checking for legacy features.
	 * As the free plan isn't actually a purchase, there is no subscribed_date, so we use the blog_registered_date instead.
	 *
	 * @param array  $purchases Reference to an array of purchases, this function adds a free plan to the end of the array passed in.
	 * @param string $site_type Site type to check. Can be 'wpcom' or 'jetpack'.
	 * @param string $blog_registered_date The date the blog was registered.
	 */
	public static function add_free_plan_purchase( &$purchases, $site_type, $blog_registered_date ) {
		$free_purchase_object                  = new stdClass();
		$free_purchase_object->product_slug    = "{$site_type}-all-sites";
		$free_purchase_object->subscribed_date = $blog_registered_date;

		$purchases[] = $free_purchase_object;
	}

	/**
	 * The products definition array ($products_map) may contain 1st-level sub-arrays with 'before' and/or 'after' keys
	 * used to restrict access to a feature based on when the purchase was made. If the $purchase is included in
	 * $products_map, and it was purchased within the defined date range (if a date range is defined), return true.
	 *
	 * Additionally, the 1st level of the array may contain the key 'excluded_plans' which is an array of plans that
	 * should be excluded from the feature. This is useful for when there are very specific exceptions that would
	 * otherwise require a lot of configuration to be added. If a plan is excluded, no further checks will be done.
	 *
	 * @param object $purchase A single purchase.
	 * @param array  $products_map A feature map definition array.
	 *
	 * @return bool If the purchase is included in $products_map and meets any purchase date-range rules.
	 */
	public static function purchase_in_products_map( $purchase, $products_map ) {

		// First check if the current purchase is excluded in the product definition.
		if ( isset( $products_map[ self::EXCLUDE_PLANS ] ) ) {
			$excluded_plans = $products_map[ self::EXCLUDE_PLANS ] ?? array();
			if ( ! empty( $excluded_plans ) && self::in_array_recursive( $purchase->product_slug, array( $excluded_plans ) ) ) {
				return false;
			}
			unset( $products_map[ self::EXCLUDE_PLANS ] );
		}

		// Loop through the first level of the $products_map array to identify potential legacy feature date ranges.
		foreach ( $products_map as $product_definition ) {

			if ( ! empty( $product_definition['product_type'] ) ) {
				if ( ! empty( $purchase->product_type ) && in_array( $purchase->product_type, $product_definition['product_type'], true ) ) {
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
				if ( self::in_array_recursive( $purchase->product_slug ?? null, array( $product_definition ) ) ) {
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

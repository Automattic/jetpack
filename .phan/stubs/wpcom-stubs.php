<?php
/**
 * Do not edit this directly! Update the definition file in the wpcom repo at
 * `bin/teamcity-builds/jetpack-stubs/stub-defs.php` and regenerate the stubs
 * by triggering the Jetpack Staging → Update WPCOM Stubs job in TeamCity.
 *
 * Stubs automatically generated from WordPress.com commit 8ea6e9c3894144c290918647a68ffd98cf547fff.
 */

namespace {
    \define('TRANSLATE_BLOG_ID', 101407);
    /**
     * @param object $blog
     * @return bool
     */
    function is_blog_jetpack($blog)
    {
    }
    /**
     * @param object $blog
     * @return bool
     */
    function is_blog_atomic($blog)
    {
    }
    /**
     * @param int $blog_id
     * @return bool
     */
    function is_wpforteams_site($blog_id)
    {
    }
    /**
     * @return bool
     */
    function wpcom_is_proxied_request()
    {
    }
    /**
     * @param int|false $user_id
     * @return bool
     */
    function is_automattician($user_id = \false)
    {
    }
    class WPCOM_JSON_API_Jetpack_Overrides
    {
    }
    class Jetpack_JSON_API_Get_Plugins_v1_2_Endpoint extends \Jetpack_JSON_API_Plugins_v1_2_Endpoint
    {
    }
    abstract class Jetpack_JSON_API_Plugins_v1_2_Endpoint extends \WPCOM_JSON_API_Endpoint
    {
        static $_response_format = array('slug' => '(safehtml) The plugin\'s .org slug', 'active' => '(boolean) The plugin status.', 'update' => '(object) The plugin update info.', 'name' => '(safehtml) The plugin\'s ID', 'display_name' => '(safehtml) The name of the plugin.', 'plugin_url' => '(url) Link to the plugin\'s web site.', 'version' => '(safehtml) The plugin version number.', 'description' => '(safehtml) Description of what the plugin does and/or notes from the author', 'author' => '(safehtml) The author\'s name', 'author_url' => '(url) The authors web site address', 'network' => '(boolean) Whether the plugin can only be activated network wide.', 'autoupdate' => '(boolean) Whether the plugin is automatically updated', 'autoupdate_translation' => '(boolean) Whether the plugin is automatically updating translations', 'uninstallable' => '(boolean) Whether the plugin is unistallable.', 'action_links' => '(array) An array of action links that the plugin uses.', 'file_mod_capabilities' => '(array:file_mod_capabilities) An array with details about file mods allowed.', 'log' => '(array:safehtml) An array of update log strings.');
    }
    abstract class WPCOM_JSON_API_Read_Endpoint extends \WPCOM_JSON_API_Post_Endpoint
    {
        /**
         * @param $post
         * @return object
         */
        public static function find_featured_worthy_media($post)
        {
        }
    }
    class Domain_Management
    {
        public static function get_paid_domains_with_icann_verification_status()
        {
        }
    }
    class Publicize extends \Automattic\Jetpack\Publicize\Publicize_Base
    {
        function __construct()
        {
        }
        /**
         * @param int $post_id
         * @param string $message
         * @param array $skip_connections
         * @param bool $check_feature
         * @return array|false|WP_Error
         */
        public function republicize_post($post_id, $message, $skip_connections, $check_feature = \false)
        {
        }
    }
    /**
     * @param int $blog_id
     * @return bool
     */
    function is_publicize_permanently_disabled($blog_id)
    {
    }
    /**
     * @param string $feature
     * @param string $message
     * @param string|null $docker_image_tag
     * @param string|null $guid
     * @param array|null $job
     * @param array $additional_params
     */
    function videopress_log($feature, $message, $docker_image_tag, $guid, $format, $job = \null, $additional_params = array())
    {
    }
    class WPCOM_Store_API
    {
        /**
         * @param int $blog_id
         * @return array|null
         */
        public static function get_current_plan($blog_id = 0)
        {
        }
    }
    class WPCOM_Store
    {
        /**
         * @deprecated 
         * @param int $user_id
         * @param int $blog_id
         * @param false $ids_only
         * @return array
         */
        public static function get_user_subscriptions($user_id = 0, $blog_id = 0, $ids_only = \false)
        {
        }
        /**
         * @return Store_Subscription[]
         */
        public static function get_subscriptions($blog_ids = 0, $user_ids = 0, $product_ids = 0, $metas = '')
        {
        }
    }
    class Store_Product_List
    {
        /**
         * @param int $blog_id
         * @return array
         */
        public static function get_site_specific_features_data($blog_id = 0)
        {
        }
        public static function api_only_get_active_plans_v1_4($blog_id = \false, $coupon_code = \null, $use_query_param_data = \false)
        {
        }
    }
    /**
     * @property Store_Transaction $transaction
     * @property Store_Product $product
     * @property float $cost
     */
    class Store_Subscription
    {
        /**
         * @var string|bool
         */
        public $meta = '';
    }
    function wpcom_plugins_display_marketplace()
    {
    }
    function vary_cache_on_function($function)
    {
    }
    function header_js()
    {
    }
    function global_css()
    {
    }
    /**
     * @param string $str
     * @return string
     */
    function widont($str = '')
    {
    }
    class WPCOM_Google_Sheets_Helper
    {
        /**
         * @param  int $user_id
         * @return Keyring_Access_Token
         */
        public static function get_google_drive_token_for_user_id($user_id)
        {
        }
        /**
         * @param  int $user_id
         * @return WPCOM_Google_Sheets_Helper|WP_Error
         */
        public static function create_for_user($user_id)
        {
        }
        /**
         * @param  string $name
         * @param  array $rows
         * @return Google_Service_Sheets_Spreadsheet|WP_Error
         */
        public function create_spreadsheet($name, ?array $rows)
        {
        }
    }
    class Google_Service_Sheets_Spreadsheet extends \Google_Collection
    {
        public $spreadsheetId;
        public $spreadsheetUrl;
    }
    /**
     * @param  string $theme
     * @param string $locale
     * @param array $options
     * @return array
     */
    function wpcom_get_theme_annotation($theme, $locale = 'en', $options = array())
    {
    }
    class WPCOM_Instagram_Gallery_Helper
    {
        /**
         * @return string|WP_Error
         */
        public static function get_connect_url()
        {
        }
        /**
         * @return array
         */
        public static function get_connections()
        {
        }
        /**
         * @param string $token_id
         * @return Keyring_Token|WP_Error
         */
        public static function get_token($token_id)
        {
        }
    }
    /**
     * @param array $params
     */
    function log2logstash($params)
    {
    }
    /**
     * @param int $site_id
     * @return bool
     */
    function wpcom_is_site_blocked_from_map_block($site_id)
    {
    }
    class MarketingEmailCampaigns
    {
        /**
         * @param int $user_id
         * @param int $blog_id
         * @param string $site_intent
         * @return bool
         */
        public static function start_tailored_use_case_new_site_workflows_if_eligible(int $user_id, int $blog_id, string $site_intent): bool
        {
        }
    }
    /**
     * @return bool
     */
    function bump_stats_extras($name, $value, $num = 1, $today = \false, $hour = \false)
    {
    }
    class Memberships_Product
    {
        const KEEP_SUBSCRIPTIONS = 'KEEP_SUBSCRIPTIONS';
        const CANCEL_SUBSCRIPTIONS = 'CANCEL_SUBSCRIPTIONS';
        /**
         * @param string $collision_preference
         * @return array
         */
        public function to_array(string $collision_preference = 'prefer-bd')
        {
        }
        /**
         * @param int $_blog_id
         * @param array $data
         * @return self|WP_Error
         */
        static function create($_blog_id, array $data)
        {
        }
        /**
         * @param int $_blog_id
         * @param string $type
         * @param string $currency
         * @param bool $is_editable
         * @return array[]|WP_Error
         */
        public static function generate_default_products($_blog_id, $type, $currency, $is_editable = \null)
        {
        }
        /**
         * @param int $_blog_id
         * @param int $post_id
         * @param bool $allow_deleted
         * @return Memberships_Product|WP_Error|null
         */
        public static function get_from_post($_blog_id, $post_id, $allow_deleted = \false)
        {
        }
        /**
         * @param $_blog_id
         * @return WP_Error|WP_Post[]|stdClass[]
         */
        public static function get_plans_posts_list($_blog_id)
        {
        }
        /**
         * @param int $_blog_id
         * @param string|null $type
         * @param bool|null $is_editable
         * @param bool $retrieve_deleted
         * @return array|WP_Error
         */
        public static function get_product_list($_blog_id, $type = \null, ?bool $is_editable = \null, $retrieve_deleted = \false)
        {
        }
    }
    class Memberships_Store_Sandbox
    {
        public function init($force = \false)
        {
        }
        /**
         * @return Memberships_Store_Sandbox
         */
        public static function get_instance(): \Memberships_Store_Sandbox
        {
        }
    }
    /**
     * @param int $user_id
     * @param int $blog_id
     * @param string $source
     * @return string
     */
    function get_memberships_connected_account_redirect($user_id, $blog_id, $source = 'gutenberg')
    {
    }
    /**
     * @param int $_blog_id
     * @param string $type
     * @param bool|null $is_editable
     * @return object
     */
    function get_memberships_settings_for_site($_blog_id, $type = \null, ?bool $is_editable = \null, $request_source = \null)
    {
    }
    /**
     * @param int|null $blog_id
     * @return bool
     */
    function wpcom_is_nav_redesign_enabled($blog_id = \null)
    {
    }
    class OpenAI implements \A8C\Vectorize\Text_Embedding_Provider
    {
        public function __construct(string $feature, array $logstash_defaults = [])
        {
        }
        public function request_dalle_generation(string $prompt, string $model = 'dall-e-2', array $options = array())
        {
        }
        public function request_chat_completion(array $backscroll = [], $max_tokens = \null, $model = \null, $completion_options = [], array $tools = [], $response_format = 'text', $tool_choice = \null)
        {
        }
        /**
         * @param string $prompt
         * @return true|WP_Error
         */
        public function moderate($prompt)
        {
        }
    }
    /**
     * @phan-return mixed
     */
    function wpcom_json_api_get($url, $args = array(), $flags = array(), $verbose = \false)
    {
    }
    class Site_Filter
    {
        public static function process_query_arg($query_args)
        {
        }
        public static function filter_blog($blog_id, $filters)
        {
        }
    }
    /**
     * @param string|int|WP_User $identity
     * @param string $event_name
     * @param array $properties
     * @param int $event_timestamp_millis
     * @return true|WP_Error
     */
    function tracks_record_event($identity, $event_name, $properties = array(), $event_timestamp_millis = \false)
    {
    }
    class WPCOM_API_Direct
    {
        public static function do_request($args, $body = \null)
        {
        }
    }
    /**
     * @param int $user
     * @param bool $ignore_user_blogs
     * @return array
     */
    function get_user_followed_blogs($user, $ignore_user_blogs)
    {
    }
    /**
     * @param int $user
     * @param int $number_of_recommendations
     * @return array|WP_Error
     */
    function get_user_following_recommendations($user, $number_of_recommendations)
    {
    }
    /**
     * @param string $url
     * @return array{0:int,1:int,2:int,3:string,mime:string,channels?:int,bits?:int}|false
     */
    function wpcom_getimagesize($uri)
    {
    }
    /**
     * @param string $slug
     */
    function require_lib($slug)
    {
    }
    class WPCOM_Masterbar
    {
        static function get_calypso_site_slug($site_id)
        {
        }
    }
    \define('JETPACK_SERVER__DOMAIN', 'jetpack.wordpress.com');
    \define('JETPACK_SERVER__DOMAIN', \wp_parse_url(\esc_url_raw(\wp_unslash($_SERVER['HTTP_HOST'])), \PHP_URL_HOST));
    /**
     * @return boolean
     */
    function is_jetpack_comments()
    {
    }
    /**
     * @return boolean
     */
    function is_jetpack_comments_user_logged_in()
    {
    }
    /**
     * @return never
     */
    function jetpack_comments_die($error = 'JPC_NOT_READY')
    {
    }
    /**
     * @return boolean
     */
    function wpcom_is_vip($blog_id = \null)
    {
    }
    function wpcom_actionbar_enqueue_scripts()
    {
    }
    /**
     * @param int|null $blog_id
     * @return bool
     */
    function is_automattic($blog_id = \null)
    {
    }
    /**
     * @param int|null $blog_id
     * @return bool
     */
    function wpcom_is_automattic_p2_site($blog_id = \null)
    {
    }
    /**
     * @param mixed $id_or_email
     * @param int $size
     * @param string $default
     * @param bool $force_display
     * @param bool $force_default
     * @return array{string, string}|false
     */
    function wpcom_get_avatar_url($id_or_email, $size = '96', $default = '', $force_display = \false, $force_default = \false)
    {
    }
    /**
     * @param string $url
     * @return string|false
     */
    function blavatar_domain($url)
    {
    }
    /**
     * @param string $domain
     * @return bool
     */
    function blavatar_exists($domain)
    {
    }
    /**
     * @param string $domain
     * @param string $ico_or_img
     * @param string|bool $default
     * @param bool $invalidate_cache
     * @return string|bool
     */
    function blavatar_url($domain, $ico_or_img = 'img', $size = 96, $default = \false, $invalidate_cache = \false)
    {
    }
    /**
     * @return bool
     */
    function has_gravatar($user_id)
    {
    }
    /**
     * @param WP_Customize $wp_customize
     */
    function wpcom_disable_customizer_site_icon($wp_customize)
    {
    }
    /**
     * @param int $blog_id
     * @return bool
     */
    function blaze_is_site_eligible($blog_id)
    {
    }
    class WPCOM_Business_Plugins
    {
        /**
         * @return WPCOM_Business_Plugins
         */
        public static function instance()
        {
        }
        /**
         * @param string $plugin
         * @return bool
         */
        public function activate_plugin($plugin)
        {
        }
    }
    /**
     * @param string $comment_content
     * @param WP_Comment|null $comment_object
     * @return string
     */
    function comment_like_button($comment_content = '', $comment_object = \null)
    {
    }
    class Jetpack_Custom_CSS
    {
        /**
         * @param array $args
         * @return int
         */
        public static function save($args = array())
        {
        }
        /**
         * @return bool
         */
        public static function skip_stylesheet()
        {
        }
        /**
         * @return string|false
         */
        public static function get_preprocessor_key()
        {
        }
        /**
         * @param boolean $compressed
         * @return string
         */
        public static function get_css($compressed = \false)
        {
        }
    }
    class domains
    {
        static function get_domain_products()
        {
        }
        static function is_domain_product($product_id)
        {
        }
    }
    /**
     * @param int $_blog_id
     * @return string|null
     */
    function get_primary_redirect($_blog_id = 0)
    {
    }
    /**
     * @param int $blog_id
     * @return bool
     */
    function is_simple_site_redirect($blog_id = 0)
    {
    }
    class Subscription_Mailer extends \WordPressMailer
    {
        public function __construct(\Blog_Subscriber $subscriber, $use_wp = \true)
        {
        }
        /**
         * @param mixed $my_posts
         * @return void
         **/
        public function send_post($my_posts, \Blog_Subscription $subscription = \null, $extra_text = '', $automattcher = \false)
        {
        }
    }
    class Blog_Subscriber
    {
        /**
         * @param mixed $data
         * @return void
         **/
        public function __construct($data = '')
        {
        }
        /**
         * @param string $email
         * @return mixed
         **/
        public static function get($email)
        {
        }
        /**
         * @param int $blog_id
         * @return Blog_Subscription|null
         */
        public function get_subscription(int $blog_id)
        {
        }
        /**
         * @param string $email
         * @return mixed
         **/
        public static function create($email)
        {
        }
    }
    class Blog_Subscription extends \WordPress_Subscription
    {
        /**
         * @param Blog_Subscriber $subscriber
         * @param  int $blog_id
         * @param bool $use_cache
         * @return string
         */
        public static function get_subscription_status_for_blog(\Blog_Subscriber $subscriber, $blog_id = 0, $use_cache = \true)
        {
        }
        /**
         * @param Blog_Subscriber $subscriber
         * @param integer $blog_id
         * @return boolean
         **/
        public static function is_subscribed(\Blog_Subscriber $subscriber, $blog_id = 0, $use_cache = \true)
        {
        }
    }
    class Email_Verification
    {
        public static function is_email_unverified($user_id = \false, $legacy_type = 'NEWKEY')
        {
        }
    }
    /**
     * @param array $args
     * @return string|null
     */
    function wpcom_enhanced_excerpt_extract_excerpt($args)
    {
    }
    function footercredits_register($wp_customize)
    {
    }
    class Jetpack_Sync_WPCOM_Shadow_Replicastore extends \Automattic\Jetpack\Sync\Replicastore
    {
    }
    class Keyring
    {
        /**
         * @param bool $force_load
         * @return Keyring
         */
        static function init($force_load = \false)
        {
        }
        /**
         * @return Keyring_Store
         */
        static function get_token_store()
        {
        }
    }
    abstract class Keyring_Store
    {
        /**
         * @return Keyring_Token|false
         */
        abstract function get_token($args = array());
    }
    class Keyring_Token
    {
        var $name = \false;
        var $meta = array();
        /**
         * @param int $window
         * @return bool
         */
        function is_expired($window = 0)
        {
        }
    }
    class Keyring_Access_Token extends \Keyring_Token
    {
    }
    /**
     * @param string $service
     * @param string $for
     * @return string
     */
    function wpcom_keyring_get_connect_url($service, $for)
    {
    }
    class Likes
    {
        /**
         * @param int $blog_id
         * @param int $comment_id
         * @return bool
         */
        static function comment_like_current_user_likes($blog_id, $comment_id)
        {
        }
    }
    /**
     * @param int|false $blog_id
     * @param int $limit
     * @return array<int,int>
     */
    function wpl_get_blogs_most_liked_posts($blog_id = \false, $limit = 25)
    {
    }
    /**
     * @param string $url
     * @param bool $is_logged_in_wpcom
     * @param string|null $redirect_to
     * @param string|null $login_variation
     * @param int|null $blog_id
     * @return string
     */
    function wpcom_logmein_redirect_url($url, $is_logged_in_wpcom = \false, $redirect_to = \null, $login_variation = \null, $blog_id = \null)
    {
    }
    /**
     * @param WP_Customize_Manager $wp_customize
     */
    function add_logotool_button($wp_customize)
    {
    }
    /**
     * @param int $blog_id
     * @return bool
     */
    function wpcom_site_has_videopress($blog_id = \null)
    {
    }
    /**
     * @param int $a_blog_id
     * @return bool
     */
    function is_jetpack_site($a_blog_id = 0)
    {
    }
    /**
     * @param int|null $blog_id
     * @return string
     */
    function wpcom_blog_site_id_label($blog_id = \null)
    {
    }
    /**
     * @param int $post_id
     * @param int|false|null $blog_id
     * @return bool
     */
    function is_post_freshly_pressed($post_id, $blog_id = \false)
    {
    }
    /**
     * @param int|false $user_id
     * @return int
     */
    function get_blog_count_for_user($user_id = \false)
    {
    }
    /**
     * @param array $args
     * @return array
     */
    function get_active_blogs_for_user($args = array())
    {
    }
    /**
     * @param  string $url
     * @return string
     * @internal 
     */
    function staticize_subdomain($url)
    {
    }
    /**
     * @param array $classes
     * @return string
     */
    function post_flair_service_enabled_sharing($classes)
    {
    }
    /**
     * @return bool
     */
    function is_private_blog_user($blog, $user)
    {
    }
    /**
     * @return bool
     */
    function is_private_blog($_blog_id = \null)
    {
    }
    /**
     * @param int $blog_id
     * @param array $args
     * @return array
     */
    function get_private_blog_users($blog_id, $args = array())
    {
    }
    /**
     * @param int $blog_id
     * @return int
     */
    function get_count_private_blog_users($blog_id)
    {
    }
    class WPCOM_RelatedPosts extends \Jetpack_RelatedPosts
    {
        /**
         * @return WPCOM_RelatedPosts
         */
        public static function init()
        {
        }
        /**
         * @return WPCOM_RelatedPosts_Raw
         */
        public static function init_raw()
        {
        }
    }
    class WPCOM_RelatedPosts_Raw extends \WPCOM_RelatedPosts
    {
    }
    /**
     * @return string
     */
    function http()
    {
    }
    /**
     * @return bool
     */
    function wpcom_should_load_theme_files_on_rest_api()
    {
    }
    /**
     * @deprecated 
     * @return bool
    */
    function wpcom_is_jetpack_search_supported($blog_id)
    {
    }
    /**
     * @phan-return mixed
     */
    function stats_footer($is_ajax = \false)
    {
    }
    /**
     * @phan-return mixed
     */
    function stats_get_daily_history($site_id, $blog_id, $table, $field, $end_date = \false, $num_days = 1, $and = '', $limit = 0, $summarize = \false, $rollup = \false)
    {
    }
    /**
     * @param int|null $blog_id
     * @param WP_User|int|null $user_id
     * @return bool
     */
    function stats_is_blog_user($blog_id = \null, $user_id = \null)
    {
    }
    /**
     * @return void
     **/
    function subscription_comment_form($id = \false, $echo = \true)
    {
    }
    /**
     * @param int|false $id
     * @return void
     */
    function show_subscription_checkbox($id = \false)
    {
    }
    /**
     * @return bool
     */
    function wpcom_subs_is_subscribed($args = array())
    {
    }
    /**
     * @return int
     */
    function wpcom_reach_total_for_blog($args = [])
    {
    }
    /**
     * @return false|int
     */
    function wpcom_subs_total_for_blog($args = array())
    {
    }
    /**
     * @return array
     **/
    function wpcom_fetch_subs_counts($include_paid_subscribers = \false)
    {
    }
    /**
     * @return boolean
     */
    function wpcom_is_child_theme()
    {
    }
    function queue_publish_post($post_id, $post = \null)
    {
    }
    /**
     * @param int $user_id
     * @param string $meta_key
     * @return mixed
     */
    function get_user_attribute($user_id, $meta_key)
    {
    }
    /**
     * @param int $user_id
     * @param string $meta_key
     * @param mixed $meta_value
     * @return bool
     */
    function update_user_attribute($user_id, $meta_key, $meta_value)
    {
    }
    /**
     * @param int $blog_id
     * @return string|boolean
     */
    function site_vertical($blog_id = \null)
    {
    }
    /**
     * @param int $blog_id
     * @param string $new_file_name
     * @param int $new_file_size
     * @return bool|array
     */
    function videopress_check_space_available_for_jetpack($blog_id, $new_file_name, $new_file_size)
    {
    }
    \define('VIDEOPRESS_ALLOWED_REST_API_CLIENT_IDS', array(\WORDPRESS_FOR_IOS_OAUTH_CLIENT_ID, \WORDPRESS_FOR_ANDROID_OAUTH_CLIENT_ID, \WORDPRESS_FOR_IOS_BETA_OAUTH_CLIENT_ID, \WORDPRESS_FOR_IOS_ALPHA_OAUTH_CLIENT_ID, \NEWSPACK_FOR_IOS_OAUTH_CLIENT_ID));
    /**
     * @param string $guid
     * @param bool $cache_bust
     * @param bool $ignore_soft_delete
     * @return object|bool
     */
    function video_get_info_by_guid($guid, $cache_bust = \false, $ignore_soft_delete = \false)
    {
    }
    /**
     * @return string
     */
    function video_get_title($blog_id, $post_id)
    {
    }
    /**
     * @return string
     */
    function video_get_description($blog_id, $post_id)
    {
    }
    /**
     * @param string $guid
     * @return string
     */
    function video_get_highest_resolution_image_url($guid)
    {
    }
    /**
     * @param int $blog_id
     * @return bool
     **/
    function video_is_private_wpcom_blog($blog_id)
    {
    }
    /**
     * @param int $blog_id
     * @return bool
     */
    function is_videopress_enabled_on_jetpack_blog($blog_id)
    {
    }
    /**
     * @param object $video_info
     * @return bool
     */
    function video_is_private($video_info)
    {
    }
    /**
     * @param object $video_info
     * @return string|false
     */
    function video_generate_auth_token($video_info)
    {
    }
    /**
     * @param string $guid
     * @return object
     */
    function video_wpcom_get_playback_jwt_for_guid($guid)
    {
    }
    /**
     * @return bool|float
     */
    function videopress_filter_jetpack_get_space_used()
    {
    }
    class Jetpack_Media_Sync
    {
        /**
         * @param int $blog_id
         * @return Jetpack_Media_Sync
         */
        public static function summon($blog_id)
        {
        }
        /**
         * @return bool
         */
        public function is_jetpack_site()
        {
        }
        /**
         * @param array $media_files
         * @param WPCOM_JSON_API $api
         * @param array $media_urls
         * @return array
         */
        public function upload_media($media_files, $api, $media_urls = array())
        {
        }
        /**
         * @return array
         */
        public function get_errors()
        {
        }
    }
    class WP_Enqueue_Dynamic_Script
    {
        /**
         * @param string $handle
         */
        public static function enqueue_script($handle)
        {
        }
    }
    /**
     * @param int|null $blog_id
     * @return int|string|false
     */
    function wpcom_get_blog_owner($blog_id = \null)
    {
    }
    /**
     * @param string $sticker
     * @param int|null $_blog_id
     * @param bool $bust_the_cache
     * @return bool
     */
    function has_blog_sticker($sticker, $_blog_id = \NULL, $bust_the_cache = \false)
    {
    }
    /**
     * @param string[] $stickers
     * @param int|null $_blog_id
     * @param bool $bust_the_cache
     * @return bool
     */
    function has_any_blog_stickers(array $stickers, $_blog_id = \NULL, $bust_the_cache = \false)
    {
    }
    class WPCOM_Features
    {
        public const ATOMIC = 'atomic';
        public const EMAIL_SUBSCRIPTION = 'email-subscription';
        public const INSTALL_PLUGINS = 'install-plugins';
        public const LEGACY_CONTACT = 'legacy-contact';
        public const LOCKED_MODE = 'locked-mode';
        public const MANAGE_PLUGINS = 'manage-plugins';
        public const SCHEDULED_UPDATES = 'scheduled-updates';
        public const SUBSCRIPTION_GIFTING = 'subscription-gifting';
    }
    /**
     * @param string $feature
     * @param int $blog_id
     * @return bool
     */
    function wpcom_site_has_feature($feature, $blog_id = 0)
    {
    }
    /**
     * @throws Error
     * @param int $blog_id
     * @return array
     */
    function wpcom_get_site_purchases($blog_id = 0)
    {
    }
    /**
     * @param Store_Subscription|object $purchase
     * @param string $feature
     * @return bool
     */
    function wpcom_purchase_has_feature($purchase, $feature)
    {
    }
    /**
     * @param string $feature
     * @return bool
     */
    function wpcom_feature_exists($feature)
    {
    }
    /**
     * @param string $new_path
     * @param string $path
     * @return string
     */
    function wpcom_wp_relative_upload_path($new_path, $path)
    {
    }
    /**
     * @param string $url
     * @param bool $is_import_file
     * @param int|null $blog_id
     * @return string
     */
    function wpcom_get_private_file($url, $is_import_file = \false, $blog_id = \null)
    {
    }
    function wpcom_load_theme_compat_file()
    {
    }
    class Jetpack_Fonts_Typekit
    {
        public static function maybe_override_for_advanced_mode($wp_customize)
        {
        }
    }
    class Jetpack_Fonts
    {
        /**
         * @return self
         */
        public static function get_instance()
        {
        }
        /**
         * @param  object $wp_customize
         * @return void
         */
        public function register_controls($wp_customize)
        {
        }
        /**
         * @return void
         */
        public function maybe_prepopulate_option()
        {
        }
    }
    class WPCOM_REST_API_V2_Endpoint_Jetpack_Auth extends \WP_REST_Controller
    {
        /**
         * @return WP_Error|true
         */
        public function is_jetpack_authorized_for_site()
        {
        }
    }
    function wp_kses_reject($content, $rejected_item = \false, $is_attribute = \false)
    {
    }
    /**
     * @param int $blog_id
     * @return string
     */
    function get_blog_lang_code($blog_id = 0)
    {
    }
    /**
     * @param int $blog_id
     * @param bool $fallback
     * @return bool|string
     */
    function wpcom_l10n_get_blog_locale_variant($blog_id = \null, $fallback = \false)
    {
    }
    /**
     * @param int $blog_id
     * @return bool|string
     */
    function wpcom_switch_to_blog_locale($blog_id = \null)
    {
    }
    /**
     * @param string $_locale
     * @return bool|string
     */
    function wpcom_switch_to_locale($_locale)
    {
    }
    /**
     * @param string $lang_code
     * @return int|false
     */
    function get_lang_id_by_code($lang_code)
    {
    }
}
namespace A8C\Billingdaddy\Users {
    /**
     * @param int $user_id
     * @return \WP_User|false
     */
    function get_wpcom_user($user_id)
    {
    }
}
namespace A8C\BloggingPrompts {
    class Answers
    {
        public static function get_count(int $prompt_id, $status = null)
        {
        }
        public static function is_answered_by_user(int $prompt_id, int $_user_id, $status = null)
        {
        }
        public static function get_sample_users_by(int $prompt_id, $status = null)
        {
        }
    }
}
namespace A8C\Display_Context {
    const NOTIFICATIONS = 'notifications';
    const READER = 'reader';
    /**
     * @return string
     */
    function get_current_context()
    {
    }
}
namespace A8C\TOS_Acceptance_Tracking {
    /**
     * @param array $file
     * @return array
     */
    function handle_uploads_wpcomtos_blog($file)
    {
    }
}
namespace BloggingPrompts {
    /**
     * @param string $prompt_html
     * @return string
     */
    function prompt_without_blocks($prompt_html)
    {
    }
}
namespace JITM {
    class Engine
    {
        public function get_top_messages($message_path, $user_id = null, $user_level = '', $query = '', $mobile_browser = false)
        {
        }
        /**
         * @param $id
         * @param $feature_class
         * @return bool
         */
        public static function dismiss($id, $feature_class)
        {
        }
    }
}
namespace Newsletter_Categories {
    /**
     * @param int|null $blog_id
     * @return array
     */
    function get_newsletter_categories(int $blog_id = null): array
    {
    }
    /**
     * @param int|null $blog_id
     * @param array    $term_ids
     * @return array
     */
    function get_blog_subscription_counts_per_category(int $blog_id = null, array $term_ids = []): array
    {
    }
    /**
     * @param int|null $blog_id
     * @param array|null $post_term_ids
     * @return int
     */
    function get_blog_subscriptions_aggregate_count(int $blog_id = null, $post_term_ids = []): int
    {
    }
}
namespace WPCOM\Jetpack_AI\Usage {
    class Helper
    {
        /**
         * @param int $blog_id
         * @return int
         */
        public static function get_all_time_requests_count($blog_id)
        {
        }
        /**
         * @param int $blog_id
         * @return array
         */
        public static function get_period_data($blog_id)
        {
        }
        /**
         * @param int $blog_id
         * @return array
         */
        public static function get_current_tier($blog_id)
        {
        }
        /**
         * @param int $blog_id
         * @return array|null
         */
        public static function get_next_tier($blog_id)
        {
        }
        /**
         * @return array[]
         */
        public static function get_tier_plans_list()
        {
        }
        /**
         * @param int $blog_id
         * @return int
         */
        public static function get_free_requests_limit($blog_id)
        {
        }
        /**
         * @param int $blog_id
         * @return boolean
         */
        public static function is_over_limit($blog_id)
        {
        }
        public static function ai_tier_plans_enabled()
        {
        }
        /**
         * @param int $blog_id
         * @return boolean
         */
        public static function site_requires_upgrade($blog_id)
        {
        }
        public static function get_costs()
        {
        }
        public static function get_upgrade_url($blog_id)
        {
        }
    }
}
namespace WPForTeams {
    /**
     * @param int $blog_id
     * @return bool
     */
    function is_wpforteams_site($blog_id)
    {
    }
    /**
     * @param int $blog_id
     * @return mixed
     */
    function has_p2_plus_plan($blog_id)
    {
    }
}
namespace WPForTeams\Workspace {
    /**
     * @param int $blog_id
     * @return bool
     */
    function is_workspace_hub($blog_id)
    {
    }
    /**
     * @param int $blog_id
     * @return false|int
     */
    function get_hub_blog_id_from_blog_id($blog_id)
    {
    }
}

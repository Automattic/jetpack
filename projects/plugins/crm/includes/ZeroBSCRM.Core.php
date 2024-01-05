<?php
/**
 * Jetpack CRM Core
 *
 * @author   Woody Hayday, Mike Stott
 * @package  ZeroBSCRM
 * @since    2.27
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Main ZeroBSCRM Class.
 *
 * @class ZeroBSCRM
 * @version 2.27
 */
final class ZeroBSCRM {

	/**
	 * ZeroBSCRM version.
	 *
	 * @var string
	 */
	public $version = '6.3.2';

	/**
	 * WordPress version tested with.
	 *
	 * @var string
	 */
	public $wp_tested = '6.3';

	/**
	 * WordPress update API version.
	 *
	 * @var string
	 */
	public $api_ver = '1.0';

	/**
	 * Jetpack CRM update API version.
	 *
	 * @var string
	 */
	public $update_api_version = '1.0';

	/**
	 * ZeroBSCRM DB version.
	 *
	 * @var string
	 */
	public $db_version = '3.0';

	/**
	 * Database details.
	 *
	 * @var array
	 */
	public $database_server_info = array();

	/**
	 * ZeroBSCRM DAL version.
	 *
	 * @var string
	 */
	public $dal_version = '3.0';

	/**
	 * ZeroBSCRM Extension Compatible versions
	 * Stores which extensions are viable to use with newly-migrated v3.0
	 *
	 * @var string
	 */
	public $compat_versions = array(

		// v3.0 Migration needed a 'minimum version' for any extensions which might not work with v3.0 but were active premigration
		// 15th Nov - as numbers it does not like the 1.4.1 type format so added as strings.
		'v3extminimums' => array(

			'advancedsegments'   => '1.3',
			'apiconnector'       => '1.6',
			'automations'        => '1.4.1',
			'aweber'             => '1.2',
			'awesomesupport'     => '2.5',
			'batchtag'           => '2.3',
			'passwordmanager'    => '1.4.1',
			'clientportalpro'    => '1.7',
			'contactform'        => '2.5',
			'convertkit'         => '2.5',
			'csvpro'             => '2.0',
			'envato'             => '2.4.2',
			'exitbee'            => '1.1',
			'funnels'            => '1.2',
			'googlecontact'      => '2.6',
			'gravity'            => '2.6',
			'groove'             => '2.6',
			'invpro'             => '2.6',
			'livestorm'          => '1.1',
			'mailcamp'           => '2.0.4',
			'mailchimp'          => '2.6',
			'membermouse'        => '1.5',
			'optinmonster'       => '1.1',
			'paypal'             => '2.6.1',
			'registrationmagic'  => '1.1',
			'salesdash'          => '2.6',
			'stripe'             => '2.6.2',
			'systememail'        => '1.1',
			'twilio'             => '1.5',
			'woosync'            => '2.9',
			'wordpressutilities' => '1.2',
			'worldpay'           => '2.4',

		),

	);

	/**
	 * ZeroBSCRM DAL .
	 *
	 * @var object (DAL Class init) ;)
	 */
	public $DAL = false;

	/**
	 * Dependency checker
	 *
	 * @var object JPCRM_DependencyChecker init
	 */
	public $dependency_checker = false;

	/**
	 * Feature sniffer
	 *
	 * @var object JPCRM_FeatureSniffer init
	 */
	public $feature_sniffer = false;

	/**
	 * WordPress User Integrations
	 *
	 * @var object Wordpress_User_Integration class
	 */
	public $wordpress_user_integration = false;

	/**
	 * Zapier integration
	 *
	 * @var ?
	 */
	public $zapier = false;

	/**
	 * Fonts
	 *
	 * @var object JPCRM_Fonts init
	 */
	public $fonts = false;

	/**
	 * DB1 compatability support
	 *
	 * @var Bool - if true, basically $obj['meta'] is a clone of $obj itself (To be disabled once safely in DAL2 + updated extensions)
	 */
	public $db1CompatabilitySupport = false;

	/**
	 * DB2 compatability support
	 *
	 * @var Bool - if true, basically $obj['meta'] is a clone of $obj itself (To be disabled once safely in DAL3 + updated extensions)
	 * This variant accounts for stray objs in quotes, trans, invs, etc.
	 */
	public $db2CompatabilitySupport = false;

	/**
	 * ZeroBSCRM DB Version Switch.
	 *
	 * @var string
	 */
	public $DBVER = 1;

	/**
	 * The single instance of the class.
	 *
	 * @var ZeroBSCRM
	 * @since 2.1
	 */
	protected static $_instance = null;

	/**
	 * JP CRM Page Loaded (KEY - used for screenoptions) (equivilent of pagenow)
	 *
	 * @var string
	 */
	public $pageKey = 'root';

	/**
	 * WordPress Admin notice stack
	 *
	 * @var array
	 */
	public $admin_notices = array();

	/**
	 * Hide admin_notices for specified pages
	 *
	 * @var array
	 */
	public $hide_admin_pages = array(

		// hidden due to #gh-1442
		'manage-tasks',
		'zerobscrm-csvimporterlite-app',

	);

	/**
	 * Template path, this is where we look in the theme directory for templates
	 *
	 * @var string
	 */
	public $template_path = 'jetpack-crm';

	/**
	 * Extensions instances
	 *
	 * @var Jetpack CRM Extensions
	 */
	public $extensions = null;

	/**
	 * External Sources
	 *
	 * @var Jetpack CRM External Sources
	 */
	public $external_sources = null;

	/**
	 * Settings Object
	 *
	 * @var Jetpack CRM Settings Object
	 */

	public $settings = null;

	/**
	 * Internal Automator Block
	 *
	 * @var Bool - if true, IA will not fire anything :)
	 */
	public $internalAutomatorBlock = false;

	/**
	 * Metaboxes Object
	 *
	 * @var Jetpack CRM Metaboxes Object
	 */

	public $metaboxes = null;

	/**
	 * Menus Object
	 *
	 * @var Jetpack CRM Menus Array
	 * This ultimately adds any WP menus that need injecting
	 */
	private $menu = null;

	/**
	 * Learn Menu Object
	 *
	 * @var Jetpack CRM Learn menu class instance
	 */
	public $learn_menu = null;

	/**
	 * URLS Array
	 *
	 * @var Jetpack CRM URLS list
	 */
	public $urls;

	/**
	 * Slugs Array
	 *
	 * @var Jetpack CRM Slugs list
	 */
	public $slugs;

	/**
	 * Transient Array
	 *
	 * @var Jetpack CRM Transients list
	 */
	public $transients;

	/**
	 * Houses all module classes
	 * e.g. $zbs->modules->woosync
	 */
	public $modules = null;

	/**
	 * Package installer (Automattic\JetpackCRM\Package_Installer)
	 */
	public $package_installer = null;

	/**
	 * OAuth handler
	 */
	public $oauth = null;

	/**
	 * Endpoint Listener
	 */
	public $listener = null;

	/**
	 * Encryption tooling
	 */
	public $encryption = null;

	/**
	 * Included Array (means we can not 'reinclude' stripe etc.)
	 */
	public $included = array(

		'stripe' => false,

	);

	/**
	 * Libraries included (3.0.12+)
	 * Note: All paths need to be prepended by ZEROBSCRM_PATH before use
	 */
	private $libs = array();

	/**
	 * Usage Tracking
	 *
	 * @var object Usage tracking class
	 */
	public $tracking = false;

	/**
	 * Page Messages Array
	 * Experimental: stores msgs such as "Contact Updated"
	 *
	 * @var msg arr
	 */
	public $pageMessages;

	/**
	 * Templating: placeholders
	 *
	 * @var object Placeholder Class
	 */
	public $templating_placeholders = false;

	/**
	 * Acceptable mime types Array
	 *
	 * @var Jetpack CRM Acceptable mime types list
	 */
	public $acceptable_mime_types;

	/**
	 * Acceptable html array
	 *
	 * @var Jetpack CRM Acceptable html types list
	 * Was previously: $zeroBSCRM_allowedHTML
	 */
	public $acceptable_html = array(
		'h1'         => array(
			'class' => array(),
			'style' => array(),
			'id'    => array(),
		),
		'h2'         => array(
			'class' => array(),
			'style' => array(),
			'id'    => array(),
		),
		'h3'         => array(
			'class' => array(),
			'style' => array(),
			'id'    => array(),
		),
		'h4'         => array(
			'class' => array(),
			'style' => array(),
			'id'    => array(),
		),
		'h5'         => array(
			'class' => array(),
			'style' => array(),
			'id'    => array(),
		),
		'h6'         => array(
			'class' => array(),
			'style' => array(),
			'id'    => array(),
		),
		'a'          => array(
			'href'   => array(),
			'title'  => array(),
			'target' => array(),
			'class'  => array(),
		),
		'b'          => array(),
		'br'         => array(),
		'em'         => array(),
		'strong'     => array(),
		'ul'         => array(),
		'ol'         => array(),
		'li'         => array(),
		'p'          => array(
			'style' => true,
		),
		'div'        => array(
			'class' => array(),
			'style' => array(),
			'id'    => array(),
		),
		'span'       => array(
			'class' => array(),
			'style' => array(),
			'id'    => array(),
		),
		'img'        => array(
			'class' => array(),
			'style' => array(),
			'src'   => array(),
		),
		'i'          => array(
			'class' => array(),
		),
		'table'      => array(
			'tr'    => array(
				'th'    => array(
					'label' => array(),
				),
				'class' => array(),
				'label' => array(),
				'th'    => array(),
			),
			'style' => array(),
			'label' => array(),
		),
		'td'         => array(),
		'tr'         => array(),
		'blockquote' => array(),
		'del'        => array(),
		'hr'         => array(),
	);

	/**
	 * Acceptable (restricted) html array
	 *
	 * @var Jetpack CRM Acceptable (restricted) html types list
	 * (e.g. for use in contact logs)
	 */
	public $acceptable_restricted_html = array(
		'a'          => array(
			'href'  => array(),
			'title' => array(),
			'id'    => array(),
		),
		'br'         => array(),
		'em'         => array(),
		'strong'     => array(),
		'blockquote' => array(),
	);

	/**
	 * Error Codes Array
	 * Experimental: loads + stores error codes, (only when needed/requested)
	 *
	 * @var error code arr
	 */
	private $errorCodes;

	/**
	 * Main ZeroBSCRM Instance.
	 *
	 * Ensures only one instance of ZeroBSCRM is loaded or can be loaded.
	 *
	 * @since 2.27
	 * @static
	 * @return ZeroBSCRM - Main instance.
	 */
	public static function instance() {
		if ( self::$_instance === null ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}

	/**
	 * Unserializing instances of this class is forbidden.
	 *
	 * @since 2.1
	 */
	public function __wakeup() {
		zerobscrm_doing_it_wrong( __FUNCTION__, __( 'Cheatin&#8217; huh?', 'zero-bs-crm' ), '2.1' );
	}

	/**
	 * Auto-load in-accessible properties on demand - What is this wizadrey?
	 *
	 * @param mixed $key Key name.
	 * @return mixed
	 */
	/*
	See: http://php.net/manual/en/language.oop5.overloading.php#object.get
	public function __get( $key ) {
		if ( in_array( $key, array( 'payment_gateways', 'shipping', 'mailer', 'checkout' ), true ) ) {
			return $this->$key();
		}
	}

	*/

	/**
	 * Jetpack CRM Constructor.
	 */
	public function __construct() {

		// Simple global definitions without loading any core files...
		// required for verify_minimum_requirements()

		// define constants & globals
		$this->define_constants();

		// Verify we have minimum requirements (e.g. DAL3.0 and extension versions up to date)
		if ( $this->verify_minimum_requirements() ) {

			$this->debugMode();

			// } Load includes
			$this->includes();

			// urls, slugs, (post inc.)
			$this->setupUrlsSlugsEtc();

			// } Initialisation
			$this->init_hooks();

			/**
			 * Feature flag to hide the new onboarding wizard page.
			 *
			 * @ignore
			 * @since TBD
			 *
			 * @param bool Determine if we should initialize the new OBW logic.
			 */
			if ( apply_filters( 'jetpack_crm_feature_flag_onboarding_wizard_v2', false ) ) {
				Automattic\Jetpack_CRM\Onboarding_Wizard\Bootstrap::get_instance();
			}

			// } Post Init hook
			do_action( 'zerobscrm_loaded' );

		} else {
			// used by some extensions to determine if current page is an admin page
			require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.AdminPages.Checks.php';

			// extensions use the dependency checker functions
			require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-dependency-checker.php';
			$this->dependency_checker = new JPCRM_DependencyChecker();
		}

		// display any wp admin notices in the stack
		// needs to be outside of any above functionality as used for exposing failed verify_minimum_requirements()
		add_action( 'admin_notices', array( $this, 'wp_admin_notices' ) );
	}

	/**
	 * Verify we have minimum requirements (e.g. DAL3.0)
	 */
	private function verify_minimum_requirements() {

		// fresh installs get a pass so that migrations can run
		// ... as soon as DB is installed, this'll be skipped

		// gather database server info
		$this->get_database_server_info();

		if ( ! $this->is_database_installed() ) {

			return true;

		}

		// v5.0+ JPCRM requires DAL3+
		if ( ! $this->isDAL3() ) {

			// we need urls
			$this->setupUrlsSlugsEtc();

			// build message
			$message_html = '<p>' . sprintf( esc_html__( 'This version of CRM (%1$s) requires an upgraded database (3.0). Your database is using an older version than this (%2$s). To use CRM you will need to install version 4 of CRM and run the database upgrade.', 'zero-bs-crm' ), $this->version, $this->dal_version ) . '</p>'; // phpcs:ignore WordPress.WP.I18n.MissingTranslatorsComment

			##WLREMOVE
			$message_html  = '<p>' . sprintf( esc_html__( 'This version of Jetpack CRM (%1$s) requires an upgraded database (3.0). Your database is using an older version than this (%2$s). To use Jetpack CRM you will need to install version 4 of Jetpack CRM and run the database upgrade.', 'zero-bs-crm' ), $this->version, $this->dal_version ) . '</p>'; // phpcs:ignore WordPress.WP.I18n.MissingTranslatorsComment
			$message_html .= '<p><a href="' . esc_url( $this->urls['kb-pre-v5-migration-todo'] ) . '" target="_blank" class="button">' . __( 'Read the guide on migrating', 'zero-bs-crm' ) . '</a></p>';
			##/WLREMOVE

			$this->add_wp_admin_notice(
				'',
				array(
					'class' => 'warning',
					'html'  => $message_html,
				)
			);

			return false;

		} elseif ( ! function_exists( 'openssl_get_cipher_methods' ) ) {

			// build message
			$message_html  = '<p>' . sprintf( __( 'Jetpack CRM uses the OpenSSL extension for PHP to properly protect sensitive data. Most PHP environments have this installed by default, but it seems yours does not; we recommend contacting your host for further help.', 'zero-bs-crm' ), $this->version, $this->dal_version ) . '</p>';
			$message_html .= '<p><a href="' . esc_url( 'https://www.php.net/manual/en/book.openssl.php' ) . '" target="_blank" class="button">' . __( 'PHP docs on OpenSSL', 'zero-bs-crm' ) . '</a></p>';

			$this->add_wp_admin_notice(
				'',
				array(
					'class' => 'warning',
					'html'  => $message_html,
				)
			);
			return false;
		}

		return true;
	}

	/**
	 * Verify our extensions meet minimum requirements (e.g. DAL3.0)
	 * Where extensions are found which do not meet requirements, these are deactivated and notices posted
	 * Note: This has to fire lower down the stack than `verify_minimum_requirements()`
	 *       because it relies on extension linkages
	 */
	private function verify_extension_minimum_requirements() {

		// v5.0+ JPCRM/DAL3 requires these extension versions
		$installed_extensions = zeroBSCRM_installedProExt();
		if ( is_array( $installed_extensions ) ) {

			foreach ( $installed_extensions as $extension_name => $extension_info ) {

				// get minimum version okay with v3
				$minimum_version = 99.99;
				if ( isset( $this->compat_versions['v3extminimums'][ $extension_info['key'] ] ) ) {
					$minimum_version = $this->compat_versions['v3extminimums'][ $extension_info['key'] ];
				}

				// do we have an active outdated version?
				if ( $extension_info['active'] == 1 && $minimum_version > 0 && ! ( version_compare( $extension_info['ver'], $minimum_version ) >= 0 ) ) {

					// deactivate
					jpcrm_extensions_deactivate_by_key( $extension_info['key'] );

					// show warning notice
					$message_html = '<p>' . sprintf( __( 'Your CRM extension %1$s (v%2$s) is not compatible with this version of CRM. You will need to run a database upgrade to use this extension. For now this extension has been deactivated.', 'zero-bs-crm' ), $extension_name, $extension_info['ver'] ) . '</p>';

					##WLREMOVE
					$message_html  = '<p>' . sprintf( __( 'Your Jetpack CRM extension %1$s (v%2$s) is not compatible with this version of Jetpack CRM. You will need to run a database upgrade to be able to use this extension. For now this extension has been deactivated.', 'zero-bs-crm' ), $extension_name, $extension_info['ver'] ) . '</p>';
					$message_html .= '<p><a href="' . esc_url( $this->urls['kb-pre-v5-migration-todo'] ) . '" target="_blank" class="button">' . __( 'Read the guide on migrating', 'zero-bs-crm' ) . '<a></p>';
					##/WLREMOVE

					$this->add_wp_admin_notice(
						'',
						array(
							'class' => 'warning',
							'html'  => $message_html,
						)
					);

				}
			}
		}

		return false;
	}

	/**
	 * Add admin notice to the stack
	 */
	private function add_wp_admin_notice( $page, $notice ) {

		// validate existing
		if ( ! is_array( $this->admin_notices ) ) {
			$this->admin_notices = array();
		}

		// add to stack if new page
		if ( ! isset( $this->admin_notices[ $page ] ) ) {
			$this->admin_notices[ $page ] = array();
		}

		// add notice to stack
		$this->admin_notices[ $page ][] = $notice;
	}

	/**
	 * Output any admin notices in the stack
	 */
	public function wp_admin_notices() {

		global $pagenow;

		if ( is_array( $this->admin_notices ) ) {

			foreach ( $this->admin_notices as $page => $notices ) {

				// matching page or all pages (empty)
				if ( $pagenow == $page || empty( $page ) ) {

					foreach ( $notices as $notice ) {

						echo '<div class="notice notice-' . esc_attr( $notice['class'] ) . ' is-dismissible">' . $notice['html'] . '</div>';

					}
				}
			}
		}
	}

	/**
	 *   Maintain a list of Jetpack CRM extension slugs here.
	 *      (This was an MS initiative for updates/licensing, WH removed 27/11/18, doing via Keys = rebrandr friendly)
	 */
	/*
	public $zeroBSCRM_extensionSlugs = array(

		'ZeroBSCRM_BulkTagger.php',


	);
	 */

	/**
	 * Define ZeroBSCRM Constants.
	 */
	private function define_constants() {

		// Main paths etc.
		$this->define( 'ZBS_ABSPATH', dirname( ZBS_ROOTFILE ) . '/' );
		$this->define( 'ZEROBSCRM_PATH', plugin_dir_path( ZBS_ROOTFILE ) );
		$this->define( 'ZEROBSCRM_URL', plugin_dir_url( ZBS_ROOTFILE ) );

		// Template paths
		$this->define( 'ZEROBSCRM_TEMPLATEPATH', ZEROBSCRM_PATH . 'templates/' );
		$this->define( 'ZEROBSCRM_TEMPLATEURL', ZEROBSCRM_URL . 'templates/' );

		// include/module paths
		$this->define( 'ZEROBSCRM_INCLUDE_PATH', ZEROBSCRM_PATH . 'includes/' );
		$this->define( 'JPCRM_MODULES_PATH', ZEROBSCRM_PATH . 'modules/' );

		// } define that the CORE has been loaded - for backwards compatibility with other extensions
		$this->define( 'ZBSCRMCORELOADED', true );

		// } Menu types
		$this->define( 'ZBS_MENU_FULL', 1 );
		$this->define( 'ZBS_MENU_SLIM', 2 );
		$this->define( 'ZBS_MENU_CRMONLY', 3 );

		// } Debug
		$this->define( 'ZBS_CRM_DEBUG', true );
	}

	private function debugMode() {

		if ( defined( 'ZBS_CRM_DEBUG' ) ) {
			/*
			ini_set('display_errors', 1);
			ini_set('display_startup_errors', 1);
			error_reporting(E_ALL);
			*/
		}
	}

	// shorthand for lack of presence of any DB presence
	public function is_database_installed() {

		global $ZBSCRM_t, $wpdb;

		// we need db
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Database.php';

		// check
		$tables = $wpdb->get_results( "SHOW TABLES LIKE '" . $ZBSCRM_t['contacts'] . "'" );

		return ( count( $tables ) > 0 );
	}

	/**
	 * Retrieves MySQL/MariaDB/Percona database server info
	 */
	public function get_database_server_info() {

		if ( empty( $this->database_server_info ) ) {
			global $wpdb;
			$raw_version                = $wpdb->get_var( 'SELECT VERSION()' );
			$version                    = preg_replace( '/[^0-9.].*/', '', $raw_version );
			$is_mariadb                 = ! ( stripos( $raw_version, 'mariadb' ) === false );
			$database_server_info       = array(
				'raw_version' => $raw_version,
				'version'     => $version,
				'is_mariadb'  => $is_mariadb,
			);
			$this->database_server_info = $database_server_info;
		}
		return $this->database_server_info;
	}

	// } Use this for shorthand checking old DAL
	public function isDAL1() {

		// is DAL = 1.0
		return ( version_compare( $this->dal_version, '2.53' ) < 0 );
	}

	// } Use this for shorthand checking new DAL additions
	// this says "is At least DAL2"
	public function isDAL2() {

		// is DAL > 1.0
		return ( version_compare( $this->dal_version, '1.0' ) > 0 );
	}

	// } Use this for shorthand checking new DAL additions
	// this says "is At least DAL3"
	public function isDAL3() {

		// is DAL > 1.0
		return ( version_compare( $this->dal_version, '2.53' ) > 0 );
	}

	// } Use this to output the number of plugins with "Jetpack CRM" in the name
	public function extensionCount( $activatedOnly = false ) {

		/*
		Following func: zeroBSCRM_extensionsInstalledCount
		... will get all active rebrandr extensions,
		... and all active/inactive branded extensions

		... and returns a count here */
		return zeroBSCRM_extensionsInstalledCount( $activatedOnly );
	}

	private function setupUrlsSlugsEtc() {

		// array check
		if ( ! is_array( $this->urls ) ) {
			$this->urls = array();
		}
		if ( ! is_array( $this->slugs ) ) {
			$this->slugs = array();
		}
		if ( ! is_array( $this->transients ) ) {
			$this->transients = array();
		}
		if ( ! is_array( $this->acceptable_mime_types ) ) {
			$this->acceptable_mime_types = array();
		}
		if ( ! is_array( $this->pageMessages ) ) {
			$this->pageMessages = array();
		}

		// Urls
		$this->urls['home']              = 'https://jetpackcrm.com';
		$this->urls['kb']                = 'https://kb.jetpackcrm.com';
		$this->urls['support']           = 'https://kb.jetpackcrm.com/crm-support/';
		$this->urls['feedback']          = 'https://kb.jetpackcrm.com/crm-support/';
		$this->urls['pricing']           = 'https://jetpackcrm.com/pricing/';
		$this->urls['usagetrackinginfo'] = 'https://jetpackcrm.com/usage-tracking/';
		$this->urls['support-forum']     = 'https://wordpress.org/support/plugin/zero-bs-crm';

		##WLREMOVE
		$this->urls['betafeedbackemail'] = 'hello@jetpackcrm.com'; // SPECIFICALLY ONLY USED FOR FEEDBACK ON BETA RELEASES, DO NOT USE ELSEWHERE
		##/WLREMOVE

		$this->urls['docs']              = 'https://kb.jetpackcrm.com/';
		$this->urls['productsdatatools'] = 'https://jetpackcrm.com/data-tools/';
		$this->urls['extimgrepo']        = 'https://jetpackcrm.com/_plugin_dependent_assets/_i/';
		$this->urls['rateuswporg']       = 'https://wordpress.org/support/view/plugin-reviews/zero-bs-crm?filter=5#new-post';
		$this->urls['extdlreporoot']     = 'https://jetpack-crm-cdn.s3.amazonaws.com/';
		$this->urls['extdlrepo']         = $this->urls['extdlreporoot'] . 'ext/';
		$this->urls['extdlfonts']        = $this->urls['extdlreporoot'] . 'fonts/';
		$this->urls['extdlpackages']     = $this->urls['extdlreporoot'] . 'packages/';
		$this->urls['apidocs']           = 'https://automattic.github.io/jetpack-crm-api-docs/';
		$this->urls['oauthdocs']         = 'https://kb.jetpackcrm.com/knowledge-base/using-gmail-with-jetpack-crm-mail-delivery-system/#setting-up-gmail-oauth-connection-and-mail-delivery-method';
		$this->urls['woosync']           = 'https://jetpackcrm.com/woocommerce/';
		$this->urls['woomanagingorders'] = 'https://woocommerce.com/document/managing-orders/#order-statuses';
		$this->urls['core-automations']  = 'https://jetpackcrm.com/features/automations';

		// used for ext manager:
		$this->urls['checkoutapi']       = 'https://jetpackcrm.com/wp-json/zbsextensions/v1/extensions/0';
		$this->urls['howtoinstall']      = 'https://kb.jetpackcrm.com/knowledge-base/how-do-i-install-a-zero-bs-extension/';
		$this->urls['apiconnectorsales'] = 'https://jetpackcrm.com/product/api-connector/';
		$this->urls['autonumberhelp']    = 'https://kb.jetpackcrm.com/knowledge-base/custom-field-type-autonumber/';
		$this->urls['akamode']           = 'https://jetpackcrm.com/feature/aka-mode/';
		$this->urls['licensinginfo']     = 'https://kb.jetpackcrm.com/knowledge-base/yearly-subscriptions-refunds/';
		$this->urls['easyaccessguide']   = 'https://kb.jetpackcrm.com/knowledge-base/easy-access-links-for-client-portal/';

		// API v3.0 - licensing - 5/12/18
		$this->urls['api']           = 'https://app.jetpackcrm.com/api/updates/updates';
		$this->urls['apilocalcheck'] = 'https://app.jetpackcrm.com/api/updates/localcheck';
		$this->urls['smm']           = 'https://app.jetpackcrm.com/api/welcome-wizard';
		$this->urls['api-support']   = 'https://app.jetpackcrm.com/api/support';

		// account
		$this->urls['account']     = 'https://app.jetpackcrm.com/';
		$this->urls['licensekeys'] = 'https://app.jetpackcrm.com/license-keys';

		// } sales urls
		$this->urls['products']          = 'https://jetpackcrm.com/extensions/';
		$this->urls['extcsvimporterpro'] = 'https://jetpackcrm.com/product/csv-importer-pro/';
		$this->urls['invpro']            = 'https://jetpackcrm.com/product/invoicing-pro/';
		$this->urls['upgrade']           = 'https://jetpackcrm.com/checkout/?plan=entrepreneur&utm_source=plugin&utm_medium=plugin&utm_campaign=welcome_upgrade';
		$this->urls['extcpp']            = 'https://jetpackcrm.com/product/client-portal-pro/';
		$this->urls['extcal']            = 'https://jetpackcrm.com/product/calendar-pro/';
		$this->urls['roadtov3']          = 'https://jetpackcrm.com/road-to-v3/';
		$this->urls['advancedsegments']  = 'https://jetpackcrm.com/product/advanced-segments/';
		$this->urls['bulktagger']        = 'https://jetpackcrm.com/product/bulk-tagger/';
		$this->urls['salesdash']         = 'https://jetpackcrm.com/product/sales-dashboard/';
		$this->urls['connect-multi-woo'] = 'https://jetpackcrm.com/feature/multiple-woocommerce-stores/';
		$this->urls['woosync']           = 'https://jetpackcrm.com/woocommerce/';
		$this->urls['mailpoet']          = 'https://jetpackcrm.com/feature/mailpoet-crm-sync/';

		$this->urls['feedbackform'] = 'https://forms.gle/k94AdShUHZ3LWPvx8';

		// social
		$this->urls['twitter'] = 'https://twitter.com/jetpackcrm';

		// assets
		$this->urls['crm-logo'] = plugins_url( 'i/jpcrm-logo-stacked-black.png', ZBS_ROOTFILE );

		// temp/updates
		$this->urls['db3migrate']         = 'https://kb.jetpackcrm.com/knowledge-base/upgrading-database-v3-0-migration/';
		$this->urls['migrationhelpemail'] = 'hello@jetpackcrm.com';
		$this->urls['db3migrateexts']     = 'https://kb.jetpackcrm.com/knowledge-base/upgrading-database-v3-0-migration/#extension-compatibility';

		// kb
		$this->urls['kbdevmode']                = 'https://kb.jetpackcrm.com/knowledge-base/developer-mode/';
		$this->urls['kbquoteplaceholders']      = 'https://kb.jetpackcrm.com/knowledge-base/placeholders-in-emails-quote-templates-invoices-etc/#quote-template-placeholders';
		$this->urls['kblicensefaq']             = 'https://kb.jetpackcrm.com/knowledge-base/license-keys-faq/';
		$this->urls['kbcronlimitations']        = 'https://kb.jetpackcrm.com/knowledge-base/wordpress-cron-limitations/';
		$this->urls['kbfirstcontact']           = 'https://kb.jetpackcrm.com/knowledge-base/adding-your-first-customer/';
		$this->urls['kbactivatecoreext']        = 'https://kb.jetpackcrm.com/knowledge-base/how-to-activate-deactivate-core-modules/';
		$this->urls['kbinvoicebuilder']         = 'https://kb.jetpackcrm.com/knowledge-base/how-to-use-the-invoice-builder/';
		$this->urls['kbteam']                   = 'https://kb.jetpackcrm.com/knowledge-base/setting-up-your-team/';
		$this->urls['kbupdateext']              = 'https://kb.jetpackcrm.com/knowledge-base/how-do-i-update-an-extension/';
		$this->urls['kbclientportal']           = 'https://kb.jetpackcrm.com/knowledge-base/how-does-the-client-portal-work/';
		$this->urls['kbtemplatefiles']          = 'https://kb.jetpackcrm.com/knowledge-base/templating-how-to-change-templates-pdfs-portal-emails/';
		$this->urls['kbeasyaccess']             = 'https://kb.jetpackcrm.com/knowledge-base/easy-access-links-for-client-portal/';
		$this->urls['kbdisablewelcome']         = 'https://kb.jetpackcrm.com/knowledge-base/automatically-create-wordpress-users-but-not-send-them-a-welcome-email/';
		$this->urls['kbapi']                    = 'https://kb.jetpackcrm.com/knowledge-base/using-the-api-connector/';
		$this->urls['kbshowwpmenus']            = 'https://kb.jetpackcrm.com/knowledge-base/how-to-get-wordpress-menu-items-back/';
		$this->urls['kbsmtpsetup']              = 'https://kb.jetpackcrm.com/knowledge-base/mail-delivery-method-setup-smtp/';
		$this->urls['kbcrmdashboard']           = 'https://kb.jetpackcrm.com/knowledge-base/zero-bs-crm-dashboard/';
		$this->urls['kbrevoverview']            = 'https://kb.jetpackcrm.com/knowledge-base/revenue-overview-chart/';
		$this->urls['kbcsvformat']              = 'https://kb.jetpackcrm.com/knowledge-base/what-should-my-csv-be-formatted-like/';
		$this->urls['kbcat_cal']                = 'https://kb.jetpackcrm.com/article-categories/calendar/';
		$this->urls['kbsegment_issues']         = 'https://kb.jetpackcrm.com/knowledge-base/segment-issues-and-errors/';
		$this->urls['kb-woosync-home']          = 'https://kb.jetpackcrm.com/knowledge-base/using-the-woocommerce-sync-hub/';
		$this->urls['kb-pre-v5-migration-todo'] = 'https://kb.jetpackcrm.com/knowledge-base/upgrading-to-jetpack-crm-v5-0/';
		$this->urls['kb-mailpoet']              = 'https://kb.jetpackcrm.com/knowledge-base/mailpoet-crm-sync/';
		$this->urls['kb-automations']           = 'https://kb.jetpackcrm.com/knowledge-base/automations/';
		$this->urls['kb-contact-fields']        = 'https://kb.jetpackcrm.com/knowledge-base/contact-field-list/';

		// coming soon
		$this->urls['soon'] = 'https://jetpackcrm.com/coming-soon/';

		// v4 rebrand announcement
		$this->urls['v4announce'] = 'https://jetpackcrm.com/rebrand-announcement';
		$this->urls['v5announce'] = 'https://jetpackcrm.com/announcing-jetpack-crm-v5-woocommerce-crm/';

		// } Usage Tracking
		$this->urls['usage']     = 'https://app.jetpackcrm.com/api/usage';
		$this->urls['usageinfo'] = 'https://jetpackcrm.com/usage-tracking';

		// YouTubes!
		$this->urls['youtube_channel']          = 'https://www.youtube.com/channel/UCyT-wMU7Gp6r1wN6W5YMAiQ';
		$this->urls['youtube_intro_playlist']   = 'https://www.youtube.com/watch?v=tCC25uTFDTs&list=PLO9bxAENhBHhnc53Eq3OGBKLMSj0leAel';
		$this->urls['youtube_intro_to_crm']     = 'https://www.youtube.com/watch?v=tCC25uTFDTs';
		$this->urls['youtube_intro_to_tags']    = 'https://www.youtube.com/watch?v=KwGh-Br_exc';
		$this->urls['youtube_intro_to_forms']   = 'https://www.youtube.com/watch?v=mBPjV1KUb-w';
		$this->urls['youtube_intro_to_modules'] = 'https://www.youtube.com/watch?v=j9RsXPcgeIo';
		// $this->urls['youtube_intro_to_woosync']   = 'https://www.youtube.com/watch?v=4G-FtmMhy-s';

		// Page slugs
		$this->slugs['home'] = 'zerobscrm-settings';

		##WLREMOVE
		$this->slugs['home'] = 'zerobscrm-plugin';
		##/WLREMOVE
		$this->slugs['dash']             = 'zerobscrm-dash';
		$this->slugs['settings']         = 'zerobscrm-plugin-settings';
		$this->slugs['logout']           = 'zerobscrm-logout';
		$this->slugs['datatools']        = 'zerobscrm-datatools';
		$this->slugs['welcome']          = 'zerobscrm-welcome';
		$this->slugs['crmresources']     = 'jpcrm-resources';
		$this->slugs['support']          = 'jpcrm-support';
		$this->slugs['extensions']       = 'zerobscrm-extensions';
		$this->slugs['modules']          = 'zerobscrm-modules';
		$this->slugs['export']           = 'zerobscrm-export';
		$this->slugs['systemstatus']     = 'zerobscrm-systemstatus';
		$this->slugs['sync']             = 'zerobscrm-sync';
		$this->slugs['core-automations'] = 'jpcrm-automations';

		// CSV importer Lite
		$this->slugs['csvlite'] = 'zerobscrm-csvimporterlite-app';

		// } FOR NOW wl needs these:
		$this->slugs['bulktagger'] = 'zerobscrm-batch-tagger';
		$this->slugs['salesdash']  = 'sales-dash';
		$this->slugs['stripesync'] = 'zerobscrm-stripesync-app';
		$this->slugs['woosync']    = 'woo-sync-hub'; // previously 'woo-importer';
		$this->slugs['paypalsync'] = 'zerobscrm-paypal-app';
		$this->slugs['mailpoet']   = 'crm-mail-poet-hub'; // note can't use `*mailpoet*` as the plugin inteferes with styles

		// } OTHER UI PAGES WHICH WEREN'T IN SLUG - MS CLASS ADDITION
		// } WH: Not sure which we're using here, think first set cleaner:
		// NOTE: DAL3 + these are referenced in DAL2.php so be aware :)
		// (This helps for generically linking back to list obj etc.)
		// USE zbsLink!
		$this->slugs['managecontacts']          = 'manage-customers';
		$this->slugs['managequotes']            = 'manage-quotes';
		$this->slugs['manageinvoices']          = 'manage-invoices';
		$this->slugs['managetransactions']      = 'manage-transactions';
		$this->slugs['managecompanies']         = 'manage-companies';
		$this->slugs['manageformscrm']          = 'manage-forms';
		$this->slugs['segments']                = 'manage-segments';
		$this->slugs['quote-templates']         = 'manage-quote-templates';
		$this->slugs['manage-tasks']           = 'manage-tasks';
		$this->slugs['manage-tasks-completed'] = 'manage-tasks-completed';
		$this->slugs['manage-tasks-list']      = 'manage-tasks-list';
		$this->slugs['managecontactsprev']      = 'manage-customers-crm';
		$this->slugs['managequotesprev']        = 'manage-quotes-crm';
		$this->slugs['managetransactionsprev']  = 'manage-transactions-crm';
		$this->slugs['manageinvoicesprev']      = 'manage-invoices-crm';
		$this->slugs['managecompaniesprev']     = 'manage-companies-crm';
		$this->slugs['manageformscrmprev']      = 'manage-forms-crm';

		// } NEW UI - ADD or EDIT, SEND EMAIL, NOTIFICATIONS
		$this->slugs['addedit']  = 'zbs-add-edit';
		$this->slugs['sendmail'] = 'zerobscrm-send-email';

		$this->slugs['emails'] = 'zerobscrm-emails';

		$this->slugs['notifications'] = 'zerobscrm-notifications';

		// } TEAM - Manage the CRM team permissions
		$this->slugs['team'] = 'zerobscrm-team';

		// } Export tools
		$this->slugs['export-tools'] = 'zbs-export-tools';

		// } Your Profile (for Calendar Sync and Personalised Stuff (like your own task history))
		$this->slugs['your-profile'] = 'your-crm-profile';
		$this->slugs['reminders']    = 'zbs-reminders';

		// } Adds a USER (i.e. puts our menu on user-new.php through ?page =)
		$this->slugs['zbs-new-user']  = 'zbs-add-user';
		$this->slugs['zbs-edit-user'] = 'zbs-edit-user'; // WH Added this, not sure what you're using for

		// } Install helper
		$this->slugs['zerobscrm-install-helper'] = 'zerobscrm-install-helper';

		// emails
		$this->slugs['email-templates'] = 'zbs-email-templates';

		// tag manager
		$this->slugs['tagmanager'] = 'tag-manager';

		// no access
		$this->slugs['zbs-noaccess'] = 'zbs-noaccess';

		// } File Editor
		$this->slugs['editfile']   = 'zerobscrm-edit-file';
		$this->slugs['addnewfile'] = 'zerobscrm-add-file';

		// } Extensions Deactivated error
		$this->slugs['extensions-active'] = 'zbs-extensions-active';

		// Activates a module and redirects to its 'hub' slug.
		$this->slugs['module-activate-redirect'] = 'jpcrm-module-activate-redirect';

		// Transients
		// These are transients which CRM owns which can be set via jpcrm_set_jpcrm_transient() etc.

		// Licensing prompts
		$this->transients['jpcrm-license-modal'] = false;

		// Mime types just use this func () - needs rethinking - includes/ZeroBSCRM.FileUploads.php
		if ( function_exists( 'zeroBSCRM_returnMimeTypes' ) ) {
			$this->acceptable_mime_types = zeroBSCRM_returnMimeTypes();
		}
	}

	/**
	 * Include required core files used in admin and on the frontend. Note. In the main
	 * file it was included everything on front end too. Can move the relevant ones
	 * to if ( $this->is_request( 'admin' ) ) { } once initial tests complete.
	 */
	public function includes() {

		// Admin messages (for any promos etc)
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.PluginAdminNotices.php';

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_startTimer( 'includes' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================

		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.GeneralFuncs.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Core.DateTime.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.AdminPages.Checks.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.ScriptsStyles.php';

		// } Settings
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Config.Init.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'wh.config.lib.php';

		// } WP REST API SUPPORT (better performant AJAX)
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.REST.php';

		// } General store of Error Codes
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.ErrorCodes.php';

		// Language modifiers (e.g. Company -> Organisation)
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-language.php';

		// Segment conditions
		require_once ZEROBSCRM_INCLUDE_PATH . 'class-segment-condition.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-segment-conditions.php';

		// Generic CRM exceptions
		require_once ZEROBSCRM_INCLUDE_PATH . 'class-crm-exception.php';

		// WordPress user integrations
		require_once ZEROBSCRM_INCLUDE_PATH . 'class-wordpress-user-integration.php';

		// Endpoint Listener
		require_once ZEROBSCRM_INCLUDE_PATH . 'class-endpoint-listener.php';

		// OAuth Handler
		require_once ZEROBSCRM_INCLUDE_PATH . 'class-oauth-handler.php';

		// } DATA

		// DAL3
		// Here we include:
		// - DAL 3 (base class)
		// - DAL 3 Objects
		// - DAL3.Helpers.php (our helper funcs)

		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.php';

		// 3.0 DAL objs:
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.ObjectLayer.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.Contacts.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.Companies.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.Segments.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'class-segment-condition-exception.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'class-missing-settings-exception.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.Quotes.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.QuoteTemplates.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.Invoices.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.Transactions.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.Forms.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.Events.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.EventReminders.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.Logs.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Obj.LineItems.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Export.php';

		// helper funcs
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Helpers.php';

		// drop-in-replacement for previous global fields (uses models from objs now.)
		// NOTE: Rather than initially hard-typed, this now needs to WAIT until DAL3 initialised
		// ... so field Globals available LATER in build queue in DAL3+
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL3.Fields.php';

		// } Metaboxes v3.0

			// Root classes
			require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBox.php';
			require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.Logs.php';
			require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.Tags.php';
			require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.ExternalSources.php';

		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.Contacts.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.Companies.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.TagManager.php';

		// } 3.0 + ALL are in our metaboxes
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.Quotes.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.QuoteTemplates.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.Invoices.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.Ownership.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.Tasks.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.Transactions.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes3.Forms.php';

		// NO CPTs! YAY!

		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.ExternalSources.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DataIOValidation.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Database.php';

		// } Split out DAL2:
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DAL2.Mail.php';

		// } Admin Pages
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.AdminStyling.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.AdminPages.php';
		require_once ZEROBSCRM_PATH . 'admin/tags/tag-manager.page.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.FormatHelpers.php';

		// } Dashboard Boxes - WH Q why do we also need to define VARS for these, require once only requires once, right?
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.DashboardBoxes.php';

		// } The kitchen sink
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Migrations.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Core.Localisation.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-localisation.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Core.Extensions.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Actions.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Core.Menus.WP.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Core.Menus.Top.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Core.License.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'class-learn-menu.php';

		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Permissions.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.ScreenOptions.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Inventory.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-rewrite-rules.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-mail-templating.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-templating.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-templating-placeholders.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MailTracking.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.InternalAutomator.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.CRON.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Social.php';

		// } Secondary
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.AJAX.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.WYSIWYGButtons.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.CustomerFilters.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.InternalAutomatorRecipes.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.FileUploads.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Forms.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.InvoiceBuilder.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.QuoteBuilder.php';

		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.SystemChecks.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.IntegrationFuncs.php';

		// Temporarily removed until MC2 catches up + finishes Mail Delivery:
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Mail.php';

		// } OBJ List Class (ZeroBSCRM.List.php) & List render funcs (ZeroBSCRM.List.Views.php) & List Column data
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.List.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.List.Views.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.List.Columns.php';

		// } OBJ Edit & Delete Classes (ZeroBSCRM.Edit.php)
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Edit.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Delete.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.TagManager.php';

		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Core.Page.Controller.php';
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Edit.Segment.php';

		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.List.Tasks.php';

		// } Semantic UI Helper + columns list
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.SemanticUIHelpers.php';

		// } Put Plugin update message (notifications into the transient /wp-admin/plugins.php) page.. that way the nag message is not needed at the top of pages (and will always show, not need to be dismissed)
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.PluginUpdates.php';

		// v3.0 update coming, warning
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.PluginUpdates.ImminentRelease.php';

		// } FROM PLUGIN HUNT THEME - LOT OF USEFUL CODE IN HERE.
		require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.NotifyMe.php';

		// load dependency checker (since 4.5.0)
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-dependency-checker.php';

		// load feature sniffer (since 4.5.0)
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-feature-sniffer.php';

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			// if we need CLI stuff
		}

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_closeGlobalTest( 'includes' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================
	}

	/**
	 * Hook into actions and filters.
	 *
	 * @since 2.3
	 */
	private function init_hooks() {

		// General activation hook: DB check, role creation
		register_activation_hook( ZBS_ROOTFILE, array( $this, 'install' ) );

		add_action( 'activated_plugin', array( $this, 'activated_plugin' ) );

		// Pre-init Hook
		do_action( 'before_zerobscrm_init' );

		// After all the plugins have loaded (THESE FIRE BEFORE INIT)
		add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) ); // } Translations
		// this moved to post_init_plugins_loaded below, needs to be post init: add_action('plugins_loaded', array($this, 'after_active_plugins_loaded') );

		// Initialise

		// our 'pre-init', this is the last step before init
		// ... and loads settings :)
		// add_action('admin_init', array($this, 'preInit'), 1);
		add_action( 'init', array( $this, 'preInit' ), 1 );

		// our formal init
		add_action( 'init', array( $this, 'init' ), 10 );

		// post init (init 99)
		add_action( 'init', array( $this, 'postInit' ), 99 );

		// Admin init - should condition this per page..
		add_action( 'admin_init', array( $this, 'admin_init' ) );

		// Add thumbnail support?
		add_action( 'after_setup_theme', array( $this, 'setup_environment' ) );

		// Extension links
		add_filter( 'plugin_action_links_' . plugin_basename( ZBS_ROOTFILE ), array( $this, 'add_action_links' ) );

		// Row meta
		add_filter( 'plugin_row_meta', array( __CLASS__, 'plugin_row_meta' ), 10, 2 );

		// Install/uninstall - use uninstall.php here
		register_deactivation_hook( ZBS_ROOTFILE, array( $this, 'uninstall' ) );

		// CRM top menu
		add_action( 'wp_after_admin_bar_render', 'zeroBSCRM_admin_top_menu', 10 );

		// Learn menu
		// Note the priority here. This causes the "learn" block to present after the top menu
		add_action( 'wp_after_admin_bar_render', array( $this, 'initialise_learn_menu' ), 11 );

		// Run late-stack events, e.g. post-loaded migrations, exports
		// note: this fires AFTER all advanced segments loaded, reliably
		add_action( 'wp_loaded', array( $this, 'post_wp_loaded' ) );
	}

	public function filterExtensions( $extensions_array = false ) {

		$extensions_array = apply_filters( 'zbs_extensions_array', $extensions_array );

		// remove dupes - even this doesn't seem to remove the dupes!
		return array_unique( $extensions_array );

		/*
		WH wrote this in 2.97.7, but probs not neceessary, not adding to not break anything
		// only apply filter if legit passed
		if (is_array($extensions_array) && count($extensions_array) > 0)
			$extensions_array = apply_filters('zbs_extensions_array', $extensions_array);
		else // else pass it with empty:
			$extensions_array = apply_filters('zbs_extensions_array', array());

		return $extensions_array; */
	}

	// load initial external sources
	private function loadBaseExternalSources() {

		// simply loads our initial set from array, for now.
		$this->external_sources = zeroBS_baseExternalSources();
	}

	// load any extra hooked-in external sources
	private function loadExtraExternalSources() {

		// load initials if not loaded/borked
		if ( ! is_array( $this->external_sources ) || count( $this->external_sources ) < 1 ) {

			// reload initial
			$this->loadBaseExternalSources();

		}

		// should be guaranteed that this->external_sources is an array now, but if for god-knows what reason, it's not, error.
		if ( ! is_array( $this->external_sources ) ) {

			// error out? (hard error not useful as err500's peeps)
			// ... rude text? (no translation, this way if someone EVER sees, they'll hopefully tell us)
			echo 'CRM ERROR #399: No external sources!<br>';

			// should NEVER happen:
			$this->external_sources = array();

		}

		// NOW we apply any filters to a blank array, then merge that with our HARD typed array to insure we never LOOSE originals
		$newExtSources = $this->filterExternalSources( array() );
		// ^^ this is kind of miss-use of filters, but it'll work well here.

		// if anything to add, manually parse here (for complete control)
		if ( is_array( $newExtSources ) && count( $newExtSources ) > 0 ) {
			foreach ( $newExtSources as $extKey => $extDeets ) {

				// will look like this:
				// $external_sources['woo'] = array('WooCommerce', 'ico' => 'fa-shopping-cart');

				// override/add to main (if checks out):
				if ( is_string( $extKey ) && ! empty( $extKey ) && is_array( $extDeets ) && count( $extDeets ) > 0 ) {

					// seems in right format
					$this->external_sources[ $extKey ] = $extDeets;

				}
			} // / if any new to add
		}

		// at this point $this->external_sources should be fully inline with apply_filter's added,
		// but will NEVER lack the original 'pack'
		// and 100% will be an array.
	}

	// simply applies filters to anny passed array
	// NOTE: From 2.97.7 this is only taken as a 'second' layer, as per loadExtraExternalSources() above.
	// ... so it can stay super simple.
	public function filterExternalSources( $approved_sources = false ) {

		return apply_filters( 'zbs_approved_sources', $approved_sources );
	}

	// } Build-out Object Models
	public function buildOutObjectModels() {

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_startTimer( 'customfields' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================

		// } Unpack Custom Fields + Apply sorts
		zeroBSCRM_unpackCustomFields();
		zeroBSCRM_unpackCustomisationsToFields();
		if ( 1 == 1 ) { // } switch off for perf?
			zeroBSCRM_applyFieldSorts();
		}

		// } Unpacks any settings logged against listview setups
		zeroBSCRM_unpackListViewSettings();

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_closeGlobalTest( 'customfields' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================
	}

	/*
	Don't think we need this
	#} thumbnail support - :)
	private function add_thumbnail_support() {
		if ( ! current_theme_supports( 'post-thumbnails' ) ) {
			add_theme_support( 'post-thumbnails' );
		}
		add_post_type_support( 'product', 'thumbnail' );
	} */

	public function setup_environment() {
		// Don't think we need this $this->add_thumbnail_support();  //add thumbnail support
	}

	public function add_action_links( $links ) {
		global $zbs;

		$mylinks = array(
			'<a href="' . zeroBSCRM_getAdminURL( $zbs->slugs['settings'] ) . '">' . __( 'Settings', 'zero-bs-crm' ) . '</a>',
			'<a href="' . zeroBSCRM_getAdminURL( $zbs->slugs['extensions'] ) . '">' . __( 'Extensions', 'zero-bs-crm' ) . '</a>',
		);
		return array_merge( $mylinks, $links );
	}

	/**
	 * Show row meta on the plugin screen for Jetpack CRM plugin.
	 *
	 * @param mixed $links_array Plugin Row Meta.
	 * @param mixed $plugin  Plugin Base Name.
	 *
	 * @return array
	 */
	public static function plugin_row_meta( $links_array, $plugin ) {
		if ( ! str_contains( $plugin, plugin_basename( ZBS_ROOTFILE ) ) ) {
			return $links_array;
		}

		global $zbs;
		$row_meta = array(
			'docs' => '<a href="' . esc_url( $zbs->urls['docs'] ) . '" aria-label="' . esc_attr__( 'Jetpack CRM knowledgebase', 'zero-bs-crm' ) . '" target="_blank">' . esc_html__( 'Docs', 'zero-bs-crm' ) . '</a>',
		);

		##WLREMOVE
		$license_key_array = zeroBSCRM_getSetting( 'license_key' );
		if ( is_array( $license_key_array ) && ! empty( $license_key_array['key'] ) ) {
			$row_meta['account'] = '<a href="' . esc_url( $zbs->urls['account'] ) . '" aria-label="' . esc_attr__( 'Your account', 'zero-bs-crm' ) . '" target="_blank">' . esc_html__( 'Your account', 'zero-bs-crm' ) . '</a>';
		}
		##/WLREMOVE

		return array_merge( $links_array, $row_meta );
	}

	public function post_init_plugins_loaded() {

		// } renamed to postSettingsIncludes and moved into that flow, (made more logical sense)

		// Veriy extension requirements
		$this->verify_extension_minimum_requirements();

		// } Forms - only initiate if installed :)
		if ( zeroBSCRM_isExtensionInstalled( 'forms' ) ) {
			zeroBSCRM_forms_includeEndpoint();
		}

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_closeGlobalTest( 'postsettingsincludes' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================
	}

	public function preInit() {

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_startTimer( 'preinit' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================

		global $zeroBSCRM_Conf_Setup, $zbscrmApprovedExternalSources;

		// } Init DAL (DAL2, now always enabled)
		$this->DAL = new zbsDAL();

		// } ASAP after DAL is initialised, need to run this, which DEFINES all DAL3.Obj.Models into old-style $globalFieldVars
		// } #FIELDLOADING
		if ( $this->isDAL3() ) {
			zeroBSCRM_fields_initialise();
		}

		// } Setup Config (centralises version numbers temp)
		global $zeroBSCRM_Conf_Setup;
		$zeroBSCRM_Conf_Setup['conf_pluginver']   = $this->version;
		$zeroBSCRM_Conf_Setup['conf_plugindbver'] = $this->db_version;

		// Not needed yet :) do_action( 'before_zerobscrm_settings_init' );

		// } Init settings + sources
		$this->settings = new WHWPConfigLib( $zeroBSCRM_Conf_Setup );

		// register any modules with core
		$this->jpcrm_register_modules();

		// external sources, load, then initially filter
		$this->loadBaseExternalSources();
		$this->loadExtraExternalSources();

		// This just sets up metaboxes (empty array for now) - see zeroBSCRM_add_meta_box in Edit.php
		if ( ! is_array( $this->metaboxes ) ) {
			$this->metaboxes = array();
		}

		// } This houses includes which need to fire post settings model load
		// NOTE: BECAUSE this has some things which add_action to init
		// ... this MUST fire on init with a priority of 1, so that these still "have effect"
		$this->postSettingsIncludes();

		// TEMP (ext update for 2.5 notice):
		if ( defined( 'ZBSTEMPLEGACYNOTICE' ) ) {
			zeroBS_temp_ext_legacy_notice();
		}

		// Legacy support for pre v2.50 settings in extensions
		zeroBSCRM_legacySupport();

		// load dependency checker for any modules/extensions
		$this->dependency_checker = new JPCRM_DependencyChecker();

		// load feature sniffer to alert user to available integrations
		$this->feature_sniffer = new JPCRM_FeatureSniffer();
		$this->jpcrm_sniff_features();

		// load WordPress User integrations
		$this->wordpress_user_integration = new Automattic\JetpackCRM\Wordpress_User_Integration();

		// fire an action
		do_action( 'after_zerobscrm_settings_preinit' );

		// load included modules
		// this needs to be fired early so modules can hook into third-party plugin actions/filters
		do_action( 'jpcrm_load_modules' );

		// Where on frontend, load our endpoint listener and OAuth handler
		if ( $this->is_request( 'frontend' ) && ! $this->is_request( 'ajax' ) ) {

			// load
			$this->load_oauth_handler();
			$this->load_listener();

			// catch listener requests (if any)
			$this->listener->catch_listener_request();

		}

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_closeGlobalTest( 'preinit' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================
	}

	public function postSettingsIncludes() {

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_startTimer( 'postsettingsincludes' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================

		// } extensions :D - here are files that don't need including if they're switched off...
		// } ^^ can probably include this via free extension manager class (longer term tidier?)
		// WH addition: this was firing PRE init (you weren't seeing because no PHP warnings...needs to fire after)

		// Retrieve settings
		// $zbsCRMTempSettings = $zbs->settings->getAll(); use zeroBSCRM_isExtensionInstalled

		// } free extensions setup (needs to be post settings)
		zeroBSCRM_freeExtensionsInit();

		// } CSV Importer LITE
		// } only run all this is no PRO installed :)
		if ( ! zeroBSCRM_isExtensionInstalled( 'csvpro' ) && zeroBSCRM_isExtensionInstalled( 'csvimporterlite' ) && ! defined( 'ZBSCRM_INC_CSVIMPORTERLITE' ) ) {
			require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.CSVImporter.php';
		}

		// } API
		if ( zeroBSCRM_isExtensionInstalled( 'api' ) && ! defined( 'ZBSCRM_INC_API' ) ) {
			require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.API.php';
		}

		// } If zbs admin: Tour
		if ( zeroBSCRM_isZBSAdminOrAdmin() && ! defined( 'ZBSCRM_INC_ONBOARD_ME' ) ) {
			require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.OnboardMe.php';
		}

		// If usage tracking is active - include the tracking code.
		$this->load_usage_tracking();

		if ( $this->isDAL3() && zeroBSCRM_isExtensionInstalled( 'jetpackforms' ) ) {
			// } Jetpack - can condition this include on detection of Jetpack - BUT the code in Jetpack.php only fires on actions so will be OK to just include
			require_once ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Jetpack.php';
		}
	}

	// } Initialisation - enqueueing scripts/styles
	public function init() {

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_startTimer( 'init' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================

		// this catches zbs_customers who may be accessing backend (shouldn't)
		$this->checkBackendAccess();

		global $zeroBSCRM_Conf_Setup, $zeroBSCRM_extensionsInstalledList, $zbscrmApprovedExternalSources;

		// unpack custom fieldsbuildOutObjectModels
		// #} #FIELDLOADING
		$this->buildOutObjectModels();

		// } Unpacks any settings logged against listview setups
		zeroBSCRM_unpackListViewSettings();

		// } Post settings hook - all meta views load in this hook :)
		// this has to fire for public + admin (things like mail campaigns rely on this for link tracking)
		do_action( 'after_zerobscrm_settings_init' );

		// } this needs to be post settings
		$this->extensions = $this->filterExtensions( $zeroBSCRM_extensionsInstalledList );

		// } Post extensions loaded hook
		do_action( 'after_zerobscrm_ext_init' );

		// } Load the admin menu. Can consider in here the 'ORDER' of the menu
		// } As well where extensions put their settings too
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );

		// } WH MOVED these from being added on init_hooks, to just calling them here, was legacy mess.
		// no longer used (now notifyme) add_action('init', array($this,'admin_noticies') ); #} load the admin noticies etc..
		// add_action('init', array($this,'include_updater') ); #} load the auto-updater class
		$this->include_updater();
		// add_action('init', 'zeroBSCRM_wooCommerceRemoveBlock'); #}  Admin unlock for ZBS users if WooCommerce installed
		zeroBSCRM_wooCommerceRemoveBlock();
		// add_action('init', array($this, 'post_init_plugins_loaded')); #} Registers stuff that needs settings etc.
		$this->post_init_plugins_loaded();

		// run migrations
		$this->run_migrations( 'init' );

		// } Brutal override for feeding in json data to typeahead
		// WH: should these be removed now we're using REST?
		if ( isset( $_GET['zbscjson'] ) && is_user_logged_in() && zeroBSCRM_permsCustomers() ) {
			exit( zeroBSCRM_cjson() ); }
		if ( isset( $_GET['zbscojson'] ) && is_user_logged_in() && zeroBSCRM_permsCustomers() ) {
			exit( zeroBSCRM_cojson() ); }

		// } Brutal override for inv previews
		// No longer req. v3.0 + this is delivered via HASH URL
		// if (isset($_GET['zbs_invid']) && wp_verify_nonce($_GET['_wpnonce'], 'zbsinvpreview') && is_user_logged_in() && zeroBSCRM_permsInvoices()){ exit(zeroBSCRM_invoice_generateInvoiceHTML((int)sanitize_text_field($_GET['zbs_invid']),false)); }

		// } Catch Dashboard + redir (if override mode)
		// } but not for wp admin (wptakeovermodeforall)
		if ( $this->settings->get( 'wptakeovermode' ) == 1 ) {

			// Not if API or Client Portal...
			// ... moved them inside this func..
			zeroBSCRM_catchDashboard();

		}

		// } JUST before cpt, we do any install/uninstall of extensions, so that cpt's can adjust instantly:
		zeroBSCRM_extensions_init_install();

		// } Here we do any 'default content' installs (quote templates) (In CPT <DAL3, In DAL3.Helpers DAL3+)
		zeroBSCRM_installDefaultContent();

		// } Admin & Public req
		wp_enqueue_script( 'jquery' );

		// } Post Init hook
		do_action( 'zerobscrm_post_init' );

		// } Public & non wp-cli only
		if ( ! is_admin() && ! defined( 'WP_CLI' ) ) {

			// } Catch front end loads :)
			if ( $this->settings->get( 'killfrontend' ) == 1 ) {
				global $pagenow;

				if ( ! zeroBSCRM_isLoginPage()
					&& ! zeroBSCRM_isWelcomeWizPage()
					&& ! zeroBSCRM_isAPIRequest()
					&& ! defined( 'XMLRPC_REQUEST' )
					&& ! defined( 'REST_REQUEST' )
					// phpcs:ignore WordPress.Security.NonceVerification.Recommended
					&& ! ( 'index.php' === $pagenow && ! empty( $_GET['rest_route'] ) )
				) {

					zeroBSCRM_stopFrontEnd();

				}
			}
		}

		// } Finally, if it's an edit page for a (obj) which is hard owned by another, redir away
		// if admin, ignore :)
		if ( $this->settings->get( 'perusercustomers' ) && ! zeroBSCRM_isZBSAdminOrAdmin() ) {

			// } Using ownership
			if ( ! $this->settings->get( 'usercangiveownership' ) ) {

				// DAL3/pre switch
				if ( $this->isDAL3() ) {

						// } is one of our dal3 edit pages
					if ( zeroBSCRM_is_zbs_edit_page() ) {

						// in this specific case we pre-call globalise_vars
						// ... which later gets recalled if on an admin page (but it's safe to do so here too)
						// this moves any _GET into $zbsPage
						$this->globalise_vars();

						// this allows us to use these:
						$objID      = $this->zbsvar( 'zbsid' ); // -1 or 123 ID
						$objTypeStr = $this->zbsvar( 'zbstype' ); // -1 or 'contact'

						// if objtypestr is -1, assume contact (default)
						if ( $objTypeStr == -1 ) {
							$objType = ZBS_TYPE_CONTACT;
						} else {
							$objType = $this->DAL->objTypeID( $objTypeStr );
						}

						// if is edit page + has obj id, (e.g. is not "new")
						// then check ownership
						if ( isset( $objID ) && $objID > 0 && $objType > 0 ) {

							$ownershipValid = $this->DAL->checkObjectOwner(
								array(

									'objID'              => $objID,
									'objTypeID'          => $objType,
									'potentialOwnerID'   => get_current_user_id(),
									'allowNoOwnerAccess' => true, // ?

								)
							);

							// } If user ! has rights, redir
							if ( ! $ownershipValid ) {

								// } Redirect to our "no rights" page
								// OLD WAY header("Location: edit.php?post_type=".$postType."&page=".$this->slugs['zbs-noaccess']."&id=".$postID);
								header( 'Location: admin.php?page=' . $this->slugs['zbs-noaccess'] . '&zbsid=' . $objID . '&zbstype=' . $objTypeStr );
								exit();

							} // / no rights.

						} // / obj ID

					} // / is edit page

				}
			} // / is setting usercangiveownership

		} // / !is admin

		// debug
		// print_r($GLOBALS['wp_post_types']['zerobs_quo_template']); exit();

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_closeGlobalTest( 'init' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================
	}

	public function postInit() {

		// pre 2.97.7:
		// WH note: filterExternalSources() above didn't seem to be adding them all (stripesync e.g. was being added on init:10)
		// ... so this gets called a second time (should be harmless) at init:99 (here)
		// $this->external_sources = $this->filterExternalSources($this->external_sources);

		// 2.97.7, switched to this, a more ROBUST check which only 'adds' and won't remove.
		$this->loadExtraExternalSources();

		// this allows various extensions to add users AFTER external sources def loaded
		do_action( 'after_zerobscrm_extsources_init' );

		// This action should replace after_zerobscrm_extsources_init when we refactor load order in this class.
		// initially used by advanced segments to add custom field segment condition classes after the class is declared in jpcrm-segment-conditions.php
		do_action( 'jpcrm_post_init' );

		// this allows us to do stuff (e.g. redirect based on a condition) prior to headers being sent
		$this->catch_preheader_interrupts();
	}

	/**
	 * Fires after CRM and WP fully loaded
	 * (Late in stack)
	 **/
	public function post_wp_loaded() {

		// Run any migrations
		$this->run_migrations( 'wp_loaded' );

		// do our late-fire actions
		do_action( 'jpcrm_post_wp_loaded' );
	}

	/**
	 * Fires on admin_init
	 **/
	public function admin_init() {

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_startTimer( 'admin_init' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================

		// Autoload AJAX files for any admin pages
		$this->load_admin_ajax();

		// only load if we are a ZBS admin page? Will this break the world?!?
		if ( zeroBSCRM_isAdminPage() ) {

			// catch wiz + redirect
			$this->wizardInitCheck();

			// Let's ensure that our cronjobs are there
			if ( ! wp_next_scheduled( 'jpcrm_cron_watcher' ) ) {
				jpcrm_cron_watcher();
			}

			// apply any filters req. to the exclude-from-settings arr
			global $zbsExtensionsExcludeFromSettings;
			$zbsExtensionsExcludeFromSettings = apply_filters( 'zbs_exclude_from_settings', $zbsExtensionsExcludeFromSettings );

			// this moves any _GET into $zbsPage
			$this->globalise_vars();

			// this sets page titles where it can ($this->setPageTitle();)
			add_filter( 'zbs_admin_title_modifier', array( $this, 'setPageTitle' ), 10, 2 );

			// This is a pre-loader for edit page classes, allows us to save data before loading the page :)
			zeroBSCRM_prehtml_pages_admin_addedit();

			// Again, necessary? do_action('before_zerobscrm_admin_init');

			// All style registering moved into ZeroBSCRM.ScriptsStyles.php for v3.0, was getting messy
			zeroBSCRM_scriptStyles_initStyleRegister();

			// JS Root obj (zbs_root)
			zeroBSCRM_scriptStyles_enqueueJSRoot();

			// Check for stored messages in case we were redirected.
			$this->maybe_retrieve_page_messages();

			// autohide admin_notices on pages we specify
			jpcrm_autohide_admin_notices_for_specific_pages();
		}

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_closeGlobalTest( 'admin_init' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_startTimer( 'after-zerobscrm-admin-init' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================

		// Action hook
		do_action( 'after-zerobscrm-admin-init' );

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_closeGlobalTest( 'after-zerobscrm-admin-init' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================
	}

	// this checks whether any extensions are active which might bring down an install to 500 error
	// backstop in case extensions used which don't deactivate for whatver reason (being doubly sure in core)
	// as part of UX work also make sure all extensions are classified and only load when core hook triggers
	// some users were still hitting 500 errors so worth having this in place to protect us / help retain / PICNIC
	// wh renamed: check_active_zbs_extensions -> pre_deactivation_check_exts_deactivated
	function pre_deactivation_check_exts_deactivated() {
			global $zbs;
			// } from telemetry however what if someone has extensions installed this should show up
			// } this is the full count (not whether they are active)
			$extensions_installed = zeroBSCRM_extensionsInstalledCount( true );
		if ( $extensions_installed > 0 ) {
			// tried to add an error above the plugins.php list BUT it did not seem to show
			// instead re-direct to one of our pages which tells them about making sure extensions are
			// deactivated before deactivating core
			wp_safe_redirect( admin_url( 'admin.php?page=' . $zbs->slugs['extensions-active'] ) );
			die(); // will killing it here stop deactivation?

			// failsafe?
			return false;
		}
			return true;
	}

	public function uninstall() {

		// Deactivate all the extensions
		zeroBSCRM_extensions_deactivateAll();

		// Skip the deactivation feedback if it's a JSON/AJAX request or via WP-CLI
		if ( wp_is_json_request() || wp_doing_ajax() || ( defined( 'WP_CLI' ) && WP_CLI ) || wp_is_xml_request() ) {
			return;
		}

		// if($this->pre_deactivation_check_exts_deactivated()){

			##WLREMOVE

			// Remove roles :)
			zeroBSCRM_clearUserRoles();

			// Debug delete_option('zbsfeedback');exit();
			$feedbackAlready = get_option( 'zbsfeedback' );

			// if php notice, (e.g. php ver to low, skip this)
		if ( ! defined( 'ZBSDEACTIVATINGINPROG' ) && $feedbackAlready == false && ! defined( 'ZBSPHPVERDEACTIVATE' ) ) {

			// } Show stuff + Deactivate
			// } Define is to stop an infinite loop :)
			// } (Won't get here the second time)
			define( 'ZBSDEACTIVATINGINPROG', true );

			// } Before you go...
			if ( function_exists( 'file_get_contents' ) ) {

				// } telemetry
				// V3.0 No more telemetry if (!zeroBSCRM_isWL()) zeroBSCRM_teleLogAct(3);

				try {

					// } Also manually deactivate before exit
					deactivate_plugins( plugin_basename( ZBS_ROOTFILE ) );

					// } require template
					require_once ZEROBSCRM_PATH . 'admin/activation/before-you-go.php';
					exit();

				} catch ( Exception $e ) {

					// } Nada

				}
			}
		}
			##/WLREMOVE

		// } //end of check if there are extensions active
	}

	public function install() {

		// dir build
		zeroBSCRM_privatisedDirCheck();
		zeroBSCRM_privatisedDirCheckWorks(); // the folder used to be '_wip', updated to 'tmp'

		// Additional DB tables hook on activation (such as api keys table) - requires ZeroBSCRM.Database.php
		zeroBSCRM_database_check();

		// roles
		zeroBSCRM_clearUserRoles();

		// roles +
		zeroBSCRM_addUserRoles();
	}

	/**
	 * Handle the redirection on JPCRM plugin activation
	 *
	 * @param $filename
	 */
	public function activated_plugin( $filename ) {

		// Skip the re-direction if it's a JSON/AJAX request or via WP-CLI
		if ( wp_is_json_request() || wp_doing_ajax() || ( defined( 'WP_CLI' ) && WP_CLI ) || wp_is_xml_request() ) {
			return;
		}

		if ( $filename == ZBS_ROOTPLUGIN ) {
			// Send the user to the Dash board
			global $zbs;
			if ( wp_redirect( zeroBSCRM_getAdminURL( $zbs->slugs['dash'] ) ) ) {
				exit;
			}
		}
	}

	// this func runs on admin_init and xxxx
	public function wizardInitCheck() {

		// not authorized to run the wizard
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$force_wizard = false;

		// reset any wizard overrides if URL param is present
		if ( ! empty( $_GET['jpcrm_force_wizard'] ) ) {
			delete_option( 'jpcrm_skip_wizard' );
			delete_transient( 'jpcrm_defer_wizard' );
			$force_wizard = true;
		}

		// set option if URL param
		if ( ! empty( $_GET['jpcrm_skip_wizard'] ) ) {
			update_option( 'jpcrm_skip_wizard', 1, false );
		}

		// wizard was purposely skipped
		if ( get_option( 'jpcrm_skip_wizard' ) ) {
			return;
		}

		// set transient if URL param
		if ( ! empty( $_GET['jpcrm_defer_wizard'] ) ) {
			set_transient( 'jpcrm_defer_wizard', 1, 30 );
		}

		// Skip wizard temporarily if transient is set
		// this can be used for Jetpack CTA installs, for example
		if ( get_transient( 'jpcrm_defer_wizard' ) ) {
			return;
		}

		// Bail if activating from network, or bulk
		if ( is_network_admin() ) { // WH removed this, if bulk, still do it :D || isset( $_GET['activate-multi'] ) ) {
			return;
		}

		##WLREMOVE
		// Bail if already completed wizard
		// $run_count increments each time the wizard is loaded
		// always run if forced
		$run_count = get_option( 'zbs_wizard_run', 0 );
		if ( $run_count <= 0 || $force_wizard ) {
			// require welcome wizard template
			require_once ZEROBSCRM_PATH . 'admin/activation/welcome-to-jpcrm.php';
			exit();
		}
		##/WLREMOVE
	}

	/**
	 * Loads the Plugin Updater Class
	 *
	 * @since 2.97.x
	 */
	public function include_updater() {

		// } Initialise ZBS Updater Class
		global $zeroBSCRM_Updater;
		if ( ! isset( $zeroBSCRM_Updater ) ) {
			$zeroBSCRM_Updater = new zeroBSCRM_Plugin_Updater(
				$this->urls['api'],
				$this->update_api_version,
				ZBS_ROOTFILE,
				array(
					'version' => $this->version,
					'license' => false,                   // license initiated to false..
				)
			);
		}
	}

	/**
	 *
	 * Autoloads the modules (core extensions) included with core
	 *
	 * Ultimately we should probably include Jetpack Forms and maybe CSV Importer.
	 *
	 * Modularisation of this manner may allow easier drop-in integrations by third-party devs as well.
	 */
	public function jpcrm_register_modules() {

		// include modules class
		require_once ZEROBSCRM_INCLUDE_PATH . 'class-crm-modules.php';

		// load it (which registers modules and creates $zbs->modules)
		$this->modules = new Automattic\JetpackCRM\CRM_Modules();
	}

	/**
	 *
	 * Check to see if there's an integration our users could be using
	 * At some point we should modularize this as well
	 */
	public function jpcrm_sniff_features() {
		$this->feature_sniffer->sniff_for_plugin(
			array(
				'feature_slug'   => 'jetpackforms',
				'plugin_slug'    => 'jetpack/jetpack.php',
				'more_info_link' => 'https://kb.jetpackcrm.com/knowledge-base/jetpack-contact-forms/',
			)
		);
		do_action( 'jpcrm_sniff_features' );
		$this->feature_sniffer->show_feature_alerts();
	}

	/**
	 * Ensures fatal errors are logged so they can be picked up in the status report.
	 *
	 * @since 3.2.0
	 */
	public function log_errors() {
		$error = error_get_last();
		if ( E_ERROR === $error['type'] ) {
			$this->write_log( $error['message'] . PHP_EOL );    // check this method.. should be OK
		}
	}

	public function write_log( $log ) {
		if ( is_array( $log ) || is_object( $log ) ) {
			error_log( print_r( $log, true ) );
		} else {
			error_log( $log );
		}
	}

	/**
	 * Define constant if not already set.
	 *
	 * @param string      $name  Constant name.
	 * @param string|bool $value Constant value.
	 */
	private function define( $name, $value ) {
		if ( ! defined( $name ) ) {
			define( $name, $value );
		}
	}

	/**
	 * What type of request is this?
	 * Note: 'frontend' returns true for ajax calls too.
	 *
	 * @param  string $type admin, ajax, cron or frontend.
	 * @return bool
	 */
	private function is_request( $type ) {
		switch ( $type ) {
			case 'admin':
				return is_admin();
			case 'ajax':
				return defined( 'DOING_AJAX' );
			case 'cron':
				return defined( 'DOING_CRON' );
			case 'frontend':
				return ( ! is_admin() || defined( 'DOING_AJAX' ) ) && ! defined( 'DOING_CRON' );
		}
	}

	/**
	 * Check the active theme.
	 *
	 * @since  2.6.9
	 * @param  string $theme Theme slug to check.
	 * @return bool
	 */
	private function is_active_theme( $theme ) {
		return get_template() === $theme;
	}

	/**
	 * Include required frontend files.
	 */
	public function frontend_includes() {
	}

	/**
	 * Load Localisation files.
	 *
	 * Note: the first-loaded translation file overrides any following ones if the same translation is present.
	 *
	 * Locales found in:
	 *      - WP_LANG_DIR/woocommerce/woocommerce-LOCALE.mo
	 *      - WP_LANG_DIR/plugins/woocommerce-LOCALE.mo
	 */

	public function load_textdomain() {

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_startTimer( 'loadtextdomain' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================

		load_plugin_textdomain( 'zero-bs-crm', false, ZBS_LANG_DIR ); // basename( dirname( ZBS_ROOTFILE ) ) . '/languages' ); //plugin_dir_path( ZBS_ROOTFILE ) .'/languages'

		// ====================================================================
		// ==================== General Perf Testing ==========================
		if ( defined( 'ZBSPERFTEST' ) ) {
			zeroBSCRM_performanceTest_closeGlobalTest( 'loadtextdomain' );
		}
		// =================== / General Perf Testing =========================
		// ====================================================================
	}

	/**
	 * Get the plugin url.
	 *
	 * @return string
	 */
	public function plugin_url() {
		return untrailingslashit( plugins_url( '/', ZBS_ROOTFILE ) );
	}

	/**
	 * Get the plugin path.
	 *
	 * @return string
	 */
	public function plugin_path() {
		return untrailingslashit( plugin_dir_path( ZBS_ROOTFILE ) );
	}

	/**
	 * Check if Settings exists, load default if not
	 *
	 * @return string
	 */
	public function checkSettingsSetup() {
		global $zeroBSCRM_Conf_Setup;
		if ( ! isset( $this->settings ) ) {
			$this->settings = null; // https://stackoverflow.com/questions/8900701/creating-default-object-from-empty-value-in-php
			$this->settings = new WHWPConfigLib( $zeroBSCRM_Conf_Setup );
		}
	}

	/**
	 * Check if user has capabilities to view backend :)
	 *
	 * @return string
	 */
	public function checkBackendAccess() {
		if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
			return;
		}

		// if zbs_customer in admin area, kick em out :)
		if ( zeroBSCRM_isRole( 'zerobs_customer' ) ) {

			if ( is_admin() ) {
				$redirect = isset( $_SERVER['HTTP_REFERER'] ) ? $_SERVER['HTTP_REFERER'] : home_url( '/' );
				if ( current_user_can( 'zerobs_customer' ) ) {
					wp_redirect( $redirect );
					exit();
				}
			}

			// and remove wp bar from front end
			add_filter( 'show_admin_bar', '__return_false' );
		}
	}

	/**
	 * Get Ajax URL.
	 *
	 * @return string
	 */
	public function ajax_url() {
		return admin_url( 'admin-ajax.php', 'relative' );
	}

	/**
	 * Get Site Domain
	 *
	 * @return string
	 */
	public function get_domain() {

		$urlparts = parse_url( home_url() );

		if ( isset( $urlparts['host'] ) ) {
			return $urlparts['host'];
		}

		return false;
	}

	/**
	 * Globalise ZBS Vars
	 *
	 * @return nout
	 */
	public function globalise_vars() {

		// here, where things are consistently used through a page
		// e.g. admin.php?page=zbs-add-edit&action=edit&zbsid=3
		// we globally set them to save time later :)
		global $zbsPage;
		$zbsPage = array();

		// zbsid
		if ( isset( $_GET['zbsid'] ) && ! empty( $_GET['zbsid'] ) ) {

			$zbsid = (int) sanitize_text_field( $_GET['zbsid'] );

			// if $zbsid is set, make it a GLOBAL (save keep re-getting)
			// this is used by metaboxes, insights + hypothesis, titles below etc. DO NOT REMOVE
			if ( $zbsid > 0 ) {
				$zbsPage['zbsid'] = $zbsid;
			}
		}

		// page
		if ( isset( $_GET['page'] ) && ! empty( $_GET['page'] ) ) {

			$page = sanitize_text_field( $_GET['page'] );

			// if $page is set, make it a GLOBAL (save keep re-getting)
			// this is used by metaboxes, insights + hypothesis, titles below etc. DO NOT REMOVE
			if ( ! empty( $page ) ) {
				$zbsPage['page'] = $page;
			}
		}

		// action
		if ( isset( $_GET['action'] ) && ! empty( $_GET['action'] ) ) {

			$action = sanitize_text_field( $_GET['action'] );

			// if $action is set, make it a GLOBAL (save keep re-getting)
			// this is used by metaboxes, insights + hypothesis, titles below etc. DO NOT REMOVE
			if ( ! empty( $action ) ) {
				$zbsPage['action'] = $action;
			}
		}

		// type
		if ( isset( $_GET['type'] ) && ! empty( $_GET['type'] ) ) {

			$type = sanitize_text_field( $_GET['type'] );

			// if $type is set, make it a GLOBAL (save keep re-getting)
			// this is used by metaboxes, insights + hypothesis, titles below etc. DO NOT REMOVE
			if ( ! empty( $type ) ) {
				$zbsPage['type'] = $type;
			}
		}

		// zbstype
		if ( isset( $_GET['zbstype'] ) && ! empty( $_GET['zbstype'] ) ) {

			$zbstype = sanitize_text_field( $_GET['zbstype'] );

			// if $zbstype is set, make it a GLOBAL (save keep re-getting)
			// this is used by metaboxes, insights + hypothesis, titles below etc. DO NOT REMOVE
			if ( ! empty( $zbstype ) ) {
				$zbsPage['zbstype'] = $zbstype;
			}
		}

		// if action = 'edit' + no 'zbsid' = NEW EDIT (e.g. new contact)
		if ( isset( $zbsPage['action'] ) && $zbsPage['action'] == 'edit' && ( ! isset( $zbsPage['zbsid'] ) || $zbsPage['zbsid'] < 1 ) ) {

			$zbsPage['new_edit'] = true;

		}
	}

	/**
	 * Get Globalised ZBS Vars
	 *
	 * @return str/int/bool
	 */
	public function zbsvar( $key = '' ) {

		// globalise_vars returned
		global $zbsPage;

		// zbsid
		if ( is_array( $zbsPage ) && ! empty( $key ) && isset( $zbsPage[ $key ] ) && ! empty( $zbsPage[ $key ] ) ) {

			return $zbsPage[ $key ];

		}

		return -1;
	}

	/**
	 * Tries to set page title (where it can)
	 *
	 * @return nout
	 */
	public function setPageTitle( $title = '', $adminTitle = '' ) {

		// default
		$pageTitle = ( ( $adminTitle == '' ) ? __( 'Jetpack CRM', 'zero-bs-crm' ) : $adminTitle );

		// useful? global $post, $title, $action, $current_screen;
		// global $zbsPage; print_r($zbsPage); exit();

		// we only need to do this for pages where we're using custom setups (not added via wp_add_menu whatever)
		if ( $this->zbsvar( 'page' ) != -1 ) {

			switch ( $this->zbsvar( 'page' ) ) {

				case 'zbs-add-edit':
					// default
					$pageTitle = __( 'View | Jetpack CRM' . $this->zbsvar( 'action' ), 'zero-bs-crm' );

					// default/no type passed
					$objType = __( 'Contact', 'zero-bs-crm' );

					switch ( $this->zbsvar( 'zbstype' ) ) {

						case 'contact':
							$objType = __( 'Contact', 'zero-bs-crm' );
							break;

						case 'company':
							$objType = jpcrm_label_company();
							break;

						case 'segment':
							$objType = __( 'Segment', 'zero-bs-crm' );
							break;

						case 'quote':
							$objType = __( 'Quote', 'zero-bs-crm' );
							break;

						case 'invoice':
							$objType = __( 'Invoice', 'zero-bs-crm' );
							break;

						case 'transaction':
							$objType = __( 'Transaction', 'zero-bs-crm' );
							break;

						case 'event':
							$objType = __( 'Task', 'zero-bs-crm' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							break;

						case 'form':
							$objType = __( 'Form', 'zero-bs-crm' );
							break;

						case 'quotetemplate':
							$objType = __( 'Quote Template', 'zero-bs-crm' );
							break;

						case 'log':
							$objType = __( 'Log', 'zero-bs-crm' );
							break;

					}

					// just formatting:
					if ( ! empty( $objType ) ) {
						$objType = ' ' . $objType;
					}

					switch ( $this->zbsvar( 'action' ) ) {

						case 'edit':
							$pageTitle = __( 'Edit ' . $objType . ' | Jetpack CRM', 'zero-bs-crm' );
							break;

						case 'delete':
							$pageTitle = __( 'Delete ' . $objType . ' | Jetpack CRM', 'zero-bs-crm' );
							break;

						case 'view':
							$pageTitle = __( 'View ' . $objType . ' | Jetpack CRM', 'zero-bs-crm' );
							break;

					}

					break;

				case 'zerobscrm-emails':
					// default
					$pageTitle = __( 'Email Manager | Jetpack CRM', 'zero-bs-crm' );

					break;

				case 'tag-manager':
					$pageTitle = __( 'Tag Manager | Jetpack CRM', 'zero-bs-crm' );
					break;

				case 'zerobscrm-notifications':
					$pageTitle = __( 'Notifications | Jetpack CRM', 'zero-bs-crm' );
					break;

				case 'zbs-email-templates':
					$pageTitle = __( 'Email Templates | Jetpack CRM', 'zero-bs-crm' );
					break;

				case 'zbs-export-tools':
					$pageTitle = __( 'Export Tools | Jetpack CRM', 'zero-bs-crm' );
					break;

				case 'zerobscrm-csvimporterlite-app':
					$pageTitle = __( 'Import Tools | Jetpack CRM', 'zero-bs-crm' );
					break;

			}
		}

		return $pageTitle;
	}

	/**
	 * Get Current User's screen options for current page
	 * This requires add_filter on page to work :)
	 * // actually just use a global for now :) - so just set global $zbs->pageKey on page :)
	 * // 2.94.2+ can pass pagekey to get opts for page other than current (used for list view perpage)
	 *
	 * @return array() screen options
	 */
	public function userScreenOptions( $pageKey = false ) {

		// TO ADD LATER: (optionally) allow admins to create a 'forced' screen options set (e.g. metabox layout etc.)
		// ... forced or default :)

		$currentUserID = get_current_user_id();

		if ( ! $pageKey || empty( $pageKey ) ) {

			// actually just use a global for now :) - so just set global $zbs->pageKey on page :)
			$pageKeyCheck = apply_filters( 'zbs_pagekey', $this->pageKey );

		} else {
			$pageKeyCheck = $pageKey;
		}

		if ( $currentUserID > 0 && ! empty( $pageKeyCheck ) ) {

			// retrieve via dal

			return $this->DAL->userSetting( $currentUserID, 'screenopts_' . $pageKeyCheck, false );

		}

		return array();
	}

	/**
	 * Get global screen option settings
	 *
	 * @param string $page_key Page key.
	 */
	public function global_screen_options( $page_key = false ) {

		if ( empty( $page_key ) ) {
			$page_key = apply_filters( 'zbs_pagekey', $this->pageKey ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		if ( empty( $page_key ) ) {
			return array();
		}

		$screen_options = $this->DAL->getSetting( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			array(
				'key' => 'screenopts_' . $page_key,
			)
		);
		return $screen_options;
	}

	/**
	 * Shorthand for get_Current_user_id
	 *
	 * @return int user id
	 */
	public function user() {

		return get_current_user_id();
	}

	/**
	 * Shorthand for zeroBSCRM_getSetting('license_key')
	 *
	 * @return array() license settings (trimmed down)
	 */
	public function license() {

		// default
		$ret = array(
			'validity' => false,
			'access'   => 'none',
			'expires'  => -1,
		);

		// retrieve
		$licenseKeyArr = zeroBSCRM_getSetting( 'license_key' );

		// return only these (not key, for simple semi-security? lol. not even)
		if ( is_array( $licenseKeyArr ) ) {
			if ( isset( $licenseKeyArr['validity'] ) ) {
				$ret['validity'] = $licenseKeyArr['validity'];
			}
			if ( isset( $licenseKeyArr['access'] ) ) {
				$ret['access'] = $licenseKeyArr['access'];
			}
			if ( isset( $licenseKeyArr['expires'] ) ) {
				$ret['expires'] = $licenseKeyArr['expires'];
			}
		}

		return $ret;
	}

	/*
	* Do we have a license key?
	*/
	public function has_license_key() {

		$settings = $this->settings->get( 'license_key' );

		// checks if exists and it's not empty
		if ( ! empty( $settings['key'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Returns true/false if has AT LEAST entrepreneur Bundle
	 *  ... suspect this is an easy way to HACK out show promotional material. So rethink around that at some point.
	 *
	 * @return bool
	 */
	public function hasEntrepreneurBundleMin() {

		$license             = $this->license();
		$valid               = array( 'entrepreneur', 'reseller' );
		$license['validity'] = ( $license['validity'] === 'true' ? true : false );
		if ( $license['validity'] && ( in_array( $license['access'], $valid ) ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Returns true/false if has AT LEAST entrepreneur Bundle
	 *  ... suspect this is an easy way to HACK out show promotional material. So rethink around that at some point.
	 *
	 * @return bool
	 */
	public function hasFreelancerBundleMin() {

		$license             = $this->license();
		$valid               = array( 'freelancer', 'entrepreneur', 'reseller' );
		$license['validity'] = ( $license['validity'] === 'true' ? true : false );
		if ( $license['validity'] && ( in_array( $license['access'], $valid ) ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Returns pretty label for subscription
	 *  ... suspect this is an easy way to HACK out show promotional material. So rethink around that at some point.
	 *
	 * @return string
	 */
	public function getSubscriptionLabel( $str = '' ) {

		if ( empty( $str ) ) {
			// get from license
			$license = $this->license();
			if ( isset( $license['validity'] ) ) {
				$license['validity'] = ( $license['validity'] === 'true' ? true : false );
				if ( $license['validity'] && isset( $license['access'] ) && ! empty( $license['access'] ) ) {
					$str = $license['access'];
				}
			}
		}

		switch ( $str ) {

			case 'freelancer':
				return 'Freelancer Bundle';
				break;

			case 'entrepreneur':
				return 'Entrepreneur Bundle';
				break;

			case 'reseller':
				return 'Branded Bundle';
				break;

			// for all others, use this:
			default:
				return 'Extension: ' . ucwords( $str );
				break;

		}

		return false;
	}

	// ======= Menu Management =========

	/**
	 * Return private $menu
	 *
	 * @since 3.0
	 */
	public function getMenu() {
		return $this->menu; }

	/**
	 * Sets up admin menu
	 *
	 * @since 3.0
	 */
	public function admin_menu() {

		$this->applyMenu();

		// hook for extensions to add menus :)
		do_action( 'zerobs_admin_menu' );
	}

	/**
	 * Applys admin menu
	 * (v3.0 + this replaces zeroBSCRM_admin_menu)
	 *
	 * @since 3.0
	 */
	private function applyMenu() {

		// build init, if not there
		if ( ! isset( $this->menu ) && ! is_array( $this->menu ) ) {
			$this->menu = zeroBSCRM_menu_buildMenu();
		}
		// ready?
		if ( isset( $this->menu ) && is_array( $this->menu ) ) {

			// Here we apply filters, this allows other ext etc. to modify menu items before we priotise + build
			$menu = apply_filters( 'zbs_menu_wpmenu', $this->menu );

			// remove non-permissioned
			$menu = zeroBSCRM_menu_securityGuard( $menu );

			// resort based on 'order'
			$menu = zeroBSCRM_menu_order( $menu );

			// output (adds menus)
			zeroBSCRM_menu_applyWPMenu( $menu );

		}
	}

	/**
	 * Learn Menu
	 *
	 * @since 3.0
	 */
	public function initialise_learn_menu() {

		$this->learn_menu = new Automattic\JetpackCRM\Learn_Menu();

		// render the menu where possible
		$this->learn_menu->render_learn_menu();
	}

	// ======= / Menu Management =========

	// ========== Basic Library Management =========

	/**
	 * Retrieve array of details for a library
	 * Returns: array() or false
	 */
	public function lib( $libKey = '' ) {

		if ( isset( $this->libs[ $libKey ] ) && is_array( $this->libs[ $libKey ] ) ) {

			// update path to use ZEROBSCRM_PATH
			$ret            = $this->libs[ $libKey ];
			$ret['path']    = ZEROBSCRM_PATH . $this->libs[ $libKey ]['path'];
			$ret['include'] = ZEROBSCRM_PATH . $this->libs[ $libKey ]['include'];

			return $ret;
		}

		return false;
	}

	/**
	 * Retrieve root path for a library
	 * Returns: str or false
	 */
	public function libPath( $libKey = '' ) {

		if ( isset( $this->libs[ $libKey ] ) && isset( $this->libs[ $libKey ]['path'] ) ) {
			return ZEROBSCRM_PATH . $this->libs[ $libKey ]['path'];
		}

		return false;
	}

	/**
	 * Retrieve full include path for a library
	 * Returns: str or false
	 */
	public function libInclude( $libKey = '' ) {

		if ( isset( $this->libs[ $libKey ] ) && isset( $this->libs[ $libKey ]['include'] ) ) {
			return ZEROBSCRM_PATH . $this->libs[ $libKey ]['include'];
		}

		return false;
	}

	/**
	 * Returns the correct dompdf lib version depending on php compatibility
	 *
	 * @deprecated We no longer load Dompdf through this library system.
	 *
	 * @param string $lib_key The key/machine name.
	 * @return string
	 */
	private function checkDompdfVersion( $lib_key ) {

		if ( $lib_key === 'dompdf' ) {
			$lib_key = 'dompdf-2';
		}

		return $lib_key;
	}

	/*
	* Returns bool, are we running on a PHP version $operator (e.g. '>=') to $version
	*/
	public function has_min_php_version( $php_version ) {

		return version_compare( PHP_VERSION, $php_version, '>=' );
	}

	/**
	 * Retrieve version of a library
	 * Returns: str or false
	 */
	public function libVer( $libKey = '' ) {

		if ( isset( $this->libs[ $libKey ] ) && isset( $this->libs[ $libKey ]['version'] ) ) {
			return $this->libs[ $libKey ]['version'];
		}

		return false;
	}

	/**
	 * Check if library already loaded
	 * Returns: bool
	 */
	public function libIsLoaded( $libKey = '' ) {

		if ( isset( $this->libs[ $libKey ] ) && isset( $this->libs[ $libKey ]['include'] ) && ! isset( $this->libs[ $libKey ]['loaded'] ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Load a library via include
	 * Returns: str or false
	 */
	public function libLoad( $libKey = '' ) {

		if (
			isset( $this->libs[ $libKey ] ) &&
			isset( $this->libs[ $libKey ]['include'] ) &&
			! isset( $this->libs[ $libKey ]['loaded'] ) &&
			file_exists( ZEROBSCRM_PATH . $this->libs[ $libKey ]['include'] )
		) {
			require_once ZEROBSCRM_PATH . $this->libs[ $libKey ]['include'];
				$this->libs[ $libKey ]['loaded'] = true;
		}

				return false;
	}

				/**
				 * Autoload vendor libraries
				 */
	public function autoload_libraries() {

		require_once ZEROBSCRM_PATH . 'vendor/autoload.php';
	}

				/**
				 * Autoload files from a directory which match a regex filter
				 */
	public function autoload_from_directory( string $directory, string $regex_filter ) {

		$files = scandir( $directory );

		if ( is_array( $files ) ) {

			foreach ( $files as $file ) {

				// find files `*.ajax.*`
				if ( preg_match( $regex_filter, $file ) ) {

					// load it
					require_once $directory . '/' . $file;

				}
			}
		}
	}

				/**
				 * Autoload page AJAX
				 * (This should be fired on admin_init and later should be rethought to be true autoloading, not loading all AJAX partials as this does)
				 */
	private function load_admin_ajax() {

		$admin_page_directories = jpcrm_get_directories( ZEROBSCRM_PATH . 'admin' );

		if ( is_array( $admin_page_directories ) ) {

			foreach ( $admin_page_directories as $directory ) {

				$files = scandir( ZEROBSCRM_PATH . 'admin/' . $directory );

				if ( is_array( $files ) ) {

					foreach ( $files as $file ) {

						// find files `*.ajax.*`
						if ( strrpos( $file, '.ajax.' ) > 0 ) {

							// load it
							require_once ZEROBSCRM_PATH . 'admin/' . $directory . '/' . $file;

						}
					}
				}
			}
		}
	}

				/**
				 * Runs migrations routine
				 */
	public function run_migrations( $run_at = 'init' ) {

		// Run any migrations
		zeroBSCRM_migrations_run( $this->settings->get( 'migrations' ), $run_at );
	}

				/**
				 * Centralised method for detecting presence of WooCommerce
				 */
	public function woocommerce_is_active() {

		// check for Woo Presence
		if ( is_plugin_active( 'woocommerce/woocommerce.php' ) || ( isset( $GLOBALS['woocommerce'] ) && $GLOBALS['woocommerce'] ) ) {

							return true;

		}

		return false;
	}

				/**
				 * Centralised method for detecting presence of MailPoet
				 */
	public function mailpoet_is_active() {

		// check for mailpoet Presence
		if ( is_plugin_active( 'mailpoet/mailpoet.php' ) ) {

					return true;

		}

		return false;
	}

				// ======= / Basic Library Management =========

				// } If usage tracking is active - include the tracking code.

				// =========== Resource Loading ===============

				/**
				 * Loads usage tracking where user has accepted via settings
				 */
	public function load_usage_tracking() {

		// load if not loaded, and permitted
		if ( $this->tracking === false ) {

							$tracking_active = zeroBSCRM_getSetting( 'shareessentials' );
			if ( $tracking_active ) {
				require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-usage-tracking.php';
				$this->tracking = new jpcrm_usage_tracking();
			}
		}

		return $this->tracking;
	}

				/**
				 * Loads Endpoint Listener library
				 */
	public function load_listener() {

		if ( ! isset( $this->listener ) || $this->listener == null ) {

					$this->listener = new \Automattic\JetpackCRM\Endpoint_Listener();

		}

		return $this->listener;
	}

				/**
				 * Loads OAuth handler library
				 */
	public function load_oauth_handler() {

		if ( ! isset( $this->oauth ) || $this->oauth == null ) {
					$this->oauth = new \Automattic\JetpackCRM\Oauth_Handler();
		}

		return $this->oauth;
	}

				/**
				 * Loads Encryption library
				 */
	public function load_encryption() {

		require_once ZEROBSCRM_INCLUDE_PATH . 'class-encryption.php';

		if ( ! isset( $this->encryption ) || $this->encryption == null ) {
			$this->encryption = new \Automattic\JetpackCRM\Encryption();
		}

		return $this->encryption;
	}

	/**
	 * Loads Package Installer library
	 */
	public function load_package_installer() {

		if ( ! isset( $this->package_installer ) || $this->package_installer == null ) {

			// Package installer
			require_once ZEROBSCRM_INCLUDE_PATH . 'class-package-installer.php';

			$this->package_installer = new \Automattic\JetpackCRM\Package_Installer();

		}

		return $this->package_installer;
	}

	/**
	 * Package Installer pass through to simplify package dependency
	 */
	public function ensure_package_installed( $package_key, $min_version = 0 ) {

		$this->load_package_installer();

		return $this->package_installer->ensure_package_is_installed( $package_key, $min_version );
	}

	// ============ / Resource Loading ============

	// =============  PDF engine ============

	/**
	 * Initialise Dompdf instance
	 */
	public function pdf_engine() {

		// PDF Install check:
		zeroBSCRM_extension_checkinstall_pdfinv();

		// if we don't set options initially, weird issues happen (e.g. `installed-fonts.json` is overwritten at times):
		// https://github.com/dompdf/dompdf/issues/2990
		$options = new Dompdf\Options();

		// this batch of option setting ensures we allow remote images (http/s)
		// ... but they're only allowed from same-site urls
		$options->set( 'isRemoteEnabled', true );
		$options->addAllowedProtocol( 'http://', 'jpcrm_dompdf_assist_validate_remote_uri' );
		$options->addAllowedProtocol( 'https://', 'jpcrm_dompdf_assist_validate_remote_uri' );

		// use JPCRM storage dir for extra fonts
		$options->set( 'fontDir', jpcrm_storage_fonts_dir_path() );

		// build PDF
		$dompdf = new Dompdf\Dompdf( $options );

		// set some generic defaults, (can be overriden later)
		$dompdf->set_paper( 'A4', 'portrait' );
		$dompdf->setHttpContext(
			stream_context_create(
				array(
					'ssl' => array(
						'verify_peer'       => false,
						'verify_peer_name'  => false,
						'allow_self_signed' => true,
					),
				)
			)
		);

		return $dompdf;
	}

	// ============ / PDF engine ============

	// =========== Templating Class ===============
	/**
	 * Loads templating placeholder class into this->templating_placeholders
	 * and returns it
	 * (Can be loaded on-demand)
	 */
	public function get_templating() {

		// load if not loaded
		if ( $this->templating_placeholders === false ) {

			$this->templating_placeholders = new jpcrm_templating_placeholders();

		}

		return $this->templating_placeholders;
	}
	/**
	 * Loads fonts class into this->fonts
	 * and returns it
	 * (Can be loaded on-demand)
	 */
	public function get_fonts() {

		// load if not loaded
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-fonts.php';

		// load if not loaded
		if ( ! $this->fonts ) {

			$this->fonts = new JPCRM_Fonts();

		}

		return $this->fonts;
	}

	// ============ / Templating Class ============

	// =========== Error Coding ===================

	public function getErrorCode( $errorCodeKey = -1 ) {

		if ( $errorCodeKey ) {

			// load err codes if not loaded
			if ( ! isset( $this->errorCodes ) ) {
				$this->errorCodes = zeroBSCRM_errorCodes();
			}

			// if set, return
			if ( isset( $this->errorCodes[ $errorCodeKey ] ) ) {
				return $this->errorCodes[ $errorCodeKey ];
			}
		}

		return false;
	}

	// =========== / Error Coding ===================

	private function get_page_messages_transient_key( $obj_type, $inserted_id ) {
		return sprintf( 'pageMessages_%d_%d_%d', $this->DAL->objTypeID( $obj_type ), get_current_user_id(), $inserted_id );
	}

	private function maybe_retrieve_page_messages() {
		if ( zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'   => 'zbs-add-edit',
				'action' => 'edit',
			)
		)
			&& zeroBS_hasGETParams( array( 'admin.php' ), array( 'zbstype', 'zbsid' ) ) ) {
			$transient_key = $this->get_page_messages_transient_key( $_GET['zbstype'], $_GET['zbsid'] );
			$page_messages = get_transient( $transient_key );
			if ( ! empty( $page_messages ) ) {
				$this->pageMessages = $page_messages;
				delete_transient( $transient_key );
			}
		}
	}

	public function new_record_edit_redirect( $obj_type, $inserted_id ) {
		if ( ! empty( $this->pageMessages ) ) {
			$transient_key = $this->get_page_messages_transient_key( $obj_type, $inserted_id );
			set_transient( $transient_key, $this->pageMessages, MINUTE_IN_SECONDS );
		}
		wp_redirect( jpcrm_esc_link( 'edit', $inserted_id, $obj_type ) );
		exit;
	}

	public function catch_preheader_interrupts() {
		// This intercepts the request, looking for $_GET['page'] == $zbs->slugs['module-activate-redirect'].
		// If it sucessfully finds it, activates the module in $_GET['jpcrm-module-name'] and redirects to its 'hub' slug.
		if ( isset( $_GET['page'] ) && $_GET['page'] == $this->slugs['module-activate-redirect'] ) {
			$this->modules->activate_module_and_redirect();
		}
	}
}

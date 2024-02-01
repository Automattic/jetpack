<?php
/**
 * Primary file for the Jetpack CRM Onboarding Wizard.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Onboarding_Wizard;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Assets;

/**
 * Class Bootstrap
 */
final class Bootstrap {

	/**
	 * Stores singleton instance of class.
	 *
	 * @var ?Bootstrap
	 */
	public static $instance;

	/**
	 * Get the singleton instance or instantiate the object.
	 *
	 * @return Bootstrap The singleton instance.
	 */
	public static function get_instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_page' ) );
		add_action( 'load-admin_page_zerobscrm-obw', array( $this, 'admin_init' ) );
	}

	/**
	 * Register onboarding wizard page.
	 *
	 * @since TBD
	 * @global object $zbs Global object that contains the home menu slug.
	 *
	 * @return void
	 */
	public function register_page() {
		global $zbs;

		add_submenu_page(
			$zbs->slugs['home'],
			__( 'Welcome to Jetpack CRM', 'zero-bs-crm' ),
			'',
			'manage_options',
			'zerobscrm-obw',
			array( $this, 'render_page' )
		);
	}

	/**
	 * Register onboarding wizard resources.
	 *
	 * @since TBD
	 *
	 * @return void
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 *
	 * @since TBD
	 *
	 * @return void
	 */
	public function enqueue_admin_scripts() {
		Assets::register_script(
			'jetpack-crm-onboarding-wizard',
			'build/onboarding-wizard/index.js',
			ZBS_ROOTFILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'zero-bs-crm',
			)
		);
		Assets::enqueue_script( 'jetpack-crm-onboarding-wizard' );

		wp_add_inline_script( 'jetpack-crm-onboarding-wizard', $this->render_initial_state(), 'before' );
	}

	/**
	 * Render the initial state to hydrate the React UI.
	 *
	 * @since TBD
	 *
	 * @return string Return JSON-formatted string ready for decoding.
	 */
	public function render_initial_state() {
		/**
		 * Allow external plugins to modify the OBW hydration data.
		 *
		 * @since TBD
		 *
		 * @param array {
		 *     Array of default data we need to render our React UI.
		 *
		 *     @type string $apiRoot The base URL for the sites REST API.
		 *     @type string $apiNonce Nonce value to communicate with the sites REST API.
		 * }
		 */
		$initial_state = apply_filters(
			'jetpack_crm_onboarding_wizard_initial_state',
			array(
				'apiRoot'  => esc_url_raw( rest_url() ),
				'apiNonce' => wp_create_nonce( 'wp_rest' ),
			)
		);

		return 'var jpcrmOnboardingWizardInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $initial_state ) ) . '"));';
	}

	/**
	 * Render onboarding wizard page.
	 *
	 * This content is solely meant to give us a target to target for our React UI.
	 *
	 * @since TBD
	 *
	 * @return void
	 */
	public function render_page() {
		echo '<div id="jetpack-crm-obw-root"></div>';
	}
}

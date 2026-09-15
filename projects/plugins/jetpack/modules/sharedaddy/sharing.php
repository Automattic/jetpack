<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Set up Sharing functionality and management in wp-admin.
 *
 * @package automattic/jetpack
 */

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move classes to appropriately-named class files.

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Plugin\Sharing_Settings\Services_Config;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! defined( 'WP_SHARING_PLUGIN_URL' ) ) {
	define( 'WP_SHARING_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
	define( 'WP_SHARING_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

/**
 * Utilities to manage sharing settings from wp-admin.
 */
class Sharing_Admin {

	/**
	 * The services configuration UI.
	 *
	 * @var Services_Config
	 */
	private $services_config;

	/**
	 * Constructor.
	 * Hook into WordPress to add our functionality.
	 */
	public function __construct() {
		require_once WP_SHARING_PLUGIN_DIR . 'sharing-service.php';

		$this->services_config = new Services_Config();

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonces are handled in process_requests.
		if ( isset( $_GET['page'] ) && ( $_GET['page'] === 'sharing.php' || $_GET['page'] === 'sharing' ) ) {
			add_action( 'admin_init', array( $this, 'admin_init' ) );
		}

		add_action( 'admin_menu', array( $this, 'subscription_menu' ) );

		// Insert our CSS and JS
		add_action( 'load-settings_page_sharing', array( $this, 'sharing_head' ) );

		// Catch AJAX
		add_action( 'wp_ajax_sharing_save_services', array( $this->services_config, 'ajax_save_services' ) );
		add_action( 'wp_ajax_sharing_save_options', array( $this->services_config, 'ajax_save_options' ) );
		add_action( 'wp_ajax_sharing_new_service', array( $this->services_config, 'ajax_new_service' ) );
		add_action( 'wp_ajax_sharing_delete_service', array( $this->services_config, 'ajax_delete_service' ) );
	}

	/**
	 * Enqueue scripts and styles on the sharing settings page.
	 *
	 * @return void
	 */
	public function sharing_head() {
		wp_enqueue_script(
			'sharing-js',
			Assets::get_file_url_for_environment(
				'_inc/build/sharedaddy/admin-sharing.min.js',
				'modules/sharedaddy/admin-sharing.js'
			),
			array( 'jquery', 'jquery-ui-draggable', 'jquery-ui-droppable', 'jquery-ui-sortable', 'jquery-form' ),
			JETPACK__VERSION,
			false
		);

		/**
		 * Filters the switch that if set to true allows Jetpack to use minified assets. Defaults to true
		 * if the SCRIPT_DEBUG constant is not set or set to false. The filter overrides it.
		 *
		 * @since 6.2.0
		 *
		 * @param boolean $var should Jetpack use minified assets.
		 */
		$postfix = apply_filters( 'jetpack_should_use_minified_assets', true ) ? '.min' : '';
		if ( is_rtl() ) {
			wp_enqueue_style( 'sharing-admin', WP_SHARING_PLUGIN_URL . 'admin-sharing-rtl' . $postfix . '.css', false, JETPACK__VERSION );
		} else {
			wp_enqueue_style( 'sharing-admin', WP_SHARING_PLUGIN_URL . 'admin-sharing' . $postfix . '.css', false, JETPACK__VERSION );
		}
		wp_enqueue_style( 'sharing', WP_SHARING_PLUGIN_URL . 'sharing.css', false, JETPACK__VERSION );

		wp_enqueue_style( 'social-logos' );
		wp_enqueue_script( 'sharing-js-fe', WP_SHARING_PLUGIN_URL . 'sharing.js', array(), 4, false );
		add_thickbox();

		// On Jetpack sites, make sure we include CSS to style the admin page.
		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			Jetpack_Admin_Page::load_wrapper_styles();
		}
	}

	/**
	 * Load the process that handles saving changes on the sharing settings page.
	 *
	 * @return void
	 */
	public function admin_init() {
		$this->services_config->process_requests();
	}

	/**
	 * Register Sharing settings menu page in Settings > Sharing.
	 */
	public function subscription_menu() {
		add_submenu_page(
			'options-general.php',
			__( 'Sharing Settings', 'jetpack' ),
			__( 'Sharing', 'jetpack' ),
			'manage_options',
			'sharing',
			array( $this, 'wrapper_admin_page' )
		);
	}

	/**
	 * Display admin UI within a Jetpack header and footer.
	 *
	 * @return void
	 */
	public function wrapper_admin_page() {
		Jetpack_Admin_Page::wrap_ui( array( $this, 'management_page' ), array( 'is-wide' => true ) );
	}

	/**
	 * Sharing settings inner page structure.
	 *
	 * @return void
	 */
	public function management_page() {

		if ( ! function_exists( 'mb_stripos' ) ) {
			echo '<div id="message" class="updated fade"><h3>' . esc_html__( 'Warning! Multibyte support missing!', 'jetpack' ) . '</h3>';
			echo '<p>' . wp_kses(
				sprintf(
					/* Translators: placeholder is a link to a PHP support document. */
					__( 'This plugin will work without it, but multibyte support is used <a href="%s" rel="noopener noreferrer" target="_blank">if available</a>. You may see minor problems with Tweets and other sharing services.', 'jetpack' ),
					'https://www.php.net/manual/en/mbstring.installation.php'
				),
				array(
					'a' => array(
						'href'   => array(),
						'rel'    => array(),
						'target' => array(),
					),
				)
			) . '</p></div>';
		}

		if ( isset( $_GET['update'] ) && 'saved' === $_GET['update'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only used to display a message.
			echo '<div class="updated"><p>' . esc_html__( 'Settings have been saved', 'jetpack' ) . '</p></div>';
		}
		?>

	<div class="wrap">
		<div class="icon32" id="icon-options-general"><br /></div>
		<h1><?php esc_html_e( 'Sharing Settings', 'jetpack' ); ?></h1>

		<?php
		/**
		 * Fires at the top of the admin sharing settings screen.
		 *
		 * @module sharedaddy
		 *
		 * @since 1.6.0
		 */
		do_action( 'pre_admin_screen_sharing' );
		?>

		<?php
			$is_simple_site     = defined( 'IS_WPCOM' ) && IS_WPCOM;
			$show_block_message = $this->should_use_site_editor() && ! $is_simple_site;

			// We either show old services config or the sharing block message.
		if ( current_user_can( 'manage_options' ) ) :
			$show_block_message ? $this->sharing_block_display() : $this->services_config->render();
			endif;
		?>
	</div>

	<script type="text/javascript">
		var sharing_loading_icon = <?php echo wp_json_encode( admin_url( '/images/loading.gif' ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;
		<?php
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- we handle the nonce on the PHP side.
		if (
			isset( $_GET['create_new_service'] ) && isset( $_GET['name'] ) && isset( $_GET['url'] ) && isset( $_GET['icon'] )
			&& 'true' == $_GET['create_new_service'] // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
		) :
			?>
		jQuery(document).ready(function() {
			// Prefill new service box and then open it
			jQuery( '#new_sharing_name' ).val( <?php echo wp_json_encode( sanitize_text_field( wp_unslash( $_GET['name'] ) ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?> );
			jQuery( '#new_sharing_url' ).val( <?php echo wp_json_encode( sanitize_text_field( wp_unslash( $_GET['url'] ) ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?> );
			jQuery( '#new_sharing_icon' ).val( <?php echo wp_json_encode( sanitize_text_field( wp_unslash( $_GET['icon'] ) ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?> );
			jQuery( '#add-a-new-service' ).click();
		});
		<?php endif; ?>
	</script>
		<?php
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * Check if we should encourage to use the site editor instead of the legacy sharing settings.
	 *
	 * @return boolean
	 */
	public function should_use_site_editor() {
			$block_availability = Jetpack_Gutenberg::get_cached_availability();
			$is_block_available = isset( $block_availability['sharing-buttons'] ) && $block_availability['sharing-buttons']['available'];
			$is_block_theme     = wp_is_block_theme();
			return $is_block_available && $is_block_theme;
	}

	/**
	 * Display sharing block admin UI for settings.
	 *
	 * @return void
	 */
	public function sharing_block_display() {
		$showcase_services = array(
			new Share_Tumblr( 'tumblr', array() ),
			new Share_Facebook( 'facebook', array() ),
			new Share_Email( 'email', array() ),
			new Share_Reddit( 'reddit', array() ),
		);

		global $submenu;
		// Hide the link to Jetpack Sharing settings if no Jetpack Settings found in submenu list
		$show_jetpack_admin_settings_link = array_reduce(
			$submenu['jetpack'],
			function ( $carry, $item ) {
				return $carry || ( isset( $item[2] ) && $item[2] === 'jetpack#/settings' );
			},
			false
		);
		?>

		<div class="share_manage_options">
			<br class="clearing" />
			<h2><?php esc_html_e( 'Sharing Buttons', 'jetpack' ); ?></h2>
			<div class="sharing-block-message__items-wrapper">
				<div>
					<p><?php esc_html_e( 'Add sharing buttons to your blog and allow your visitors to share posts with their friends.', 'jetpack' ); ?></p>
					<?php $this->site_editor_prompt_display(); ?>
				</div>
				<div>
					<p><?php esc_html_e( 'Sharing Buttons example:', 'jetpack' ); ?></p>
					<div class="sharedaddy sd-sharing-enabled">
						<div class="sd-content">
							<ul class="preview">
								<?php foreach ( $showcase_services as $service ) : ?>
									<?php $this->output_preview( $service ); ?>
								<?php endforeach; ?>
							</ul>
						</div>
					</div>
				</div>
				<?php if ( $show_jetpack_admin_settings_link ) : ?>
				<p class="settings-sharing__block-theme-description">
					<?php
					printf(
						wp_kses(
							/* translators: Link to Jetpack sharing settings. */
							__( 'You are using a block-based theme. You can <a class="dops-card__link" href="%s">disable Jetpack’s legacy sharing buttons</a> and add a sharing block to your theme’s template instead.', 'jetpack' ),
							array(
								'a' => array( 'href' => array() ),
							)
						),
						esc_url( admin_url( 'admin.php?page=jetpack#/sharing' ) )
					);
					?>
				</p>
				<?php endif; ?>
			</div>
			<br class="clearing" />
		</div>
		<?php
	}

	/**
	 * Display the "Go to the site editor" prompt.
	 *
	 * @return void
	 */
	public function site_editor_prompt_display() {
		$host = new Status\Host();

		$wpcom_link = 'https://wordpress.com/support/wordpress-editor/blocks/sharing-buttons-block/';

		if ( function_exists( 'localized_wpcom_url' ) ) {
			$wpcom_link = localized_wpcom_url( $wpcom_link );
		}

		$link = $host->is_wpcom_platform() ? $wpcom_link : Redirect::get_url( 'jetpack-support-sharing-block' );

		?>
			<div class="sharing-block-message__buttons-wrapper">
				<a href="<?php echo esc_url( admin_url( 'site-editor.php?path=%2Fwp_template' ) ); ?>" class="button button-primary">
					<?php esc_html_e( 'Go to the site editor', 'jetpack' ); ?>
				</a>
				<a data-target="wpcom-help-center" href="<?php echo esc_url( $link ); ?>" class="button" target="_blank" rel="noopener noreferrer">
					<?php esc_html_e( 'Learn how to add Sharing Buttons', 'jetpack' ); ?>
				</a>
			</div>
		<?php
	}
}

/**
 * Callback to get the value for the jetpack_sharing_enabled field.
 *
 * When the sharing_disabled post_meta is unset, we follow the global setting in Sharing.
 * When it is set to 1, we disable sharing on the post, regardless of the global setting.
 * It is not possible to enable sharing on a post if it is disabled globally.
 *
 * @param array $post The post object.
 *
 * @return bool
 */
function jetpack_post_sharing_get_value( array $post ) {
	if ( ! isset( $post['id'] ) ) {
		return false;
	}

	// if sharing IS disabled on this post, enabled=false, so negate the meta
	return ! get_post_meta( $post['id'], 'sharing_disabled', true );
}

/**
 * Callback to set sharing_disabled post_meta when the
 * jetpack_sharing_enabled field is updated.
 *
 * When the sharing_disabled post_meta is unset, we follow the global setting in Sharing.
 * When it is set to 1, we disable sharing on the post, regardless of the global setting.
 * It is not possible to enable sharing on a post if it is disabled globally.
 *
 * @param bool    $enable_sharing Should sharing be enabled on this post.
 * @param WP_Post $post_object    The post object.
 *
 * @return int|bool
 */
function jetpack_post_sharing_update_value( $enable_sharing, $post_object ) {
	if ( $enable_sharing ) {
		// delete the override if we want to enable sharing
		return delete_post_meta( $post_object->ID, 'sharing_disabled' );
	} else {
		return update_post_meta( $post_object->ID, 'sharing_disabled', true );
	}
}

/**
 * Add Sharing post_meta to the REST API Post response.
 *
 * @action rest_api_init
 * @uses register_rest_field
 * @link https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/
 */
function jetpack_post_sharing_register_rest_field() {
	$post_types = get_post_types( array( 'public' => true ) );
	foreach ( $post_types as $post_type ) {
		register_rest_field(
			$post_type,
			'jetpack_sharing_enabled',
			array(
				'get_callback'    => 'jetpack_post_sharing_get_value',
				'update_callback' => 'jetpack_post_sharing_update_value',
				'schema'          => array(
					'description' => __( 'Are sharing buttons enabled?', 'jetpack' ),
					'type'        => 'boolean',
				),
			)
		);

		/**
		 * Ensures all public internal post-types support `sharing`
		 * This feature support flag is used by the REST API and Gutenberg.
		 */
		add_post_type_support( $post_type, 'jetpack-sharing-buttons' );
	}
}

// Add Sharing post_meta to the REST API Post response.
add_action( 'rest_api_init', 'jetpack_post_sharing_register_rest_field' );

// Some CPTs (e.g. Jetpack portfolios and testimonials) get registered with
// restapi_theme_init because they depend on theme support, so let's also hook to that
add_action( 'restapi_theme_init', 'jetpack_post_likes_register_rest_field', 20 );

/**
 * Initialize sharing settings in WP Admin.
 *
 * @return void
 */
function sharing_admin_init() {
	global $sharing_admin;

	$sharing_admin = new Sharing_Admin();
}

add_action( 'init', 'sharing_admin_init' );

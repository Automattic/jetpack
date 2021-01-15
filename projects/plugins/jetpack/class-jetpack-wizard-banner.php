<?php
/**
 * Displays the first page of the Wizard in a banner form
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Assets\Logo as Jetpack_Logo;
use Automattic\Jetpack\Tracking;

/**
 * Jetpack_Wizard_Banner
 **/
class Jetpack_Wizard_Banner {
	/**
	 * Jetpack_Wizard_Banner
	 *
	 * @var Jetpack_Wizard_Banner
	 **/
	private static $instance = null;

	/**
	 * Factory method
	 */
	public static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Wizard_Banner();
		}

		return self::$instance;
	}

	/**
	 * Jetpack_Wizard_Banner constructor.
	 */
	private function __construct() {
		add_action( 'current_screen', array( $this, 'maybe_initialize_hooks' ) );
	}

	/**
	 * Initialize hooks to display the banner
	 */
	public function maybe_initialize_hooks() {
		if ( ! $this->can_be_displayed() ) {
			return;
		}

		add_action( 'admin_print_styles', array( $this, 'admin_banner_styles' ) );
		add_action( 'admin_notices', array( $this, 'render_banner' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_banner_scripts' ) );
	}

	/**
	 * Can we display the banner?
	 */
	private function can_be_displayed() {
		if ( ! Jetpack_Wizard::can_be_displayed() ) {
			return false;
		}

		// Only the dashboard and plugins pages should see the banner.
		if ( ! in_array( get_current_screen()->id, array( 'dashboard', 'plugins' ), true ) ) {
			return false;
		}

		if ( ! current_user_can( 'jetpack_manage_modules' ) ) {
			return false;
		}

		// Kill if banner has been dismissed.
		if ( Jetpack_Options::get_option( 'dismissed_wizard_banner' ) ) {
			return false;
		}

		if ( ! in_array( Jetpack_Options::get_option( 'setup_wizard_status', 'not-started' ), array( 'not-started', 'intro-page' ), true ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Enqueue JavaScript files.
	 */
	public function enqueue_banner_scripts() {
		wp_enqueue_script(
			'jetpack-wizard-banner-js',
			Assets::get_file_url_for_environment(
				'_inc/build/jetpack-wizard-banner.min.js',
				'_inc/jetpack-wizard-banner.js'
			),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);

		wp_localize_script(
			'jetpack-wizard-banner-js',
			'jp_banner',
			array(
				'ajax_url'          => admin_url( 'admin-ajax.php' ),
				'wizardBannerNonce' => wp_create_nonce( 'jp-wizard-banner-nonce' ),
			)
		);
	}

	/**
	 * Include the needed styles
	 */
	public function admin_banner_styles() {
		wp_enqueue_style(
			'jetpack-wizard-banner',
			Assets::get_file_url_for_environment(
				'css/jetpack-wizard-banner.min.css',
				'css/jetpack-wizard-banner.css'
			),
			array(),
			JETPACK__VERSION
		);
	}

	/**
	 * AJAX callback
	 */
	public static function ajax_callback() {
		check_ajax_referer( 'jp-wizard-banner-nonce', 'nonce' );

		$tracking = new Tracking();

		if ( isset( $_REQUEST['personal'] ) ) {
			$tracking->record_user_event( 'setup_wizard_banner_click', array( 'button' => 'personal' ) );
		}

		if ( isset( $_REQUEST['business'] ) ) {
			$tracking->record_user_event( 'setup_wizard_banner_click', array( 'button' => 'business' ) );
		}

		if ( isset( $_REQUEST['skip'] ) ) {
			$tracking->record_user_event( 'setup_wizard_banner_click', array( 'button' => 'skip' ) );
		}

		if (
			current_user_can( 'jetpack_manage_modules' )
			&& isset( $_REQUEST['dismissBanner'] )
		) {
			Jetpack_Options::update_option( 'dismissed_wizard_banner', 1 );
			$tracking->record_user_event( 'setup_wizard_banner_dismiss' );
			wp_send_json_success();
		}

		wp_die();
	}

	/**
	 * Renders the Wizard Banner
	 *
	 * Since this HTML replicates the contents of _inc/client/setup-wizard/intro-page/index.jsx,
	 * every time one is changed, the other should also be.
	 */
	public function render_banner() {
		$jetpack_logo     = new Jetpack_Logo();
		$powering_up_logo = plugins_url( 'images/jetpack-powering-up.svg', JETPACK__PLUGIN_FILE );

		?>
		<div id="jp-wizard-banner" class="jp-wizard-banner">
			<div class="jp-wizard-banner-grid">
				<div class="jp-wizard-banner-grid-a">
					<div class="jp-emblem">
						<?php
							echo $jetpack_logo->get_jp_emblem_larger(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						?>
					</div>
					<h2 class="jp-wizard-banner-wizard-header">
						<?php esc_html_e( 'Set up Jetpack for better site security, performance, and more.', 'jetpack' ); ?>
					</h2>
					<p class="jp-wizard-banner-wizard-paragraph">
						<?php esc_html_e( 'Jetpack is a cloud-powered tool built by Automattic.', 'jetpack' ); ?>
					</p>
					<p class="jp-wizard-banner-wizard-paragraph">
						<?php esc_html_e( 'Answer a few questions and we’ll help you secure, speed up, customize, and grow your WordPress website.', 'jetpack' ); ?>
					</p>
					<div class="jp-wizard-banner-wizard-intro-question">
						<h2>
							<?php
							printf(
								/* translators: %s is the site name */
								esc_html__( 'What will %s be used for?', 'jetpack' ),
								esc_html( get_bloginfo( 'name' ) )
							);
							?>
						</h2>
						<div class="jp-wizard-banner-wizard-answer-buttons">
							<a
								id="jp-wizard-banner-personal-button"
								class="button button-primary jp-wizard-banner-wizard-button"
								href="<?php echo esc_url( Jetpack::admin_url( 'page=jetpack#/setup/income?use=personal' ) ); ?>"
							>
							<?php esc_html_e( 'Personal Use', 'jetpack' ); ?>
							</a>
							<a
								id="jp-wizard-banner-business-button"
								class="button button-primary jp-wizard-banner-wizard-button"
								href="<?php echo esc_url( Jetpack::admin_url( 'page=jetpack#/setup/income?use=business' ) ); ?>"
							>
								<?php esc_html_e( 'Business Use', 'jetpack' ); ?>
							</a>
						</div>
						<a
							class="jp-wizard-banner-wizard-skip-link"
							href="<?php echo esc_url( Jetpack::admin_url( 'page=jetpack#/setup/features' ) ); ?>"
						>
							<?php esc_html_e( 'Skip to recommended features', 'jetpack' ); ?>
						</a>
					</div>
				</div>


				<div class="jp-wizard-banner-grid-b">
					<img
						class="powering-up-img"
						width="200px"
						height="200px"
						src="<?php echo esc_url( $powering_up_logo ); ?>"
						alt="<?php esc_attr_e( 'A jetpack site powering up', 'jetpack' ); ?>"
					/>
				</div>

				<span
					class="notice-dismiss"
					title="<?php esc_attr_e( 'Dismiss this notice', 'jetpack' ); ?>">
				</span>

			</div>

		</div>
		<?php
	}
}

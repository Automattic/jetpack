<?php
/**
 * Displays the site type recommendations question as a banner.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Assets\Logo as Jetpack_Logo;

/**
 * Jetpack_Recommendations_Banner
 **/
class Jetpack_Recommendations_Banner {
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
			self::$instance = new Jetpack_Recommendations_Banner();
		}

		return self::$instance;
	}

	/**
	 * Jetpack_Recommendations_Banner constructor.
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

//		add_action( 'wp_ajax_jetpack_recommendations_banner_callback', array( $this, 'ajax_callback' ) );
		add_action( 'admin_print_styles', array( $this, 'admin_banner_styles' ) );
		add_action( 'admin_notices', array( $this, 'render_banner' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_banner_scripts' ) );
	}

	/**
	 * Determines if the banner can be displayed
	 */
	private function can_be_displayed() {
		if ( ! Jetpack_Recommendations::is_enabled() ) {
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
		if ( Jetpack_Options::get_option( 'dismissed_recommendations_banner' ) ) {
			return false;
		}

		if ( ! in_array(
			Jetpack_Options::get_option( 'recommendations_step', 'not-started' ),
			array(
				'not-started',
				'site-type-question',
			),
			true
		) ) {
			return false;
		}

		return true;
	}

	public static function ajax_callback() {
		check_ajax_referer( 'jp-recommendations-banner-nonce', 'nonce' );

		$data = Jetpack_Recommendations::get_recommendations_data();

		if ( isset( $_REQUEST['personal'] ) && is_bool( $_REQUEST['personal'] ) ) {
			$data['site-type-personal'] = true;
		}

		if ( isset( $_REQUEST['business'] ) && is_bool( $_REQUEST['business'] ) ) {
			$data['site-type-business'] = true;
		}

		if ( isset( $_REQUEST['store'] ) && is_bool( $_REQUEST['store'] ) ) {
			$data['site-type-store'] = true;
		}

		if ( isset( $_REQUEST['other'] ) && is_bool( $_REQUEST['other'] ) ) {
			$data['site-type-other'] = true;
		}

		if ( current_user_can( 'jetpack_manage_modules' ) ) {
		    error_log(print_r($data, true));
			Jetpack_Recommendations::update_recommendations_data( $data );
			wp_send_json_success();
		}

		wp_die();
	}

	/**
	 * Enqueue JavaScript files.
	 */
	public function enqueue_banner_scripts() {
		wp_enqueue_script(
			'jetpack-recommendations-banner-js',
			Assets::get_file_url_for_environment(
				'_inc/build/jetpack-recommendations-banner.min.js',
				'_inc/jetpack-recommendations-banner.js'
			),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);

		wp_localize_script(
			'jetpack-recommendations-banner-js',
			'jp_banner',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'jp-recommendations-banner-nonce' ),
			)
		);
	}

	/**
	 * Include the needed styles
	 */
	public function admin_banner_styles() {
		wp_enqueue_style(
			'jetpack-recommendations-banner',
			Assets::get_file_url_for_environment(
				'css/jetpack-recommendations-banner.min.css',
				'css/jetpack-recommendations-banner.css'
			),
			array(),
			JETPACK__VERSION
		);
	}

	/**
	 * Renders the Recommendations Banner
	 */
	public function render_banner() {
		$jetpack_logo = new Jetpack_Logo();
		?>
        <div id="jp-recommendations-banner-main" class="jp-recommendations-banner-main">
            <div class="jp-recommendations-banner__content">
                <div class="jp-recommendations-banner__logo">
					<?php
					echo $jetpack_logo->get_jp_emblem_larger(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>
                </div>
                <h1 class="jp-recommendations-banner__question">
					<?php esc_html_e( 'What type of site is TODO?', 'jetpack' ); ?>
                </h1>
                <p class="jp-recommendations-banner__description">
					<?php esc_html_e( 'This assistant will help you get the most from Jetpack. Tell us more about your goals and we’ll recommend relevant features to help you succeed.', 'jetpack' ); ?>
                </p>
                <div class="jp-recommendations-banner__answer">
                    <form id="jp-recommendations-banner-form" action="<?php echo admin_url( 'admin-post.php' ); ?>"
                          method="post">
                        <div class="jp-recommendations-banner__checkboxes">
							<?php $this->render_checkbox( 'personal', __( 'Personal', 'jetpack' ) ); ?>
							<?php $this->render_checkbox( 'business', __( 'Business', 'jetpack' ) ); ?>
							<?php $this->render_checkbox( 'store', __( 'Store', 'jetpack' ) ); ?>
							<?php $this->render_checkbox( 'other', __( 'Other', 'jetpack' ) ); ?>
                        </div>
                    </form>
                    <a id="jp-recommendations-banner-continue-button" class="jp-recommendations-banner-continue-button">
						<?php esc_html_e( "Continue", "jetpack" ) ?>
                    </a>
                    <div class="jp-recommendations-banner__description">
						<?php esc_html_e( 'All of Jetpack’s great features await you and we’ll recommend some of our favorites.', 'jetpack' ); ?>
                    </div>
                </div>
            </div>
            <div class="jp-recommendations-banner__illustration-container">
                <img
                        src="<?php echo esc_url( plugins_url( 'images/recommendations/background.svg', JETPACK__PLUGIN_FILE ), 'jetpack' ); ?>"
                        class="jp-recommendations-banner__illustration-background"
                />
                <img
                        src="<?php echo esc_url( plugins_url( 'images/recommendations/site-type-illustration.png', JETPACK__PLUGIN_FILE ), 'jetpack' ); ?>"
                        class="jp-recommendations-banner__illustration-foreground"
                />
            </div>
        </div>
		<?php
	}

	/**
	 * Renders a checkbox.
	 *
	 * @param string $title The title to put on the checkbox.
	 */
	private function render_checkbox( $name, $title ) {
		?>
        <div class="jp-recommendations-checkbox-answer__container">
            <div>
                <input name="<?php echo esc_html( $name ) ?>" type="checkbox" tabindex="-1"/>
                <label for="<?php echo esc_html( $name ) ?>" class="jp-recommendations-answer__checkbox"/>
            </div>
            <div class="jp-recommendations-answer__title">
				<?php echo esc_html( $title, 'jetpack' ); ?>
            </div>
        </div>
		<?php
	}
}

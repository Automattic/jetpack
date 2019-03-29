<?php
/**
 * Disable direct access and execution.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

include_once( 'class.jetpack-admin-page.php' );

// Builds the landing page and its menu
class Jetpack_About_Page extends Jetpack_Admin_Page {

	// Show the settings page only when Jetpack is connected or in dev mode
	protected $dont_show_if_not_active = true;

	/**
	 * Add a submenu item to the Jetpack admin menu.
	 *
	 * @return string
	 */
	function get_page_hook() {
		// Add the main admin Jetpack menu
		return add_submenu_page(
			'jetpack',
			esc_html__( 'About', 'jetpack' ),
			esc_html__( 'About', 'jetpack' ),
			'jetpack_admin_page',
			'jetpack_about',
			array( $this, 'render' )
		);
	}

	function add_page_actions( $hook ) {}
	function page_admin_scripts() {}

	/**
	 * Load styles for static page.
	 */
	function additional_styles() {
		Jetpack_Admin_Page::load_wrapper_styles();
	}

	/**
	 * Render the page with a common top and bottom part, and page specific content
	 */
	function render() {
		Jetpack_Admin_Page::wrap_ui( array( $this, 'page_render' ), array( 'show-nav' => false ) );
	}

	/**
	 * Render the page content
	 */
	function page_render() {
		?>
		<div class="page-content configure">
			<div class="frame top">
				<div class="wrap">
					<div class="jetpack-about__link-back">
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack' ) ); ?>">
							<?php esc_html_e( 'Back to Jetpack Dashboard', 'jetpack' ); ?>
						</a>
					</div>
					<div class="jetpack-about__main">
						<div class="jetpack-about__logo">
							automattic logo
						</div>
						<div class="jetpack-about__content">
							<div class="jetpack-about__text">
								<p>
									<?php esc_html_e( 'We are the people behind Automattic...', 'jetpack' ); ?>
								</p>
								<p>
									<?php esc_html_e( 'We are a distributed company...', 'jetpack' ); ?>
								</p>
								<p>
									<?php esc_html_e( 'We believe in open source...', 'jetpack' ); ?>
								</p>
								<p>
									<?php esc_html_e( 'We strive to...', 'jetpack' ); ?>
								</p>
								<p>
									<a href="https://automattic.com/jobs" target="_blank">
										<?php esc_html_e( 'Come work with us', 'jetpack' ); ?>
									</a>
								</p>
							</div>
							<div class="jetpack-about__images">
								images go here
							</div>
						</div>
					</div>
					<div class="jetpack-about__colophon">
						<h3><?php esc_html_e( 'Popular services by Automattic', 'jetpack' ); ?></h3>
						<ul class="jetpack-about__services">
							<li class="jetpack-about__service">
								plugin markup goes here
							</li>
							<li class="jetpack-about__service">
								plugin markup goes here
							</li>
							<li class="jetpack-about__service">
								plugin markup goes here
							</li>
							<li class="jetpack-about__service">
								plugin markup goes here
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

}

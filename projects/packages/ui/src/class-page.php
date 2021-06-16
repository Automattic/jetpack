<?php
/**
 * An admin page wrapper
 *
 * @package jetpack-ui
 */

namespace Automattic\Jetpack\UI;

/**
 * An Jetpack Admin Page.
 */
class Page {
	/**
	 * Header object.
	 *
	 * @var object
	 */
	private $header;

	/**
	 * Footer object.
	 *
	 * @var object
	 */
	private $footer;

	/**
	 * Constructor.
	 *
	 * @param string $page_hook The WP page hook for the admin page.
	 */
	public function __construct( $page_hook = null ) {
		if ( $page_hook ) {
			if ( is_array( $page_hook ) ) {
				foreach ( $page_hook as $hook ) {
					add_action( "admin_print_styles-$hook", array( $this, 'admin_styles' ) );
				}
			} else {
				add_action( "admin_print_styles-$page_hook", array( $this, 'admin_styles' ) );
			}
		}
	}

	/**
	 * Enqueues the admin style.
	 */
	public function admin_styles() {
		// TODO: implement min and rtl styles in some sort of build process?
		$version = time(); // where does this come from?
		wp_enqueue_style( 'jetpack-admin-page', plugins_url( 'assets/style.css', __DIR__ ), array(), $version );

		/*
		 * Add something like the following to implement minimized and rtl code.
		wp_style_add_data( 'jetpack-admin', 'rtl', 'replace' );
		wp_style_add_data( 'jetpack-admin', 'suffix', $min );
		*/
	}

	/**
	 * Init function.
	 */
	public function init() {
		$header = new Header();
		/**
		 * Sets class instance to use for the Jetpack UI header.
		 *
		 * @since 9.9.0
		 *
		 * @package ui
		 *
		 * @param object $header Header object.
		 */
		$this->header = apply_filters( 'jetpack_ui_set_header', $header );

		$footer = new Footer();
		/**
		 * Sets class instance to use for the Jetpack UI footer.
		 *
		 * @since 9.9.0
		 *
		 * @package ui
		 *
		 * @param object $footer Footer object.
		 */
		$this->footer = apply_filters( 'jetpack_ui_set_footer', $footer );
	}

	/**
	 * Build and render an <img /> tag with the Jetpack logo.
	 *
	 * @param callable $callback Rendering callback for the internal portion of the page.
	 *
	 * @return string
	 */
	public function render( $callback = null ) {
		$this->init();
		$html  = '';
		$html .= $this->header->render();
		$html .= $this->get_render_content( $callback );
		$html .= $this->footer->render();
		return $html;
	}

	/**
	 * Renders page content.
	 *
	 * @param callable $callback Rendering callback for the internal portion of the page.
	 *
	 * @return string HTML of rendered content.
	 */
	private function get_render_content( $callback ) {
		if ( is_callable( $callback ) ) {
			ob_start();
			?>
			<div class="jetpack-admin-page__container">
				<?php call_user_func( $callback ); ?>
			</div>
			<?php
			$html .= ob_get_contents();
			ob_end_clean();
			return $html;
		}
	}
}

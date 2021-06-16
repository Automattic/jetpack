<?php
/**
 * An admin page wrapper
 *
 * @package jetpack-ui
 */

namespace Automattic\Jetpack\UI;

/**
 * Create and render a Jetpack logo.
 */
class Page {
	/**
	 * Absolute URL of the Jetpack logo.
	 *
	 * @var string
	 */
	private $header;

	private $footer;

	/**
	 * Constructor.
	 * You can optionally pass a URL to override the default one.
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

	public function admin_styles() {
		// TODO: implement min and rtl styles in some sort of build process?
		$version = time(); // where does this come from?
		wp_enqueue_style( 'jetpack-admin-page', plugins_url( 'assets/style.css', __DIR__ ), array(), $version );
		// wp_style_add_data( 'jetpack-admin', 'rtl', 'replace' );
		// wp_style_add_data( 'jetpack-admin', 'suffix', $min );
	}

	public function init() {
		$header       = new Header();
		$this->header = apply_filters( 'jetpack-admin-page-set-header', $header );

		$footer       = new Footer();
		$this->footer = apply_filters( 'jetpack-admin-page-set-footer', $footer );
	}

	/**
	 * Build and render an <img /> tag with the Jetpack logo.
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

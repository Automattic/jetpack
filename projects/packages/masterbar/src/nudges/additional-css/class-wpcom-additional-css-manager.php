<?php
/**
 * WPCOM_Additional_CSS_Manager file
 *
 * Is responsible with registering the Additional CSS section in WPCOM.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

/**
 * Class WPCOM_Disable_Additional_CSS
 */
class WPCOM_Additional_CSS_Manager {

	/**
	 * The site domain.
	 *
	 * @var string
	 */
	private $domain;

	/**
	 * WPCOM_Additional_CSS_Manager constructor.
	 *
	 * @param string $domain the Site domain.
	 */
	public function __construct( $domain ) {
		$this->domain = $domain;
	}

	/**
	 * Register the Additional CSS nudge.
	 *
	 * @param \WP_Customize_Manager $wp_customize_manager The core customize manager.
	 */
	public function register_nudge( \WP_Customize_Manager $wp_customize_manager ) {
		$nudge_url  = $this->get_nudge_url();
		$nudge_text = __( 'Purchase the Explorer plan to<br> activate CSS customization', 'jetpack-masterbar' );

		$nudge = new CSS_Customizer_Nudge(
			$nudge_url,
			$nudge_text,
			'jetpack_custom_css'
		);

		$nudge->customize_register_nudge( $wp_customize_manager );
	}

	/**
	 * Get the nudge URL in WPCOM.
	 *
	 * @return string
	 */
	private function get_nudge_url() {
		return '/checkout/' . $this->domain . '/premium';
	}
}

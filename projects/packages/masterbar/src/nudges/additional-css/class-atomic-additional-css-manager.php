<?php
/**
 * WPORG_Additional_CSS_Manager file
 *
 * Responsible with replacing the Core Additional CSS section with an upgrade nudge on Atomic.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

/**
 * Class Atomic_Additional_CSS_Manager
 */
class Atomic_Additional_CSS_Manager {

	/**
	 * The site domain.
	 *
	 * @var string
	 */
	private $domain;

	/**
	 * Atomic_Additional_CSS_Manager constructor.
	 *
	 * @param string $domain the Site domain.
	 */
	public function __construct( $domain ) {
		$this->domain = $domain;
	}

	/**
	 * Replace the Additional CSS section from Customiz¡er with an upgrade nudge.
	 *
	 * @param \WP_Customize_Manager $wp_customize_manager Core customize manager.
	 */
	public function register_nudge( \WP_Customize_Manager $wp_customize_manager ) {
		$plan = $this->get_plan_name();

		$nudge_url = $this->get_nudge_url();
		/* translators: %s is the plan name. */
		$nudge_text = sprintf( __( 'Purchase the %s plan to<br> activate CSS customization', 'jetpack-masterbar' ), $plan );

		$nudge = new CSS_Customizer_Nudge(
			$nudge_url,
			$nudge_text
		);

		$wp_customize_manager->remove_control( 'custom_css' );
		$wp_customize_manager->remove_section( 'custom_css' );

		$nudge->customize_register_nudge( $wp_customize_manager );
	}

	/**
	 * Get the plan name.
	 *
	 * @return mixed
	 */
	protected function get_plan_name() {
		return \Automattic\Jetpack\Plans::get_plan( 'business_bundle' )->product_name_short;
	}

	/**
	 * Get the Nudge URL.
	 *
	 * @return string
	 */
	private function get_nudge_url() {
		return '/checkout/' . $this->domain . '/business';
	}
}

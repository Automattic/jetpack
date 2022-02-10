<?php
/**
 * Manage Footer Credit feature for Atomic sites.
 *
 * @package WPCOMSH
 */

namespace WPCOMSH_Feature_Manager;

/**
 * Class Manage_Footer_Credit_Feature
 *
 * Responsible for enabling upgrade to business plan nudge in Footer Credit feature on Free Atomic Sites.
 *
 * @package WPCOMSH_Feature_Manager
 */
class Manage_Footer_Credit_Feature {

	/**
	 * Site plan
	 *
	 * @var string
	 */
	private $plan;

	/**
	 * Manage_Footer_Credit_Feature constructor.
	 *
	 * @param string $plan The site plan.
	 */
	public function __construct($plan) {
		$this->plan = $plan;
	}

	/**
	 * Manage the feature permissions.
	 */
	public function manage() {
		add_filter( 'wpcom_better_footer_credit_can_customize', array( $this, 'can_customize_better_footer_credit' ), 10 );
	}

	/**
	 * Enable upgrade to business plan nudge in footer credit.
	 * https://github.com/Automattic/wp-calypso/issues/51929
	 *
	 * @param bool $previous_value The previous value or default value of filter.
	 */
	public function can_customize_better_footer_credit( $previous_value ) {
		return \Atomic_Plan_Manager::BUSINESS_PLAN_SLUG === $this->plan || \Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG === $this->plan;
	}
}

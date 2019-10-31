<?php
/**
 * Class Atomic_Plan_Manager
 * The plan manager gets initialize after all mu-plugins are loaded and
 * gates features based on the site plan.
 */

class Atomic_Plan_Manager {

	/**
	 * Free plan slug
	 * @var string
	 */
	const FREE_PLAN_SLUG       = 'free';

	/**
	 * Business plan slug
	 * @var string
	 */
	const BUSINESS_PLAN_SLUG   = 'business';

	/**
	 * Ecommerce plan slug
	 * @var string
	 */
	const ECOMMERCE_PLAN_SLUG  = 'ecommerce';

	/**
	 * Atomic Plan Manager instance
	 * @var string
	 */
	private static $instance;
	
	/**
	 * Initialize the plan manager
	 *
	 * @return Atomic_Plan_Manager
	 */
	public static function init() {
		if ( self::$instance ) {
			return self::$instance;
		}
		self::$instance = new self();
		self::$instance->add_hooks();

		return self::$instance;
	}

	/**
	 * Register any plan related hooks.
	 *
	 */
	private function add_hooks() {
		add_filter( 'map_meta_cap', array( $this , 'map_atomic_plan_cap' ), 10, 2 );
	}

	/**
	 * Return the local plan slug
	 * If a local plan slug can't be found it will 
	 * return BUSINESS_PLAN_SLUG by default
	 *
	 * @return string
	 */ 
	public static function current_plan_slug() {
		$at_options = get_option( 'at_options', array() );
		if ( ! is_array( $at_options ) ) {
			$at_options = array( 'plan_slug' => self::BUSINESS_PLAN_SLUG );
		} else if ( ! isset( $at_options[ 'plan_slug' ] ) ) {
			$at_options[ 'plan_slug' ] = self::BUSINESS_PLAN_SLUG;
		}
		return $at_options[ 'plan_slug' ];
	}

	/**
	 * Check if the site has an Atomic supported plan.
	 *
	 * @return bool
	 */
	public function has_atomic_supported_plan() {
		$supported_plans = [ 
			self::BUSINESS_PLAN_SLUG,
			self::ECOMMERCE_PLAN_SLUG,
		];

		$plan_slug = self::current_plan_slug();
		return in_array( $plan_slug, $supported_plans, true );
	}

	/**
	 * Disable theme and plugin related capabilities if the site
	 * does not have an atomic supported plan.
	 *
	 * @param $caps
	 * @param $cap
	 *
	 * @return array
	 */
	public function map_atomic_plan_cap( $caps, $cap ) {

		if ( $this->has_atomic_supported_plan() ) {
			return $caps;
		}

		// Else the site is a free Atomic site
		// so we need to disable atomic features caps.
		$theme_caps = [
			'edit_themes',
			'switch_themes',
			'install_themes',
			'update_themes',
			'delete_themes',
			'upload_themes',
		];

		$plugin_caps = [
			'activate_plugins',
			'install_plugins',
			'edit_plugins',
			'upload_plugins',
		];

		$all_atomic_caps = array_merge( $theme_caps, $plugin_caps );

		if ( in_array( $cap, $all_atomic_caps, true ) ) {
			$caps[] = 'do_not_allow';
		}

		return $caps;
	}

}


<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test class for the omnibar free-domain upsell chip and its experiment gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace ExPlat {
	if ( ! function_exists( 'ExPlat\assign_current_user' ) ) {
		/**
		 * Test double for the wpcom-only assigning ExPlat call.
		 *
		 * @param string $experiment_name The experiment name.
		 * @return string|null
		 */
		function assign_current_user( string $experiment_name ): ?string {
			$GLOBALS['explat_assign_calls'][] = $experiment_name;
			return $GLOBALS['explat_assign_return'] ?? null;
		}
	}

	if ( ! function_exists( 'ExPlat\get_current_user_assignment' ) ) {
		/**
		 * Test double for the wpcom-only non-assigning ExPlat read.
		 *
		 * @param string $experiment_name The experiment name.
		 * @return string|null
		 */
		function get_current_user_assignment( string $experiment_name ): ?string {
			$GLOBALS['explat_read_calls'][] = $experiment_name;
			return $GLOBALS['explat_read_return'] ?? null;
		}
	}
}

namespace {

	use Automattic\Jetpack\Constants;
	use Automattic\Jetpack\Jetpack_Mu_Wpcom;
	use Automattic\Jetpack\Jetpack_Mu_Wpcom\Free_Domain_Upsell_Experiment;

	require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-bar/wpcom-admin-bar.php';
	require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/common/class-free-domain-upsell-experiment.php';
	require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';

	if ( ! class_exists( 'WPCOM_Store_API' ) ) {
		/**
		 * Test double for the wpcom-only store API.
		 *
		 * This class leaks into other test files in the same process, so when no
		 * test plan is configured it delegates to Current_Plan::get() — the exact
		 * path production code takes when the class is absent.
		 */
		class WPCOM_Store_API {
			/**
			 * The plan returned by get_current_plan(), or null to delegate.
			 *
			 * @var array|null
			 */
			public static $current_plan = null;

			/**
			 * Returns the configured test plan.
			 *
			 * @param int $blog_id The blog ID (unused).
			 * @return array
			 */
			public static function get_current_plan( $blog_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				if ( null === self::$current_plan ) {
					return \Automattic\Jetpack\Current_Plan::get();
				}
				return self::$current_plan;
			}
		}
	}

	/**
	 * Tests for the free-domain upsell chip eligibility, experiment resolution,
	 * and admin bar node.
	 */
	class Free_Domain_Upsell_Test extends \WorDBless\BaseTestCase {

		/**
		 * The test admin user ID.
		 *
		 * @var int
		 */
		private $admin_id;

		/**
		 * Set up an eligible environment: Simple site, Free plan, admin user,
		 * `.wordpress.com` primary domain.
		 */
		public function set_up() {
			parent::set_up();

			$this->admin_id = wp_insert_user(
				array(
					'user_login' => 'free_domain_admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			);
			wp_set_current_user( $this->admin_id );

			Constants::set_constant( 'IS_WPCOM', true );
			update_option( 'home', 'https://testsite.wordpress.com' );
			WPCOM_Store_API::$current_plan = array(
				'is_free'      => true,
				'product_slug' => 'free_plan',
			);

			$GLOBALS['explat_assign_calls']  = array();
			$GLOBALS['explat_read_calls']    = array();
			$GLOBALS['explat_assign_return'] = null;
			$GLOBALS['explat_read_return']   = null;
		}

		/**
		 * Clean up globals, constants, filters, and the per-user transient.
		 */
		public function tear_down() {
			delete_transient( 'free-domain-upsell-variation-' . $this->admin_id );
			remove_all_filters( 'wpcom_free_domain_upsell_variation' );
			WPCOM_Store_API::$current_plan = null;
			Constants::clear_constants();
			unset(
				$GLOBALS['explat_assign_calls'],
				$GLOBALS['explat_read_calls'],
				$GLOBALS['explat_assign_return'],
				$GLOBALS['explat_read_return']
			);
			parent::tear_down();
		}

		/**
		 * Runs the chip registration against a fresh admin bar and returns the node.
		 *
		 * @return object|null
		 */
		private function get_chip_node() {
			$admin_bar = new \WP_Admin_Bar();
			wpcom_add_free_domain_upsell_chip( $admin_bar );
			return $admin_bar->get_node( 'wpcom-free-domain-upsell' );
		}

		/**
		 * Forces the experiment variation via the QA filter.
		 *
		 * @param string $variation The variation to force.
		 */
		private function force_variation( $variation ) {
			add_filter(
				'wpcom_free_domain_upsell_variation',
				function () use ( $variation ) {
					return $variation;
				}
			);
		}

		// ---- Eligibility ----

		/**
		 * The baseline environment (Free Simple admin) is eligible.
		 */
		public function test_eligible_for_free_simple_admin() {
			$this->assertTrue( wpcom_free_domain_upsell_is_eligible() );
		}

		/**
		 * A monthly-plan site is eligible (monthly_to_annual_plan counterpart).
		 */
		public function test_eligible_for_monthly_plan_site() {
			WPCOM_Store_API::$current_plan = array(
				'is_free'      => false,
				'product_slug' => 'personal-bundle-monthly',
			);
			$this->assertTrue( wpcom_free_domain_upsell_is_eligible() );
		}

		/**
		 * A yearly paid plan is not eligible.
		 */
		public function test_not_eligible_for_yearly_paid_plan() {
			WPCOM_Store_API::$current_plan = array(
				'is_free'      => false,
				'product_slug' => 'personal-bundle',
			);
			$this->assertFalse( wpcom_free_domain_upsell_is_eligible() );
		}

		/**
		 * Non-admins are not eligible.
		 */
		public function test_not_eligible_for_non_admin() {
			$subscriber = wp_insert_user(
				array(
					'user_login' => 'free_domain_subscriber',
					'user_pass'  => 'password',
					'role'       => 'subscriber',
				)
			);
			wp_set_current_user( $subscriber );
			$this->assertFalse( wpcom_free_domain_upsell_is_eligible() );
		}

		/**
		 * Sites with a mapped primary domain are not eligible.
		 */
		public function test_not_eligible_with_mapped_primary_domain() {
			update_option( 'home', 'https://example.com' );
			$this->assertFalse( wpcom_free_domain_upsell_is_eligible() );
		}

		/**
		 * Staging sites are not eligible.
		 */
		public function test_not_eligible_for_staging_site() {
			update_option( 'wpcom_is_staging_site', true );
			$this->assertFalse( wpcom_free_domain_upsell_is_eligible() );
		}

		/**
		 * Domain-only free sites are not eligible.
		 */
		public function test_not_eligible_for_domain_only_site() {
			update_option( 'options', array( 'is_domain_only' => true ) );
			$this->assertFalse( wpcom_free_domain_upsell_is_eligible() );
		}

		/**
		 * Non-Simple (e.g. Atomic/self-hosted) environments are not eligible.
		 */
		public function test_not_eligible_outside_wpcom_simple() {
			Constants::clear_single_constant( 'IS_WPCOM' );
			$this->assertFalse( wpcom_free_domain_upsell_is_eligible() );
		}

		// ---- Experiment resolution ----

		/**
		 * The QA override filter wins without any ExPlat call.
		 */
		public function test_variation_filter_override_wins() {
			$this->force_variation( 'treatment' );
			$this->assertSame( 'treatment', Free_Domain_Upsell_Experiment::get_variation() );
			$this->assertSame( array(), $GLOBALS['explat_assign_calls'] );
			$this->assertSame( array(), $GLOBALS['explat_read_calls'] );
		}

		/**
		 * Unknown variations normalize to control.
		 */
		public function test_unknown_variation_normalizes_to_control() {
			$this->force_variation( 'something_else' );
			$this->assertSame( 'control', Free_Domain_Upsell_Experiment::get_variation() );
		}

		/**
		 * A page render uses the assigning call, and the result is cached: a
		 * second read resolves from the transient without another ExPlat call.
		 */
		public function test_page_render_assigns_and_caches() {
			$GLOBALS['explat_assign_return'] = 'treatment';

			$this->assertSame( 'treatment', Free_Domain_Upsell_Experiment::get_variation() );
			$this->assertCount( 1, $GLOBALS['explat_assign_calls'] );
			$this->assertSame(
				Free_Domain_Upsell_Experiment::EXPERIMENT_NAME,
				$GLOBALS['explat_assign_calls'][0]
			);

			$this->assertSame( 'treatment', Free_Domain_Upsell_Experiment::get_variation() );
			$this->assertCount( 1, $GLOBALS['explat_assign_calls'] );
		}

		/**
		 * A REST request (e.g. the omnibar admin-bar endpoint) uses the
		 * non-assigning read and never assigns.
		 */
		public function test_rest_request_reads_without_assigning() {
			Constants::set_constant( 'REST_REQUEST', true );
			$GLOBALS['explat_read_return'] = 'treatment';

			$this->assertSame( 'treatment', Free_Domain_Upsell_Experiment::get_variation() );
			$this->assertSame( array(), $GLOBALS['explat_assign_calls'] );
			$this->assertCount( 1, $GLOBALS['explat_read_calls'] );
		}

		/**
		 * An unassigned user resolves to control without caching, so a later
		 * page render can still create the assignment.
		 */
		public function test_unassigned_resolves_to_control_without_caching() {
			$GLOBALS['explat_assign_return'] = null;

			$this->assertSame( 'control', Free_Domain_Upsell_Experiment::get_variation() );
			$this->assertSame( 'control', Free_Domain_Upsell_Experiment::get_variation() );
			// No transient was written, so both reads hit ExPlat.
			$this->assertCount( 2, $GLOBALS['explat_assign_calls'] );
		}

		/**
		 * Logged-out users resolve to control without any ExPlat call.
		 */
		public function test_logged_out_resolves_to_control() {
			wp_set_current_user( 0 );
			$this->assertSame( 'control', Free_Domain_Upsell_Experiment::get_variation() );
			$this->assertSame( array(), $GLOBALS['explat_assign_calls'] );
		}

		// ---- Admin bar node ----

		/**
		 * The chip node is added for an eligible admin in the treatment.
		 */
		public function test_chip_added_for_treatment() {
			$this->force_variation( 'treatment' );

			$node = $this->get_chip_node();
			$this->assertNotNull( $node );
			$this->assertStringContainsString( '/setup/domain-and-plan', $node->href );
			$this->assertStringContainsString( 'Free domain', $node->title );
		}

		/**
		 * No chip node for control users.
		 */
		public function test_chip_not_added_for_control() {
			$this->force_variation( 'control' );
			$this->assertNull( $this->get_chip_node() );
		}

		/**
		 * No chip node when the site is not eligible, even in the treatment.
		 */
		public function test_chip_not_added_when_not_eligible() {
			$this->force_variation( 'treatment' );
			WPCOM_Store_API::$current_plan = array(
				'is_free'      => false,
				'product_slug' => 'business-bundle',
			);
			$this->assertNull( $this->get_chip_node() );
		}
	}
}

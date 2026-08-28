<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test class for the omnibar free-domain upsell chip and its experiment gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Free_Domain_Upsell_Experiment;

require_once __DIR__ . '/explat-doubles.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-bar/wpcom-admin-bar.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/common/class-free-domain-upsell-experiment.php';
require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';

/**
 * Tests for the free-domain upsell chip eligibility, experiment resolution,
 * sidebar-notice suppression, tracking surface, and admin bar node.
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
		$this->set_plan(
			array(
				'is_free'      => true,
				'product_slug' => 'free_plan',
			)
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
		remove_all_filters( 'wpcom_free_domain_upsell_current_plan' );
		Constants::clear_constants();
		unset(
			$GLOBALS['current_screen'],
			$GLOBALS['explat_assign_calls'],
			$GLOBALS['explat_read_calls'],
			$GLOBALS['explat_assign_return'],
			$GLOBALS['explat_read_return']
		);
		parent::tear_down();
	}

	/**
	 * Sets the plan data eligibility reads, via the QA/testing filter.
	 *
	 * @param array $plan The plan data (is_free, product_slug).
	 */
	private function set_plan( array $plan ) {
		remove_all_filters( 'wpcom_free_domain_upsell_current_plan' );
		add_filter(
			'wpcom_free_domain_upsell_current_plan',
			function () use ( $plan ) {
				return $plan;
			}
		);
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

	/**
	 * Sets a real admin screen, same pattern as Survicate_Test.
	 *
	 * @param string $screen_id       The screen id.
	 * @param bool   $is_block_editor Whether the screen hosts the block editor.
	 */
	private function set_admin_screen( $screen_id, $is_block_editor = false ) {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( $screen_id );
		if ( $is_block_editor ) {
			$screen   = get_current_screen();
			$property = ( new \ReflectionClass( $screen ) )->getProperty( 'is_block_editor' );
			$property->setValue( $screen, true );
		}
	}

	// ---- Eligibility ----

	/**
	 * The baseline environment (Free Simple admin) is eligible, via the Free branch.
	 */
	public function test_eligible_for_free_simple_admin() {
		$this->assertTrue( Free_Domain_Upsell_Experiment::is_eligible() );
		$this->assertSame( 'free_to_paid_plan', Free_Domain_Upsell_Experiment::get_upsell_source() );
	}

	/**
	 * A monthly-plan site is eligible (monthly_to_annual_plan counterpart).
	 */
	public function test_eligible_for_monthly_plan_site() {
		$this->set_plan(
			array(
				'is_free'      => false,
				'product_slug' => 'personal-bundle-monthly',
			)
		);
		$this->assertTrue( Free_Domain_Upsell_Experiment::is_eligible() );
		$this->assertSame( 'monthly_to_annual_plan', Free_Domain_Upsell_Experiment::get_upsell_source() );
	}

	/**
	 * A yearly paid plan is not eligible.
	 */
	public function test_not_eligible_for_yearly_paid_plan() {
		$this->set_plan(
			array(
				'is_free'      => false,
				'product_slug' => 'personal-bundle',
			)
		);
		$this->assertFalse( Free_Domain_Upsell_Experiment::is_eligible() );
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
		$this->assertFalse( Free_Domain_Upsell_Experiment::is_eligible() );
	}

	/**
	 * Sites with a mapped primary domain are not eligible.
	 */
	public function test_not_eligible_with_mapped_primary_domain() {
		update_option( 'home', 'https://example.com' );
		$this->assertFalse( Free_Domain_Upsell_Experiment::is_eligible() );
	}

	/**
	 * Staging sites are not eligible.
	 */
	public function test_not_eligible_for_staging_site() {
		update_option( 'wpcom_is_staging_site', true );
		$this->assertFalse( Free_Domain_Upsell_Experiment::is_eligible() );
	}

	/**
	 * Domain-only free sites are not eligible.
	 */
	public function test_not_eligible_for_domain_only_site() {
		update_option( 'options', array( 'is_domain_only' => true ) );
		$this->assertFalse( Free_Domain_Upsell_Experiment::is_eligible() );
	}

	/**
	 * Non-Simple (e.g. Atomic/self-hosted) environments are not eligible.
	 */
	public function test_not_eligible_outside_wpcom_simple() {
		Constants::clear_single_constant( 'IS_WPCOM' );
		$this->assertFalse( Free_Domain_Upsell_Experiment::is_eligible() );
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
		$this->assertFalse( get_transient( 'free-domain-upsell-variation-' . $this->admin_id ) );
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

	// ---- Sidebar-notice suppression ----

	/**
	 * The winning target notice is suppressed for an eligible treatment user.
	 */
	public function test_sidebar_notice_suppressed_for_treatment() {
		$this->force_variation( 'treatment' );
		$this->assertTrue( Free_Domain_Upsell_Experiment::should_suppress_sidebar_notice( 'free_to_paid_plan' ) );
		$this->assertTrue( Free_Domain_Upsell_Experiment::should_suppress_sidebar_notice( 'monthly_to_annual_plan' ) );
	}

	/**
	 * Control users keep the sidebar notice.
	 */
	public function test_sidebar_notice_retained_for_control() {
		$this->force_variation( 'control' );
		$this->assertFalse( Free_Domain_Upsell_Experiment::should_suppress_sidebar_notice( 'free_to_paid_plan' ) );
	}

	/**
	 * Notices outside the experiment are never suppressed, even in treatment.
	 */
	public function test_sidebar_notice_retained_for_other_jitm() {
		$this->force_variation( 'treatment' );
		$this->assertFalse( Free_Domain_Upsell_Experiment::should_suppress_sidebar_notice( 'domain_upsell_nudge' ) );
	}

	/**
	 * An ineligible user keeps the notice AND is never enrolled: the
	 * eligibility gate runs before the assigning variation read.
	 */
	public function test_sidebar_notice_retained_and_no_assignment_when_ineligible() {
		$this->set_plan(
			array(
				'is_free'      => false,
				'product_slug' => 'personal-bundle',
			)
		);
		$GLOBALS['explat_assign_return'] = 'treatment';

		$this->assertFalse( Free_Domain_Upsell_Experiment::should_suppress_sidebar_notice( 'free_to_paid_plan' ) );
		$this->assertSame( array(), $GLOBALS['explat_assign_calls'] );
	}

	/**
	 * An eligible but unassigned user keeps the notice (resolves to control).
	 */
	public function test_sidebar_notice_retained_while_unassigned() {
		$GLOBALS['explat_assign_return'] = null;
		$this->assertFalse( Free_Domain_Upsell_Experiment::should_suppress_sidebar_notice( 'free_to_paid_plan' ) );
	}

	// ---- Tracking surface ----

	/**
	 * Without an admin screen the surface is the site frontend.
	 */
	public function test_tracking_surface_site_frontend() {
		$this->assertSame( 'site_frontend', wpcom_admin_bar_tracking_surface() );
	}

	/**
	 * A regular admin screen reports wp_admin.
	 */
	public function test_tracking_surface_wp_admin() {
		$this->set_admin_screen( 'edit-post' );
		$this->assertSame( 'wp_admin', wpcom_admin_bar_tracking_surface() );
	}

	/**
	 * A block editor screen reports post_editor.
	 */
	public function test_tracking_surface_post_editor() {
		$this->set_admin_screen( 'post', true );
		$this->assertSame( 'post_editor', wpcom_admin_bar_tracking_surface() );
	}

	/**
	 * The site editor reports site_editor (checked before is_block_editor()).
	 */
	public function test_tracking_surface_site_editor() {
		$this->set_admin_screen( 'site-editor', true );
		$this->assertSame( 'site_editor', wpcom_admin_bar_tracking_surface() );
	}

	// ---- Admin bar node ----

	/**
	 * The chip node is added for an eligible admin in the treatment, linking to
	 * the upsell flow with the site slug and a surface-accurate ref.
	 */
	public function test_chip_added_for_treatment() {
		$this->force_variation( 'treatment' );

		$node = $this->get_chip_node();
		$this->assertNotNull( $node );
		$this->assertStringContainsString( '/setup/domain-and-plan', $node->href );
		$this->assertStringContainsString( 'siteSlug=testsite.wordpress.com', $node->href );
		$this->assertStringContainsString( 'ref=site_frontend', $node->href );
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
		$this->set_plan(
			array(
				'is_free'      => false,
				'product_slug' => 'business-bundle',
			)
		);
		$this->assertNull( $this->get_chip_node() );
	}
}

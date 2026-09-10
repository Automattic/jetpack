<?php
/**
 * Editor Notice Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/editor-notice.php';
require_once __DIR__ . '/trait-expiry-notices-fixtures.php';

class Editor_Notice_Test extends \WorDBless\BaseTestCase {
	use Expiry_Notices_Fixtures;

	const HANDLE = 'jetpack-mu-wpcom-expiry-notices-editor-notice';

	public function set_up() {
		parent::set_up();
		$this->set_up_expiry_fixtures();
		$this->set_screen( 'post' );
	}

	public function tear_down() {
		wp_dequeue_script( self::HANDLE );
		wp_deregister_script( self::HANDLE );
		$this->tear_down_expiry_fixtures();
		parent::tear_down();
	}

	private function set_screen( string $id, bool $is_block_editor = true ): void {
		set_current_screen( $id );
		get_current_screen()->is_block_editor( $is_block_editor );
	}

	/**
	 * The notice data, failing the test rather than returning null.
	 *
	 * @return array<string,mixed>
	 */
	private function notice(): array {
		$data = wpcom_expiry_notices_editor_notice_data();
		if ( null === $data ) {
			$this->fail( 'expected the editor notice to show' );
		}
		return $data;
	}

	public function test_shows_exactly_when_the_banner_would_outside_the_dashboard(): void {
		foreach ( array( array( 45, 'business-bundle' ), array( 200, 'business-bundle' ), array( 8, 'business-bundle-monthly' ) ) as list( $days, $slug ) ) {
			$this->set_purchase( $days, false, $slug );
			$this->assertNull( wpcom_expiry_notices_editor_notice_data(), "expected no notice for {$slug} at {$days} days" );
		}
		$this->set_purchase( 5, false, 'business-bundle-monthly' );
		$this->assertNotNull( wpcom_expiry_notices_editor_notice_data() );
	}

	public function test_each_stage_carries_its_own_content_and_actions(): void {
		$cases = array(
			// days => [ content prefix, primary label, has other-plans link, dismissible ].
			5   => array( 'Your plan expires in 5 days. Your site will move to the Free plan', 'Renew now', false, false ),
			-5  => array( 'Your plan has expired. Your site will move to the Free plan.', 'Renew now', true, false ),
			-45 => array( 'Your plan has expired. Your site has been moved to the Free plan.', 'Restore site', false, true ),
		);
		foreach ( $cases as $days => list( $prefix, $label, $has_plans, $is_dismissible ) ) {
			$this->set_purchase( $days );
			$data = $this->notice();
			$this->assertStringStartsWith( $prefix, $data['content'], "wrong content at {$days} days" );
			$this->assertSame( $label, $data['primary']['label'], "wrong primary CTA at {$days} days" );
			$this->assertStringContainsString( '/checkout/business-bundle/', $data['primary']['url'] );
			$this->assertSame( $has_plans, null !== $data['secondary'], "wrong secondary CTA at {$days} days" );
			$this->assertSame( $is_dismissible, $data['isDismissible'], "wrong dismissibility at {$days} days" );
			$this->assertSame( Expiry_Notice_Dismiss::banner_meta_key(), $data['metaKey'] );
		}
	}

	public function test_a_banner_dismissal_hides_the_editor_notice_too(): void {
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::banner_meta_key(), time() - DAY_IN_SECONDS );
		$this->assertNull( wpcom_expiry_notices_editor_notice_data() );
	}

	public function test_track_props_describe_the_state(): void {
		$this->set_purchase( 5 );
		$this->assertSame(
			array(
				'state'          => 'approaching_expiry',
				'days_remaining' => 5,
				'product_slug'   => 'business-bundle',
				'is_plan_owner'  => 'true',
				'surface'        => 'post_editor',
			),
			$this->notice()['trackProps']
		);
	}

	public function test_a_non_owner_admin_gets_the_reason_and_no_actions(): void {
		$this->act_as_non_owner();
		$this->set_purchase( -5 );
		$data = $this->notice();

		$this->assertSame( 'Your plan has expired. This plan was purchased by a different WordPress.com account. To manage this plan, log in to that account or contact the account owner.', $data['content'] );
		$this->assertNull( $data['primary'] );
		$this->assertNull( $data['secondary'] );
		$this->assertSame( 'false', $data['trackProps']['is_plan_owner'] );
	}

	public function test_surface_names_the_editor(): void {
		$this->set_purchase( 5 );
		$this->assertSame( 'post_editor', $this->notice()['surface'] );

		$this->set_screen( 'site-editor' );
		$this->assertSame( 'site_editor', $this->notice()['surface'] );

		$this->set_screen( 'widgets' );
		$this->assertSame( 'widgets', $this->notice()['surface'] );
	}

	public function test_checkout_returns_to_the_editor_deep_link(): void {
		$_SERVER['REQUEST_URI'] = '/wp-admin/site-editor.php?p=%2Fpage&canvas=edit&settings-updated=true';
		$this->set_purchase( 5 );
		$url = $this->notice()['primary']['url'];

		$this->assertStringContainsString( 'redirect_to=' . rawurlencode( admin_url( 'site-editor.php?p=%2Fpage&canvas=edit' ) ), $url );
		$this->assertStringNotContainsString( 'settings-updated', rawurldecode( $url ) );
	}

	public function test_enqueues_the_data_on_block_editor_screens_only(): void {
		$this->set_purchase( 5 );
		wpcom_expiry_notices_enqueue_editor_notice_assets();

		$this->assertTrue( wp_script_is( self::HANDLE, 'enqueued' ) );
		$inline = wp_scripts()->get_inline_script_data( self::HANDLE, 'before' );
		$this->assertStringContainsString( 'window.wpcomExpiryEditorNotice = {', $inline );
		$this->assertStringContainsString( '"isDismissible":false', $inline );
		$this->assertStringContainsString( '"surface":"post_editor"', $inline );

		wp_dequeue_script( self::HANDLE );
		$this->set_screen( 'customize', false );
		wpcom_expiry_notices_enqueue_editor_notice_assets();
		$this->assertFalse( wp_script_is( self::HANDLE, 'enqueued' ) );

		$this->set_screen( 'post' );
		$this->set_purchase( 45 );
		wpcom_expiry_notices_enqueue_editor_notice_assets();
		$this->assertFalse( wp_script_is( self::HANDLE, 'enqueued' ) );
	}
}

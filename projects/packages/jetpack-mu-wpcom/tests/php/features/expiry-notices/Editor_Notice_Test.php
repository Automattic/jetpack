<?php
/**
 * Editor Notice Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/admin-banner.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/editor-notice.php';
require_once __DIR__ . '/trait-expiry-notices-fixtures.php';

class Editor_Notice_Test extends \WorDBless\BaseTestCase {
	use Expiry_Notices_Fixtures;

	const HANDLE = 'jetpack-mu-wpcom-expiry-notices-editor-notice';

	/**
	 * @var string|null
	 */
	private $request_uri;

	public function set_up() {
		parent::set_up();
		// Restored rather than unset afterwards: cron reads it at shutdown, and a
		// missing key there is a warning the process-isolated test reports as an error.
		$this->request_uri = $_SERVER['REQUEST_URI'] ?? null;
		$this->set_up_expiry_fixtures();
		$this->set_screen( 'post' );
	}

	public function tear_down() {
		if ( null === $this->request_uri ) {
			unset( $_SERVER['REQUEST_URI'] );
		} else {
			$_SERVER['REQUEST_URI'] = $this->request_uri;
		}
		wp_dequeue_script( self::HANDLE );
		wp_deregister_script( self::HANDLE );
		$this->tear_down_expiry_fixtures();
		parent::tear_down();
	}

	/**
	 * Make a screen current, flagged as a block editor the way core flags the
	 * post editor, site editor, and block widgets screen.
	 */
	private function set_screen( string $id, bool $is_block_editor = true ): void {
		set_current_screen( $id );
		get_current_screen()->is_block_editor( $is_block_editor );
		$this->flush_expiry_memos();
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

	public function test_early_warning_is_left_to_the_dashboard(): void {
		$this->set_purchase( 45 );
		$this->assertNull( wpcom_expiry_notices_editor_notice_data() );
	}

	public function test_final_week_reads_the_heading_into_the_body(): void {
		$this->set_purchase( 5 );
		$data = $this->notice();

		$this->assertStringStartsWith( 'Your plan expires in 5 days. Your site will move to the Free plan', $data['content'] );
		$this->assertStringContainsString( '50 GB of storage', $data['content'] );
		$this->assertStringContainsString( '/checkout/business-bundle/', $data['primary']['url'] );
		$this->assertNull( $data['secondary'] );
		$this->assertFalse( $data['isDismissible'] );
	}

	public function test_grace_offers_the_other_plans(): void {
		$this->set_purchase( -5 );
		$data = $this->notice();

		$this->assertSame( 'Renew now', $data['primary']['label'] );
		$this->assertStringContainsString( '/plans/', $data['secondary']['url'] );
		$this->assertFalse( $data['isDismissible'] );
	}

	public function test_post_grace_is_dismissible_to_the_banner_key(): void {
		$this->set_purchase( -45 );
		$data = $this->notice();

		$this->assertTrue( $data['isDismissible'] );
		$this->assertSame( Expiry_Notice_Dismiss::META_BANNER, $data['metaKey'] );
		$this->assertSame( 'Restore site', $data['primary']['label'] );
		$this->assertNull( $data['secondary'] );
	}

	public function test_a_banner_dismissal_hides_the_editor_notice_too(): void {
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER, time() - DAY_IN_SECONDS );
		$this->flush_expiry_memos();
		$this->assertNull( wpcom_expiry_notices_editor_notice_data() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_reverted_site_is_sent_to_support(): void {
		$this->pretend_reverted();
		$this->set_purchase( -45 );
		$data = $this->notice();

		$this->assertSame( 'Contact support', $data['primary']['label'] );
		$this->assertStringContainsString( 'need your help getting it restored', $data['primary']['message'] );
	}

	public function test_monthly_plans_wait_for_the_final_week(): void {
		$this->set_purchase( 8, false, 'business-bundle-monthly' );
		$this->assertNull( wpcom_expiry_notices_editor_notice_data() );

		$this->set_purchase( 5, false, 'business-bundle-monthly' );
		$this->assertNotNull( wpcom_expiry_notices_editor_notice_data() );
	}

	public function test_nothing_for_an_active_plan(): void {
		$this->set_purchase( 200 );
		$this->assertNull( wpcom_expiry_notices_editor_notice_data() );
	}

	public function test_nothing_for_non_admins(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->set_purchase( 5 );
		$this->assertNull( wpcom_expiry_notices_editor_notice_data() );
	}

	public function test_track_props_describe_the_state(): void {
		$this->set_purchase( 5 );
		$data = $this->notice();

		$this->assertSame(
			array(
				'state'          => 'approaching_expiry',
				'days_remaining' => 5,
				'product_slug'   => 'business-bundle',
			),
			$data['trackProps']
		);
	}

	public function test_context_names_the_editor(): void {
		$this->set_purchase( 5 );
		$this->assertSame( 'post-editor', $this->notice()['context'] );

		$this->set_screen( 'site-editor' );
		$this->assertSame( 'site-editor', $this->notice()['context'] );

		$this->set_screen( 'widgets' );
		$this->assertSame( 'widgets', $this->notice()['context'] );
	}

	public function test_checkout_returns_to_the_editor_deep_link(): void {
		$_SERVER['REQUEST_URI'] = '/wp-admin/site-editor.php?p=%2Fpage&canvas=edit';
		$this->set_purchase( 5 );
		$data = $this->notice();

		$this->assertStringContainsString( 'redirect_to=', $data['primary']['url'] );
		$this->assertStringContainsString( rawurlencode( 'site-editor.php?p=%2Fpage&canvas=edit' ), $data['primary']['url'] );
	}

	public function test_enqueues_and_inlines_the_data_on_an_editor_screen(): void {
		$this->set_purchase( 5 );
		wpcom_expiry_notices_enqueue_editor_notice_assets();

		$this->assertTrue( wp_script_is( self::HANDLE, 'enqueued' ) );
		$inline = wp_scripts()->get_inline_script_data( self::HANDLE, 'before' );
		$this->assertStringContainsString( 'window.wpcomExpiryEditorNotice = {', $inline );
		$this->assertStringContainsString( '"isDismissible":false', $inline );
		$this->assertStringContainsString( '"context":"post-editor"', $inline );
	}

	public function test_enqueues_nothing_when_there_is_nothing_to_say(): void {
		$this->set_purchase( 45 );
		wpcom_expiry_notices_enqueue_editor_notice_assets();
		$this->assertFalse( wp_script_is( self::HANDLE, 'enqueued' ) );
	}

	public function test_enqueues_nothing_off_block_editor_screens(): void {
		$this->set_screen( 'customize', false );
		$this->set_purchase( 5 );
		wpcom_expiry_notices_enqueue_editor_notice_assets();
		$this->assertFalse( wp_script_is( self::HANDLE, 'enqueued' ) );
	}
}

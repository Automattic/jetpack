<?php
/**
 * Tests for the Mastodon sharing request handlers of the Sharing module and the Sharing Buttons block.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Extensions\Sharing_Button_Block\Share_Mastodon_Block;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-sources.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/sharing-button/sharing-button.php';

/**
 * Tests both Mastodon handlers.
 */
class Share_Mastodon_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Post being shared.
	 *
	 * @var WP_Post
	 */
	private $post;

	/**
	 * Number of times sharing_bump_stats fired.
	 *
	 * @var int
	 */
	private $stats_bumps = 0;

	/**
	 * Superglobals as they were before the test.
	 *
	 * @var array{0: array, 1: array}
	 */
	private $superglobals;

	/**
	 * Set up a logged-out visitor, a post, and hooks that observe the handler.
	 */
	public function set_up() {
		parent::set_up();

		$this->superglobals = array( $_POST, $_REQUEST );
		wp_set_current_user( 0 );
		$this->post = self::factory()->post->create_and_get();

		add_action(
			'sharing_bump_stats',
			function () {
				++$this->stats_bumps;
			}
		);
		add_filter(
			'jetpack_sharing_mastodon_default_message',
			function () {
				return 'Shared message';
			}
		);
		// Throwing stops the handler before it sends headers and dies.
		add_filter(
			'wp_redirect',
			/**
			 * @param string $location Redirect location.
			 * @return never
			 */
			function ( $location ) {
				throw new RuntimeException( $location );
			}
		);
	}

	/**
	 * Restore the superglobals.
	 */
	public function tear_down() {
		list( $_POST, $_REQUEST ) = $this->superglobals;
		parent::tear_down();
	}

	/**
	 * @dataProvider provide_handlers
	 *
	 * @param string $handler Handler class name.
	 */
	#[DataProvider( 'provide_handlers' )]
	public function test_process_request_redirects_to_instance_share_endpoint( $handler ) {
		$this->assertSame(
			'https://mastodon.social/share?text=Shared%20message',
			$this->submit_instance( $handler, 'mastodon.social/' )
		);
		$this->assertSame( 1, $this->stats_bumps );
	}

	/**
	 * @dataProvider provide_handlers
	 *
	 * @param string $handler Handler class name.
	 */
	#[DataProvider( 'provide_handlers' )]
	public function test_process_request_sends_unusable_instance_back_to_prompt( $handler ) {
		$this->assertSame(
			get_permalink( $this->post ) . '&share=mastodon&nb=1',
			$this->submit_instance( $handler, 'https://mastodon.social@evil.example' )
		);
		$this->assertSame( 0, $this->stats_bumps );
	}

	/**
	 * Data provider for the handler tests.
	 *
	 * @return array<string, array{string}>
	 */
	public static function provide_handlers() {
		return array(
			'Sharing module'        => array( Share_Mastodon::class ),
			'Sharing Buttons block' => array( Share_Mastodon_Block::class ),
		);
	}

	/**
	 * Submit the instance form to a handler and return where it redirects.
	 *
	 * @param string $handler  Handler class name.
	 * @param string $instance Address the reader entered.
	 * @return string Redirect location.
	 */
	private function submit_instance( $handler, $instance ) {
		$_POST['jetpack-mastodon-instance'] = $instance;
		$_REQUEST['_wpnonce']               = wp_create_nonce( 'jetpack_share_mastodon_instance' );

		$service = new $handler( 'mastodon', array() );
		try {
			$service->process_request( $this->post, $_POST );
		} catch ( RuntimeException $redirect ) {
			return $redirect->getMessage();
		}

		$this->fail( 'The handler did not redirect.' );
	}
}

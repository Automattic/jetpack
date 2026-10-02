<?php
/**
 * AI Launchpad sync options test file.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Sync\Defaults;
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Class AiLaunchpadSyncOptionsTest.
 *
 * @covers ::wpcomsh_ai_launchpad_sync_options
 */
#[CoversFunction( 'wpcomsh_ai_launchpad_sync_options' )]
class AiLaunchpadSyncOptionsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The AI Launchpad options are in the Jetpack Sync options whitelist on Atomic.
	 */
	public function test_ai_launchpad_options_are_synced() {
		$whitelist = Defaults::get_options_whitelist();

		foreach ( array( 'wpcom_ai_launchpad_enabled', 'wpcom_ai_launchpad_dismissed', 'wpcom_ai_launchpad_completed', 'wpcom_ai_launchpad_no_guidance' ) as $option ) {
			$this->assertContains( $option, $whitelist );
		}
	}
}

<?php
/**
 * Private Site Jetpack Status Test file.
 *
 * @package wpcomsh
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Class PrivateSiteJetpackStatusTest.
 */
class PrivateSiteJetpackStatusTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Runs in its own process, since AT_PRIVACY_MODEL cannot be undefined once another test defines it.
	 *
	 * @param string|null $privacy_model AT_PRIVACY_MODEL value, or null to leave it undefined.
	 * @param string      $blog_public   Stored blog_public value.
	 * @param bool        $expected      Expected Status::is_private_site() result.
	 *
	 * @dataProvider provide_privacy_states
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[DataProvider( 'provide_privacy_states' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_jetpack_status_counts_the_privacy_model( $privacy_model, $blog_public, $expected ) {
		if ( null !== $privacy_model ) {
			define( 'AT_PRIVACY_MODEL', $privacy_model );
		}
		update_option( 'blog_public', $blog_public );
		// The write caches an int, while Status compares against the string a fresh request reads back.
		wp_cache_delete( 'alloptions', 'options' );
		Status_Cache::clear();

		$this->assertSame( $expected, ( new Status() )->is_private_site() );
	}

	/**
	 * Privacy model and stored blog_public combinations.
	 *
	 * @return array
	 */
	public static function provide_privacy_states(): array {
		return array(
			'private site with a public blog_public' => array( 'wp_uploads', '1', true ),
			'public site with a private blog_public' => array( null, '-1', true ),
			'public site with a public blog_public'  => array( null, '1', false ),
		);
	}
}

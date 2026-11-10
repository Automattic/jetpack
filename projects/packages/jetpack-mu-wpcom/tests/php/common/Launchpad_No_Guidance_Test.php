<?php
/**
 * Tests for wpcom_launchpad_is_no_guidance().
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/common/launchpad-no-guidance.php';

/**
 * Class Launchpad_No_Guidance_Test
 */
class Launchpad_No_Guidance_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tear down each test.
	 */
	public function tear_down() {
		delete_option( 'wpcom_ai_launchpad_no_guidance' );
		delete_option( 'wpcom_ai_launchpad_enabled' );
		delete_option( 'wpcom_ai_launchpad_dismissed' );

		parent::tear_down();
	}

	/**
	 * @dataProvider provide_option_states
	 *
	 * @param bool $no_guidance Whether wpcom_ai_launchpad_no_guidance is set.
	 * @param bool $enabled     Whether wpcom_ai_launchpad_enabled is set.
	 * @param bool $dismissed   Whether wpcom_ai_launchpad_dismissed is set.
	 * @param bool $expected    Expected result.
	 */
	#[DataProvider( 'provide_option_states' )]
	public function test_is_no_guidance( $no_guidance, $enabled, $dismissed, $expected ) {
		if ( $no_guidance ) {
			update_option( 'wpcom_ai_launchpad_no_guidance', 1 );
		}
		if ( $enabled ) {
			update_option( 'wpcom_ai_launchpad_enabled', 1 );
		}
		if ( $dismissed ) {
			update_option( 'wpcom_ai_launchpad_dismissed', 1 );
		}

		$this->assertSame( $expected, wpcom_launchpad_is_no_guidance() );
	}

	/**
	 * Data provider for test_is_no_guidance.
	 *
	 * @return array
	 */
	public static function provide_option_states() {
		return array(
			'neither set'           => array( false, false, false, false ),
			'no_guidance set'       => array( true, false, false, true ),
			'enabled and dismissed' => array( false, true, true, true ),
			'enabled only'          => array( false, true, false, false ),
			'dismissed only'        => array( false, false, true, false ),
		);
	}

	/**
	 * Separate processes keep IS_ATOMIC and the cutoff constant from leaking into other tests.
	 *
	 * @dataProvider provide_cutoff_states
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param int|null   $cutoff          WPCOM_LAUNCHPAD_NO_GUIDANCE_CUTOFF_BLOG_ID, or null to leave it undefined.
	 * @param int        $blog_id         The site's WordPress.com blog ID.
	 * @param bool       $enabled         Whether wpcom_ai_launchpad_enabled is set.
	 * @param bool       $expected        Expected result.
	 * @param array|null $persistent_data Atomic persistent data, or null to leave Atomic_Persistent_Data undefined.
	 */
	#[DataProvider( 'provide_cutoff_states' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_is_no_guidance_from_the_cutoff( $cutoff, $blog_id, $enabled, $expected, $persistent_data = null ) {
		define( 'IS_ATOMIC', true );
		if ( null !== $cutoff ) {
			define( 'WPCOM_LAUNCHPAD_NO_GUIDANCE_CUTOFF_BLOG_ID', $cutoff );
		}
		if ( null !== $persistent_data ) {
			require_once __DIR__ . '/fixtures/class-atomic-persistent-data.php';
			// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Phan reads wpcomsh's blank stub, not this fixture.
			Atomic_Persistent_Data::$data = $persistent_data;
		}
		update_option( 'jetpack_options', array( 'id' => $blog_id ) );
		if ( $enabled ) {
			update_option( 'wpcom_ai_launchpad_enabled', 1 );
		}

		$this->assertSame( $expected, wpcom_launchpad_is_no_guidance() );
	}

	/**
	 * Data provider for test_is_no_guidance_from_the_cutoff.
	 *
	 * @return array
	 */
	public static function provide_cutoff_states() {
		return array(
			'created at the cutoff'                  => array( 200, 200, false, true ),
			'created before the cutoff'              => array( 200, 199, false, false ),
			'new site with the AI Launchpad'         => array( 200, 200, true, false ),
			'no cutoff defined'                      => array( null, 200, false, false ),
			'staging copy of an older site'          => array( 200, 300, false, false, array( 'WPCOM_PRODUCTION_BLOG_ID' => '199' ) ),
			'Atomic site with no production blog ID' => array( 200, 200, false, true, array() ),
		);
	}
}

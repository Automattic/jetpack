<?php
/**
 * Test class for the edit-comment editor loader.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Comments\Block_Editor;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * Test class for Jetpack_Mu_Wpcom::load_verbum_moderate().
 *
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom::load_verbum_moderate
 */
#[CoversMethod( Jetpack_Mu_Wpcom::class, 'load_verbum_moderate' )]
class Verbum_Moderate_Loader_Test extends \WorDBless\BaseTestCase {

	/**
	 * Jetpack Comments' editor takes the edit screen when the package is on.
	 */
	public function test_loads_jetpack_comments_editor_when_enabled() {
		add_filter( 'jetpack_comments_new_hotness', '__return_true' );

		Jetpack_Mu_Wpcom::load_verbum_moderate();

		$this->assertSame( 10, has_action( 'load-comment.php', array( Block_Editor::class, 'init' ) ) );
		$this->assertFalse( has_filter( 'wp_editor_settings' ) );
	}

	/**
	 * Verbum's editor stays when the package is off.
	 */
	public function test_loads_verbum_moderate_when_disabled() {
		add_filter( 'jetpack_comments_new_hotness', '__return_false' );

		Jetpack_Mu_Wpcom::load_verbum_moderate();

		$this->assertFalse( has_action( 'load-comment.php', array( Block_Editor::class, 'init' ) ) );
		$this->assertNotFalse( has_filter( 'wp_editor_settings' ) );
	}
}

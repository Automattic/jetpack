<?php
/**
 * Guideline Sync Test file.
 *
 * @package wpcomsh
 */

/**
 * Test that _guideline_* meta keys sync via prefix matching in the sync package.
 */
class GuidelineSyncTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function test_guideline_prefix_is_whitelisted() {
		$posts_module = \Automattic\Jetpack\Sync\Modules::get_module( 'posts' );
		if ( ! $posts_module || ! method_exists( $posts_module, 'is_whitelisted_post_meta' ) ) {
			$this->markTestSkipped( 'Sync Posts module not available.' );
		}

		$this->assertTrue( $posts_module->is_whitelisted_post_meta( '_guideline_copy' ) );
		$this->assertTrue( $posts_module->is_whitelisted_post_meta( '_guideline_images' ) );
		$this->assertTrue( $posts_module->is_whitelisted_post_meta( '_guideline_site' ) );
		$this->assertTrue( $posts_module->is_whitelisted_post_meta( '_guideline_additional' ) );
		$this->assertTrue( $posts_module->is_whitelisted_post_meta( '_guideline_block_core_paragraph' ) );
	}
}

<?php
/**
 * Guideline Sync Test file.
 *
 * @package wpcomsh
 */

/**
 * Test that _guideline_ meta keys are added to the sync whitelist via filter.
 */
class GuidelineSyncTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function test_guideline_meta_keys_in_whitelist() {
		$whitelist = apply_filters( 'jetpack_sync_post_meta_whitelist', array() );

		$this->assertContains( '_guideline_copy', $whitelist );
		$this->assertContains( '_guideline_images', $whitelist );
		$this->assertContains( '_guideline_site', $whitelist );
		$this->assertContains( '_guideline_additional', $whitelist );
		$this->assertContains( '_guideline_block_core_paragraph', $whitelist );
		$this->assertContains( '_guideline_block_core_image', $whitelist );
	}
}

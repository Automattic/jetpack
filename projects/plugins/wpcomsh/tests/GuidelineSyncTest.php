<?php
/**
 * Guideline Sync Test file.
 *
 * @package wpcomsh
 */

/**
 * Test wpcomsh_filter_guidelines_sync_post_meta_whitelist functionality.
 */
class GuidelineSyncTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function test_static_guideline_keys_added_to_empty_whitelist() {
		$result = wpcomsh_filter_guidelines_sync_post_meta_whitelist( array() );

		$this->assertContains( '_guideline_copy', $result );
		$this->assertContains( '_guideline_images', $result );
		$this->assertContains( '_guideline_site', $result );
		$this->assertContains( '_guideline_additional', $result );
	}

	public function test_dynamic_block_keys_present_when_blocks_registered() {
		if ( ! class_exists( 'WP_Block_Type_Registry' ) ) {
			$this->markTestSkipped( 'WP_Block_Type_Registry not available.' );
		}

		$registry = WP_Block_Type_Registry::get_instance();
		if ( empty( $registry->get_all_registered() ) ) {
			$this->markTestSkipped( 'No blocks registered in this environment.' );
		}

		$result = wpcomsh_filter_guidelines_sync_post_meta_whitelist( array() );

		$has_dynamic_key = false;
		foreach ( $result as $key ) {
			if ( str_starts_with( $key, '_guideline_block_' ) ) {
				$has_dynamic_key = true;
				break;
			}
		}
		$this->assertTrue( $has_dynamic_key, 'At least one _guideline_block_* dynamic key must be present.' );
	}
}

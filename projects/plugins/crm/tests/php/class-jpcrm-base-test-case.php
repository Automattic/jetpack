<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Tests;

use WP_UnitTestCase;

/**
 * Test case that ensures we have a clean and functioning Jetpack CRM instance.
 */
class JPCRM_Base_Test_Case extends WP_UnitTestCase {

	public function set_up(): void {
		parent::set_up();

		// We have to reset the database before each test to avoid data leaking into other tests.
		zeroBSCRM_database_reset( false );
	}

}

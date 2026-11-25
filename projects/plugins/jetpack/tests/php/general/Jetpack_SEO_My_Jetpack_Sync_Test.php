<?php
/**
 * Tests that My Jetpack's SEO card names the same modules as the SEO package.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\My_Jetpack\Main_Features;
use Automattic\Jetpack\SEO\Initializer;
use PHPUnit\Framework\Attributes\CoversNothing;

/**
 * My Jetpack copies these lists because other plugins ship it without the SEO package; only this plugin loads both.
 *
 * @coversNothing
 */
#[CoversNothing]
class Jetpack_SEO_My_Jetpack_Sync_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The SEO card switches the SEO package's module, and hides the rows of the modules that switch holds.
	 */
	public function test_seo_card_lists_match_the_seo_package() {
		$this->assertSame( Initializer::DASHBOARD_MODULE, Main_Features::SEO_MODULE );
		$this->assertEqualsCanonicalizing( Initializer::SEO_MODULES, Main_Features::SEO_CARD_MODULES );
	}
}

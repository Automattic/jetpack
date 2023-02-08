<?php
/**
 * Common Test File
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;
use PHPUnit\Framework\TestCase;

/**
 * Test Common class
 */
class CommonTest extends TestCase {

	/**
	 * Test get_iso_639_locale()
	 *
	 * @param string $language Language to test.
	 * @param string $expected Expected result.
	 *
	 * @dataProvider provider_test_get_iso_639_locale
	 */
	public function test_get_iso_639_locale( $language, $expected ) {
		$this->assertEquals( $expected, Common\get_iso_639_locale( $language ) );
	}

	/**
	 * Data provider for test_get_iso_639_locale
	 *
	 * @return array Test data.
	 */
	public static function provider_test_get_iso_639_locale() {
		return array(
			'empty string returns en'     => array( '', 'en' ),
			'pt_br returns pt-br'         => array( 'pt_br', 'pt-br' ),
			'pt-br returns pt-br'         => array( 'pt-br', 'pt-br' ),
			'zh_tw returns zh-tw'         => array( 'zh_tw', 'zh-tw' ),
			'zh-tw returns zh-tw'         => array( 'zh-tw', 'zh-tw' ),
			'zh_cn returns zh-cn'         => array( 'zh_cn', 'zh-cn' ),
			'zh-cn returns zh-cn'         => array( 'zh-cn', 'zh-cn' ),
			'unassigned zz-zz returns zz' => array( 'zz-zz', 'zz' ),
			'unassigned zz_zz returns zz' => array( 'zz_zz', 'zz' ),
		);
	}
}

<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
namespace Automattic\Jetpack\Search;

require_once __DIR__ . '/../../compatibility/unsupported-browsers.php';

use Automattic\Jetpack\Search\Test_Case as Search_Test_Case;

/**
 * Unit tests for the get_ios_version_from_user_agent.
 *
 * @package automattic/jetpack-search
 */
class Test_Get_IOS_Version extends Search_Test_Case {
	/**
	 * Remove filter.
	 *
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		remove_filter( 'option_instant_search_enabled', 'Automattic\Jetpack\Search\Compatibility\disable_instant_search_for_ios_lt_16' );
	}

	/**
	 * Data provider for test_ios_version.
	 *
	 * @return (string[]|(string|null)[])[]
	 */
	public function user_agents_data_provider() {
		return array(
			array( 'Mozilla/5.0 (iPad; CPU OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1', '14.1' ), // Chrome
			array( 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', '14.4' ), // Safari
			array( 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/33.0 Mobile/15E148 Safari/605.1.15', '14.0' ), // Firefox
			array( 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPT/7.6.9', '15.0' ), // Opera
			array( 'Mozilla/5.0 (iPad; CPU OS 9_0 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13A344 Safari/601.1', '9.0' ),
			array( 'Mozilla/5.0 (iPad; CPU OS 10_3_3 like Mac OS X) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.0 Mobile/14G60 Safari/602.1', '10.3.3' ),
			array( 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1', '11.4' ),
			array( 'Mozilla/5.0 (iPad; CPU OS 12_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148', '12.5.1' ),
			array( 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1', '13.7' ),
			array( 'Mozilla/5.0 (iPod touch; CPU iPhone OS 12_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1', '12.4' ),
			array( 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', null ), // Non-iOS
		);
	}

	/**
	 * Test get_ios_version_from_user_agent.
	 *
	 * @param string      $user_agent The user agent string.
	 * @param string|null $expected   The expected iOS version.
	 *
	 * @dataProvider user_agents_data_provider
	 */
	public function test_ios_version( $user_agent, $expected ) {
		$result = \Automattic\Jetpack\Search\Compatibility\get_ios_version_from_user_agent( $user_agent );
		$this->assertEquals( $expected, $result );
	}
}

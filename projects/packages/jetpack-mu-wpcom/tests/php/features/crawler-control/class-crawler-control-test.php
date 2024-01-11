<?php
/**
 * Tests for Crawler Control
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/crawler-control/class-crawler-control.php';

/**
 * Class Crawler_Control_Test
 */
class Crawler_Control_Test extends \WorDBless\BaseTestCase {

	/**
	 * Yes, comment is needed here.
	 */
	public function set_up() { //phpcs:ignore
		parent::set_up();
		if ( version_compare( '7.2.0', PHP_VERSION, '>' ) ) {
			$this->markTestSkipped( 'This test requires PHP 7.2 or higher because lower versions do not support mock builders in a sensible way.' );
		}
		add_filter( 'wp_die_handler', array( $this, 'wp_die_handler_filter' ) );
	}

	/**
	 * Yes, comment is needed here.
	 */
	public function tear_down() { //phpcs:ignore
		parent::tear_down();
		delete_option( Crawler_Control::OPTION_NAME );
		remove_filter( 'wp_die_handler', array( $this, 'wp_die_handler_filter' ) );
	}

	/**
	 * This overrides the default wp_die_handler with the returned function name.
	 * We will use this to handle wp_die in test environment.
	 *
	 * @return string
	 */
	public function wp_die_handler_filter() {
		return 'wp_die_halt_handler';
	}

	/**
	 * Returns a mock of Crawler_Control.
	 *
	 * @param string $user_agent The user agent.
	 * @param bool   $is_frontend Whether the request is frontend or not.
	 */
	private function get_crawler_control( $user_agent = 'sentibot', $is_frontend = true ) {
		$cc = $this->getMockBuilder( Crawler_Control::class )
		->disableOriginalConstructor()
		->onlyMethods( array( 'get_useragent', 'is_frontend', 'header' ) )
		->getMock(); // Mock all abstract methods.

		$cc->method( 'get_useragent' )
		->willReturn( $user_agent );

		$cc->method( 'is_frontend' )->willReturn( $is_frontend ); // This needs to be mocked because the test env does not have this method.
		return $cc;
	}

	/**
	 * What it says
	 */
	public function test_default_crawler_state() {
		$cc = $this->get_crawler_control();
		$this->assertFalse( $cc->is_crawlable() );
	}

	/**
	 * What it says
	 */
	public function test_option_changes_crawler_state() {
		add_option( Crawler_Control::OPTION_NAME, 1 );
		$cc = $this->get_crawler_control();
		$this->assertTrue( (bool) $cc->is_crawlable() );
	}

	/**
	 * What it says
	 */
	public function test_crawler_disables_GPTBot_by_default() {
		$cc = $this->get_crawler_control( 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)', true );

		$this->expectException( CrawlerControlDieException::class );
		$cc->exit_for_bots_unless_permitted();
	}

	/**
	 * What it says
	 */
	public function test_crawler_disables_sentibot_by_default() {
		$cc = $this->get_crawler_control( 'sentibot', true );

		$this->expectException( CrawlerControlDieException::class );
		$cc->exit_for_bots_unless_permitted();
	}

	/**
	 * What it says
	 */
	public function test_crawler_enables_sentibot_if_permitted() {
		$this->expectNotToPerformAssertions();
		add_option( Crawler_Control::OPTION_NAME, 1 );
		$cc = $this->get_crawler_control( 'sentibot', true );

		$cc->exit_for_bots_unless_permitted();
	}

	/**
	 * What it says
	 */
	public function test_crawler_enables_sentibot_if_not_frontend() {
		$this->expectNotToPerformAssertions();
		$cc = $this->get_crawler_control( 'sentibot', false );

		$cc->exit_for_bots_unless_permitted();
	}

	/**
	 * What it says
	 */
	public function test_crawler_sets_special_header_for_bingbot() {
		$cc = $this->get_crawler_control( 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)', true );
		$cc->expects( $this->exactly( 2 ) )
		->method( 'header' )
		->willReturnOnConsecutiveCalls(
			$this->equalTo( 'X-Robots-Tag: nocache' ),
			$this->equalTo( Crawler_Control::X_TERMS )
		);

		$this->expectException( CrawlerControlDieException::class );
		$cc->exit_for_bots_unless_permitted();
	}

	/**
	 * What it says
	 */
	public function test_crawler_enables_chrome() {
		$this->expectNotToPerformAssertions();
		$cc = $this->get_crawler_control( 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', true );

		$cc->exit_for_bots_unless_permitted();
	}
}

class CrawlerControlDieException extends \Exception {} //phpcs:ignore

function wp_die_halt_handler( $message, $title, $args ) { //phpcs:ignore
	throw new \CrawlerControlDieException(
		wp_json_encode(
			array(
				'message' => $message,
				'title'   => $title,
				'args'    => $args,
			)
		)
	);
}

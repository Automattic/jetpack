<?php
/**
 * Tests for agent user-agent detection.
 *
 * @package automattic/jetpack-device-detection
 */

use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Ensure User_Agent_Info::is_agent() recognizes bots and programmatic HTTP clients.
 */
class Agent_User_Agent_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		unset( $_SERVER['HTTP_USER_AGENT'] );
		parent::tearDown();
	}

	/**
	 * Test is_agent with bot user agents (should return true).
	 *
	 * @param string $ua User agent string.
	 * @dataProvider bot_user_agents_provider
	 */
	#[DataProvider( 'bot_user_agents_provider' )]
	public function test_is_agent_detects_bots( string $ua ) {
		$this->assertTrue( User_Agent_Info::is_agent( $ua ), "is_agent() should return true for bot UA: $ua" );

		$_SERVER['HTTP_USER_AGENT'] = $ua;
		$this->assertTrue( User_Agent_Info::is_agent(), "is_agent() should return true for bot UA via server superglobal: $ua" );
	}

	/**
	 * Test is_agent with HTTP client user agents (should return true).
	 *
	 * @param string $ua User agent string.
	 * @dataProvider http_client_user_agents_provider
	 */
	#[DataProvider( 'http_client_user_agents_provider' )]
	public function test_is_agent_detects_http_clients( string $ua ) {
		$this->assertTrue( User_Agent_Info::is_agent( $ua ), "is_agent() should return true for HTTP client UA: $ua" );

		$_SERVER['HTTP_USER_AGENT'] = $ua;
		$this->assertTrue( User_Agent_Info::is_agent(), "is_agent() should return true for HTTP client UA via server superglobal: $ua" );
	}

	/**
	 * Test is_agent with browser user agents (should return false).
	 *
	 * @param string $ua User agent string.
	 * @dataProvider browser_user_agents_provider
	 */
	#[DataProvider( 'browser_user_agents_provider' )]
	public function test_is_agent_rejects_browsers( string $ua ) {
		$this->assertFalse( User_Agent_Info::is_agent( $ua ), "is_agent() should return false for browser UA: $ua" );

		$_SERVER['HTTP_USER_AGENT'] = $ua;
		$this->assertFalse( User_Agent_Info::is_agent(), "is_agent() should return false for browser UA via server superglobal: $ua" );
	}

	/**
	 * Test is_agent returns true for empty user agent.
	 *
	 * Empty User-Agent is likely programmatic - real browsers always send one.
	 */
	public function test_is_agent_returns_true_for_empty_ua() {
		$this->assertTrue( User_Agent_Info::is_agent( '' ), 'is_agent() should return true for empty string' );

		unset( $_SERVER['HTTP_USER_AGENT'] );
		$this->assertTrue( User_Agent_Info::is_agent(), 'is_agent() should return true when HTTP_USER_AGENT is not set' );
	}

	/**
	 * Data provider with bot user agents.
	 *
	 * @return array
	 */
	public static function bot_user_agents_provider() {
		return array(
			// AI assistants.
			array( 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot' ),
			array( 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot' ),
			array( 'ClaudeBot/1.0; +https://anthropic.com' ),
			array( 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)' ),

			// Search engine crawlers.
			array( 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' ),
			array( 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' ),
		);
	}

	/**
	 * Data provider with HTTP client user agents.
	 *
	 * @return array
	 */
	public static function http_client_user_agents_provider() {
		return array(
			// Command-line tools.
			array( 'curl/7.68.0' ),
			array( 'curl/8.0.1' ),
			array( 'wget/1.21' ),
			array( 'wget/1.20.3' ),
			array( 'HTTPie/3.2.1' ),

			// JavaScript HTTP clients.
			array( 'axios/1.4.0' ),
			array( 'node-fetch/1.0 (+https://github.com/node-fetch/node-fetch)' ),
			array( 'got/12.0.0 (https://github.com/sindresorhus/got)' ),
			array( 'undici' ),

			// Python HTTP clients.
			array( 'python-requests/2.28.1' ),
			array( 'python-httpx/0.23.0' ),
			array( 'python-urllib/3.9' ),
			array( 'aiohttp/3.8.4' ),

			// API testing tools.
			array( 'PostmanRuntime/7.29.2' ),
			array( 'insomnia/2023.1.0' ),

			// Other HTTP clients.
			array( 'okhttp/4.10.0' ),
			array( 'Go-http-client/1.1' ),
			array( 'Java/11.0.15' ),
			array( 'libwww-perl/6.67' ),
			array( 'GuzzleHttp/7.5.0 curl/7.68.0 PHP/8.1.0' ),
			array( 'Ruby' ),
		);
	}

	/**
	 * Data provider with browser user agents that should NOT be detected as agents.
	 *
	 * @return array
	 */
	public static function browser_user_agents_provider() {
		return array(
			// Chrome.
			array( 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' ),
			array( 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' ),

			// Firefox.
			array( 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0' ),

			// Safari.
			array( 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15' ),

			// Edge.
			array( 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0' ),

			// Mobile browsers.
			array( 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1' ),
			array( 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36' ),
		);
	}
}

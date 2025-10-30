<?php
/**
 * Tests for bot user-agent detection.
 *
 * @package automattic/jetpack-device-detection
 */

use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Ensure User_Agent_Info::is_bot_user_agent() recognizes common bot UAs.
 */
class Bot_User_Agent_Test extends TestCase {

	/**
	 * Test is_bot_user_agent with explicit UA and $_SERVER fallback.
	 *
	 * @param string $ua User agent string.
	 * @return void
	 *
	 * @dataProvider bot_user_agents_provider
	 */
	#[DataProvider( 'bot_user_agents_provider' )]
	public function test_is_bot_user_agent( string $ua ) {
		// Explicit parameter usage.
		$this->assertTrue( User_Agent_Info::is_bot_user_agent( $ua ) );

		// $_SERVER['HTTP_USER_AGENT'] fallback path via is_bot().
		$_SERVER['HTTP_USER_AGENT'] = $ua;
		$this->assertTrue( User_Agent_Info::is_bot() );
	}

	/**
	 * Data provider with bot user agents to validate.
	 *
	 * @return array
	 */
	public static function bot_user_agents_provider() {
		return array(
			// OpenAI / ChatGPT related bots.
			array( 'OAI-SearchBot/1.0; +https://openai.com/searchbot' ),
			array( 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot' ),
			array( 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot' ),

			// Perplexity.
			array( 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)' ),

			// Googlebot.
			array( 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' ),
		);
	}
}

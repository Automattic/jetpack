<?php
/**
 * Blog Privacy Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Blog_Privacy;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/blog-privacy/blog-privacy.php';

/**
 * Tests for the functions defined in the Blog Privacy feature.
 */
class Blog_Privacy_Test extends \WorDBless\BaseTestCase {
	/**
	 * Post-test suite actions.
	 */
	public static function tear_down_after_class() {
		\delete_option( 'blog_public' );
		\delete_option( 'wpcom_data_sharing_opt_out' );
	}

	/**
	 * Data provider for ->test_robots_txt().
	 *
	 * @return \Iterator
	 */
	public static function provide_robots_txt(): \Iterator {
		$ai_blocks = <<<'AI_BLOCKS'
User-agent: Amazonbot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: meta-externalagent
Disallow: /

User-agent: omgili
Disallow: /

User-agent: omgilibot
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: SentiBot
Disallow: /

User-agent: sentibot
Disallow: /

AI_BLOCKS;

		yield 'public, no discourage AI' => array(
			'init_content'               => 'TEST',
			'blog_public'                => '1',
			'wpcom_data_sharing_opt_out' => null,
			'expected'                   => 'TEST',
		);

		yield 'public, discourage AI' => array(
			'init_content'               => 'TEST',
			'blog_public'                => '1',
			'wpcom_data_sharing_opt_out' => '1',
			'expected'                   => "TEST\n$ai_blocks",
		);

		yield 'discourage search, no discourage AI' => array(
			'init_content'               => 'TEST',
			'blog_public'                => '0',
			'wpcom_data_sharing_opt_out' => null,
			'expected'                   => "TEST\n$ai_blocks",
		);

		yield 'discourage search, discourage AI' => array(
			'init_content'               => 'TEST',
			'blog_public'                => '0',
			'wpcom_data_sharing_opt_out' => '1',
			'expected'                   => "TEST\n$ai_blocks",
		);

		yield 'private, no discourage AI' => array(
			'init_content'               => 'TEST',
			'blog_public'                => '-1',
			'wpcom_data_sharing_opt_out' => null,
			'expected'                   => 'TEST',
		);

		yield 'private, discourage AI' => array(
			'init_content'               => 'TEST',
			'blog_public'                => '-1',
			'wpcom_data_sharing_opt_out' => '1',
			'expected'                   => 'TEST', // Private overrides wpcom_data_sharing_opt_out setting.
		);

		yield 'discourage search, bad content'    => array(
			'init_content'               => null, // We'll treat this like an empty string.
			'blog_public'                => '0',
			'wpcom_data_sharing_opt_out' => null,
			'expected'                   => "\n$ai_blocks",
		);
	}

	/**
	 * Test for robots_txt hook.
	 */
	public function test_robots_txt_is_hooked() {
		$this->assertSame( 12, \has_filter( 'robots_txt', __NAMESPACE__ . '\\robots_txt' ) );
	}

	/**
	 * Tests for robots_txt().
	 *
	 * @dataProvider provide_robots_txt
	 * @param string     $init_content The initial robots.txt content.
	 * @param mixed      $blog_public The value of the blog_public option.
	 * @param mixed|null $wpcom_data_sharing_opt_out The value of the wpcom_data_sharing_opt_out option (null if the option is not set).
	 * @param string     $expected The expected output for robots.txt.
	 */
	#[DataProvider( 'provide_robots_txt' )]
	public function test_robots_txt( $init_content, $blog_public, $wpcom_data_sharing_opt_out, string $expected ) {
		// We use the option rather than the passed value, as the passed value is supposed to be a bool and WP.com uses -1 as well.
		\update_option( 'blog_public', $blog_public );

		if ( null === $wpcom_data_sharing_opt_out ) {
			\delete_option( 'wpcom_data_sharing_opt_out' );
		} else {
			\update_option( 'wpcom_data_sharing_opt_out', $wpcom_data_sharing_opt_out );
		}

		// Note again that we don't use the value of $blog_public, but let's pass it along in case that changes someday.
		$this->assertSame( $expected, robots_txt( $init_content, (bool) $blog_public ) );
	}
}

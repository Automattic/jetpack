<?php
/**
 * Fatal Error Screen Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class FatalErrorScreenTest.
 */
class FatalErrorScreenTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Data provider returning verbatim English `$message` fragments WP core
	 * emits from display_default_error_template().
	 */
	public static function core_english_message_provider(): array {
		return array(
			'protected endpoint single-site' => array(
				'<p>There has been a critical error on this website. Please check your site admin email inbox for instructions. If you continue to have problems, please try the <a href="https://wordpress.org/support/forums/">support forums</a>.</p><p><a href="https://wordpress.org/documentation/article/faq-troubleshooting/">Learn more about troubleshooting WordPress.</a></p>',
			),
			'default short'                  => array(
				'<p>There has been a critical error on this website.</p><p><a href="https://wordpress.org/documentation/article/faq-troubleshooting/">Learn more about troubleshooting WordPress.</a></p>',
			),
			'recovery mode'                  => array(
				'<p>There has been a critical error on this website, putting it in recovery mode. Please check the Themes and Plugins screens for more details. If you just installed or updated a theme or plugin, check the relevant page for that first.</p><p><a href="https://wordpress.org/documentation/article/faq-troubleshooting/">Learn more about troubleshooting WordPress.</a></p>',
			),
			'multisite protected endpoint'   => array(
				'<p>There has been a critical error on this website. Please reach out to your site administrator, and inform them of this error for further assistance.</p><p><a href="https://wordpress.org/documentation/article/faq-troubleshooting/">Learn more about troubleshooting WordPress.</a></p>',
			),
		);
	}

	/**
	 * Every English message that leaves the filter must point at WordPress.com
	 * URLs and must not retain any WordPress.org ones.
	 *
	 * @dataProvider core_english_message_provider
	 * @param string $message The message as WP core would have built it.
	 */
	#[DataProvider( 'core_english_message_provider' )]
	public function test_filter_replaces_wordpress_org_with_wordpress_com_urls( string $message ): void {
		$filtered = wpcomsh_filter_fatal_error_message( $message );

		$this->assertStringNotContainsString( 'wordpress.org/support/forums', $filtered );
		$this->assertStringNotContainsString( 'wordpress.org/documentation/article/faq-troubleshooting', $filtered );
		$this->assertStringContainsString(
			'href="https://wordpress.com/support/plugins/troubleshooting/"',
			$filtered
		);
	}

	/**
	 * On the single-site protected-endpoint branch, the English support-forums
	 * link is rebranded — both URL and anchor text — to the WordPress.com one.
	 */
	public function test_filter_rebrands_english_support_forums_link(): void {
		$message = '<p>There has been a critical error on this website. Please check your site admin email inbox for instructions. If you continue to have problems, please try the <a href="https://wordpress.org/support/forums/">support forums</a>.</p><p><a href="https://wordpress.org/documentation/article/faq-troubleshooting/">Learn more about troubleshooting WordPress.</a></p>';

		$filtered = wpcomsh_filter_fatal_error_message( $message );

		$this->assertStringContainsString(
			'<a href="https://wordpress.com/forums/">WordPress.com support forums</a>',
			$filtered
		);
	}

	/**
	 * The English troubleshooting link is rebranded — both URL and anchor text —
	 * to the WordPress.com one.
	 */
	public function test_filter_rebrands_english_troubleshooting_link(): void {
		$message = '<p>...</p><p><a href="https://wordpress.org/documentation/article/faq-troubleshooting/">Learn more about troubleshooting WordPress.</a></p>';

		$filtered = wpcomsh_filter_fatal_error_message( $message );

		$this->assertStringContainsString(
			'<a href="https://wordpress.com/support/plugins/troubleshooting/">Learn more about troubleshooting WordPress.com.</a>',
			$filtered
		);
	}

	/**
	 * On a localized site WP core may translate both the anchor text and the
	 * destination URL. The filter should still redirect visitors to
	 * WordPress.com while preserving the translated copy they read.
	 */
	public function test_filter_preserves_translated_anchor_text_when_core_also_translates_urls(): void {
		$message = '<p>Ha ocurrido un error crítico en este sitio web. Si los problemas continúan, prueba en los <a href="https://es.wordpress.org/support/forums/">foros de soporte</a>.</p><p><a href="https://es.wordpress.org/documentation/article/faq-troubleshooting/">Aprende más acerca de la depuración de WordPress.</a></p>';

		$filtered = wpcomsh_filter_fatal_error_message( $message );

		$this->assertStringContainsString( 'href="https://wordpress.com/forums/"', $filtered );
		$this->assertStringContainsString( 'href="https://wordpress.com/support/plugins/troubleshooting/"', $filtered );
		$this->assertStringContainsString( '>foros de soporte</a>', $filtered );
		$this->assertStringContainsString( '>Aprende más acerca de la depuración de WordPress.</a>', $filtered );
		$this->assertStringNotContainsString( 'wordpress.org/support/forums', $filtered );
		$this->assertStringNotContainsString( 'wordpress.org/documentation/article/faq-troubleshooting', $filtered );
	}

	/**
	 * Messages that do not match core's fatal-error paragraph structure should
	 * pass through unchanged even if they contain anchors.
	 */
	public function test_filter_leaves_unrelated_link_markup_untouched(): void {
		$message = '<p>Some other critical-error markup.</p><div><a href="https://example.com/help">Example help link</a></div>';

		$this->assertSame( $message, wpcomsh_filter_fatal_error_message( $message ) );
	}

	/**
	 * Messages without either WordPress.org link pass through unchanged.
	 */
	public function test_filter_leaves_unrelated_content_untouched(): void {
		$message = '<p>Some other critical-error markup that does not link anywhere.</p>';

		$this->assertSame( $message, wpcomsh_filter_fatal_error_message( $message ) );
	}
}

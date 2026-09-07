<?php
/**
 * Tests for the Tumblr sharing source.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-sources.php';

/**
 * Tests the Tumblr sharing source.
 */
class Share_Tumblr_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tumblr sharing source.
	 *
	 * @var Share_Tumblr
	 */
	private $tumblr;

	/**
	 * Set up each test.
	 */
	public function set_up() {
		parent::set_up();

		// Sharing sources are instantiated with the string service slug as the id in production
		// (see Sharing_Service), so the @param int phpdoc on the constructor is inaccurate here.
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal
		$this->tumblr = new Share_Tumblr( 'tumblr', array( 'button_style' => 'official' ) );
	}

	/**
	 * Ensure entity-encoded quotes cannot escape the data-title attribute.
	 */
	public function test_get_display_escapes_entity_encoded_attribute_breakout() {
		$markup = $this->get_display( '&#34; autofocus onfocus=alert(document.domain) data-x=&#34;' );

		$this->assertStringContainsString(
			'data-title="&quot; autofocus onfocus=alert(document.domain) data-x=&quot;"',
			$markup
		);
		$this->assertStringNotContainsString( 'data-title="" autofocus', $markup );
	}

	/**
	 * Ensure ordinary and complex titles are escaped once for their HTML attribute context.
	 *
	 * @dataProvider get_share_title_cases
	 *
	 * @param string $title              Stored post title.
	 * @param string $expected_attribute Expected serialized data-title attribute.
	 */
	#[DataProvider( 'get_share_title_cases' )]
	public function test_get_display_escapes_share_titles( $title, $expected_attribute ) {
		$this->assertStringContainsString( $expected_attribute, $this->get_display( $title ) );
	}

	/**
	 * Share title test cases.
	 *
	 * @return array[] Test cases.
	 */
	public static function get_share_title_cases() {
		return array(
			'ordinary title'               => array(
				'A plain post title',
				'data-title="A plain post title"',
			),
			// get_share_title() runs wp_kses( $title, '' ), which keeps comment-allowed tags
			// such as <strong>, so esc_attr() encodes them rather than the title stripping them.
			'entities, quotes, and markup' => array(
				'Fish &amp; Chips, "quoted" <strong>bold</strong> &lt;safe&gt;',
				'data-title="Fish &amp; Chips, &quot;quoted&quot; &lt;strong&gt;bold&lt;/strong&gt; &lt;safe&gt;"',
			),
			'Unicode title'                => array(
				'Café ☕ — 東京 &amp; “quoted”',
				'data-title="Café ☕ — 東京 &amp; “quoted”"',
			),
		);
	}

	/**
	 * Ensure hostile share URLs cannot escape the data-content attribute.
	 */
	public function test_get_display_escapes_share_url() {
		add_filter(
			'sharing_permalink',
			static function () {
				return 'https://example.com/share?a=b&c="><script>alert(1)</script>';
			}
		);

		$markup = $this->get_display( 'A plain post title' );

		$this->assertStringContainsString(
			'data-content="https://example.com/share?a=b&#038;c=scriptalert(1)/script"',
			$markup
		);
		$this->assertStringNotContainsString( '"><script', $markup );
	}

	/**
	 * Ensure the data-posttype attribute stays separated from the title attribute outside single views.
	 */
	public function test_get_display_separates_posttype_attribute() {
		$this->assertStringContainsString(
			'title="Share on Tumblr" data-posttype="link"',
			$this->get_display( 'A plain post title' )
		);
	}

	/**
	 * Ensure single views omit the data-posttype attribute and keep well-formed markup.
	 */
	public function test_get_display_omits_posttype_on_single() {
		$post = self::factory()->post->create_and_get( array( 'post_title' => 'A plain post title' ) );
		$this->go_to( get_permalink( $post ) );

		$markup = $this->tumblr->get_display( $post );

		$this->assertStringNotContainsString( 'data-posttype', $markup );
		$this->assertStringContainsString( 'title="Share on Tumblr">Share on Tumblr</a>', $markup );
	}

	/**
	 * Render the official Tumblr sharing button for a stored post title.
	 *
	 * @param string $title Post title.
	 * @return string Button markup.
	 */
	private function get_display( $title ) {
		$post = self::factory()->post->create_and_get( array( 'post_title' => $title ) );

		return $this->tumblr->get_display( $post );
	}
}

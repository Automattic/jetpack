<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Getty extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	const GETTY_IDENTIFIER = '82278805';

	const GETTY_SHORTCODE = '[getty src="82278805" width="462" height="370"]';

	const GETTY_SHORTCODE_TLD = '[getty src="82278805" width="462" height="370" tld="com"]';

	const GETTY_SHORTCODE_SLIDESHOW = '[getty src="601312382,sb10068163bs-001,157480765,sb10068163br-001,157480920" width="457" height="377" tld="com"]';

	const GETTY_SHORTCODE_MULTI = '[getty src="125972920,83421977" width="507" height="337"]';

	const GETTY_SHORTCODE_ALPHANUMERIC_DASHED_ID = '[getty src="sb10065012a-001" width="426" height="400"]';

	const GETTY_SHORTCODE_WITH_ARGS = '[getty src="82278805?et=wi6iT1Wqn0yYxEh6Ocx_aA&amp;sig=G63PuQ-eKJqGCnssk8rsSu1wcGoyUsgwqL8Jfu83wis=&amp;viewMoreLink%3Don" width="462" height="370"]';

	const GETTY_EMBED = '<div class="getty embed image" style="background-color:#fff;display:inline-block;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;color:#a7a7a7;font-size:11px;width:100%;max-width:462px;"><div style="padding:0;margin:0;text-align:left;"><a href="http://www.gettyimages.com/detail/82278805" target="_blank" style="color:#a7a7a7;text-decoration:none;font-weight:normal !important;border:none;display:inline-block;">Embed from Getty Images</a></div><div style="overflow:hidden;position:relative;height:0;padding:80.086580% 0 0 0;width:100%;"><iframe src="//embed.gettyimages.com/embed/82278805?et=wi6iT1Wqn0yYxEh6Ocx_aA&amp;sig=G63PuQ-eKJqGCnssk8rsSu1wcGoyUsgwqL8Jfu83wis=&tld=com" width="462" height="370" scrolling="no" frameborder="0" style="display:inline-block;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;" ></iframe></div><p style="margin:0;"></p></div>';

	const GETTY_EMBED_MULTI = '<div class="getty embed image" style="background-color:#fff;display:inline-block;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;color:#a7a7a7;font-size:11px;width:100%;max-width:507px;"><div style="padding:0;margin:0;text-align:left;"><a href="http://www.gettyimages.com/detail/125972920" target="_blank" style="color:#a7a7a7;text-decoration:none;font-weight:normal !important;border:none;display:inline-block;">Embed from Getty Images</a></div><div style="overflow:hidden;position:relative;height:0;padding:66.469428% 0 0 0;width:100%;"><iframe src="//embed.gettyimages.com/embed?assets=125972920,83421977&et=mRtKtGrSS9RpMnENPzEAIQ&tld=com&sig=7cbyy8qX5L-4wrESym68jkKwv98QuF_RbdI4q6Sa_3s=" width="507" height="337" scrolling="no" frameborder="0" style="display:inline-block;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;" ></iframe></div><p style="margin:0;"></p></div>';

	const GETTY_EMBED_2017 = '<a id=\'giY-P3UyQ7NgmhoUs69FfA\' class=\'gie-single\' href=\'http://www.gettyimages.com/detail/82278805\' target=\'_blank\' style=\'color:#a7a7a7;text-decoration:none;font-weight:normal !important;border:none;display:inline-block;\'>Embed from Getty Images</a><script>window.gie=window.gie||function(c){(gie.q=gie.q||[]).push(c)};gie(function(){gie.widgets.load({id:\'giY-P3UyQ7NgmhoUs69FfA\',sig:\'7_gkXdhdHtVWWsyemkD0qPEuDZVBmfepEDjfqlTi61M=\',w:\'462px\',h:\'370px\',items:\'82278805\',caption: true ,tld:\'com\',is360: false })});</script><script src=\'//embed-cdn.gettyimages.com/widgets.js\' charset=\'utf-8\' async></script>'; // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript

	const GETTY_EMBED_2017_SLIDESHOW = '<a id=\'CEIWqB2vSz5lH9pABhmy0A\' class=\'gie-slideshow\' href=\'http://www.gettyimages.com/detail/601312382\' style=\'color:#a7a7a7;text-decoration:none;font-weight:normal !important;border:none;display:inline-block;\'>Embed from Getty Images</a><script>window.gie=window.gie||function(c){(gie.q=gie.q||[]).push(c)};gie(function(){gie.widgets.load({id:\'CEIWqB2vSz5lH9pABhmy0A\',sig:\'cDACdf5bJZlDWoauJkdbDwvhtdjhQ5kn4GDr2nBQ9iA=\',w:\'457px\',h:\'377px\',items:\'601312382,sb10068163bs-001,157480765,sb10068163br-001,157480920\',caption: true ,tld:\'com\',is360: false })});</script><script src=\'//embed-cdn.gettyimages.com/widgets.js\' charset=\'utf-8\' async></script>'; // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript

	const GETTY_EMBED_ALPHANUMERIC_DASHED_ID = '<div class="getty embed image" style="background-color:#fff;display:inline-block;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;color:#a7a7a7;font-size:11px;width:100%;max-width:426px;"><div style="padding:0;margin:0;text-align:left;"><a href="http://www.gettyimages.com/detail/sb10065012a-001" target="_blank" style="color:#a7a7a7;text-decoration:none;font-weight:normal !important;border:none;display:inline-block;">Embed from Getty Images</a></div><div style="overflow:hidden;position:relative;height:0;padding:93.896714% 0 0 0;width:100%;"><iframe src="//embed.gettyimages.com/embed/sb10065012a-001?et=kbBO9dIMTBZzGVtzySE_7g&viewMoreLink=off&sig=gFY-3rZCMdUEiVCbM2wqVAKDkGwskGl3W8pSn_4QCQc=&caption=true" width="426" height="400" scrolling="no" frameborder="0" style="display:inline-block;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;"></iframe></div><p style="margin:0;"></p></div>';

	const GETTY_OLD_EMBED = '<iframe src="//embed.gettyimages.com/embed/82278805?et=wi6iT1Wqn0yYxEh6Ocx_aA&sig=G63PuQ-eKJqGCnssk8rsSu1wcGoyUsgwqL8Jfu83wis=" width="462" height="370" scrolling="no" frameborder="0" style="display:inline-block;"></iframe>';

	const GETTY_ESCAPED_EMBED = '&lt;div class="getty embed image" style="background-color:#fff;display:inline-block;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;color:#a7a7a7;font-size:11px;width:100%;max-width:462px;"&gt;&lt;div style="padding:0;margin:0;text-align:left;"&gt;&lt;a href="http://www.gettyimages.com/detail/82278805" target="_blank" style="color:#a7a7a7;text-decoration:none;font-weight:normal !important;border:none;display:inline-block;"&gt;Embed from Getty Images&lt;/a&gt;&lt;/div&gt;&lt;div style="overflow:hidden;position:relative;height:0;padding:80.086580% 0 0 0;width:100%;"&gt;&lt;iframe src="//embed.gettyimages.com/embed/82278805?et=wi6iT1Wqn0yYxEh6Ocx_aA&amp;sig=G63PuQ-eKJqGCnssk8rsSu1wcGoyUsgwqL8Jfu83wis=" width="462" height="370" scrolling="no" frameborder="0" style="display:inline-block;position:absolute;top:0;left:0;width:100%;height:100%;"&gt;&lt;/iframe&gt;&lt;/div&gt;&lt;p style="margin:0;"&gt;&lt;/p&gt;&lt;/div&gt;';

	const GETTY_ESCAPED_EMBED_2017 = '&lt;a id=\'giY-P3UyQ7NgmhoUs69FfA\' class=\'gie-single\' href=\'http://www.gettyimages.com/detail/82278805\' target=\'_blank\' style=\'color:#a7a7a7;text-decoration:none;font-weight:normal !important;border:none;display:inline-block;\'&gt;Embed from Getty Images&lt;/a&gt;&lt;script&gt;window.gie=window.gie||function(c){(gie.q=gie.q||[]).push(c)};gie(function(){gie.widgets.load({id:\'giY-P3UyQ7NgmhoUs69FfA\',sig:\'7_gkXdhdHtVWWsyemkD0qPEuDZVBmfepEDjfqlTi61M=\',w:\'462px\',h:\'370px\',items:\'82278805\',caption: true ,tld:\'com\',is360: false })});&lt;/script&gt;&lt;script src=\'//embed-cdn.gettyimages.com/widgets.js\' charset=\'utf-8\' async&gt;&lt;/script&gt;';

	const GETTY_EXAMPLE_PROCESSED = '<div class="getty embed image" style="background-color:#fff;display:inline-block;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;color:#a7a7a7;font-size:11px;width:100%;max-width:462px;"><div style="padding:0;margin:0;text-align:left;"><a href="http://www.gettyimages.com/detail/82278805" target="_blank" style="color:#a7a7a7;text-decoration:none;font-weight:normal !important;border:none;display:inline-block;">Embed from Getty Images</a></div><div style="overflow:hidden;position:relative;height:0;padding:80.086580% 0 0 0;width:100%;"><iframe src="//embed.gettyimages.com/embed/82278805?et=wi6iT1Wqn0yYxEh6Ocx_aA&amp;sig=G63PuQ-eKJqGCnssk8rsSu1wcGoyUsgwqL8Jfu83wis=&tld=com" width="462" height="370" scrolling="no" frameborder="0" style="display:inline-block;position:absolute;top:0;left:0;width:100%;height:100%;margin:0;" ></iframe></div><p style="margin:0;"></p></div>';

	public static function strip_url_signature_args( $str ) {
		return preg_replace( '/((id=\'[:alpha:\-]+)|[\?&]|&amp;|&#038;)(et=[\w-]+|sig=[\w-=]+)/', '', $str );
	}

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		if ( in_array( 'external-http', $this->getGroups(), true ) ) {
			// Used by WordPress.com - does nothing in Jetpack.
			add_filter( 'tests_allow_http_request', '__return_true' );
		} else {
			/*
			 * We normally make an HTTP request to Getty's oEmbed endpoint to generate
			 * the shortcode output.
			 * This filter bypasses that HTTP request for these tests
			 */
			add_filter( 'pre_oembed_result', array( $this, 'getty_oembed_response' ), 10, 2 );
		}
	}

	public function getty_oembed_response( $html, $url ) {
		if ( 0 !== strpos( $url, 'https://gty.im/' ) ) {
			return $html;
		}

		// Only works for https://gty.im/82278805
		// If more inputs are needed, add more outputs.
		return self::GETTY_EMBED_2017;
	}

	/**
	 * Verify that [getty] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_getty_exists() {
		$this->assertEquals( shortcode_exists( 'getty' ), true );
	}

	public function test_getty_shortcode() {
		$parsed = do_shortcode( self::GETTY_SHORTCODE );

		$doc = new DOMDocument();
		$doc->loadHTML( $parsed );
		$links = $doc->getElementsByTagName( 'a' );

		foreach ( $links as $link ) {
			$this->assertTrue( $link->hasAttribute( 'href' ) );
			$this->assertStringContainsString( self::GETTY_IDENTIFIER, $link->getAttribute( 'href' ) );
		}
	}

	public function test_getty_reverse_shortcode() {
		$shortcode = wpcom_shortcodereverse_getty( self::GETTY_EMBED );
		$this->assertEquals( self::GETTY_SHORTCODE, $shortcode );
	}

	public function test_getty_reverse_multi_shortcode() {
		$shortcode = wpcom_shortcodereverse_getty( self::GETTY_EMBED_MULTI );
		$this->assertEquals( self::GETTY_SHORTCODE_MULTI, $shortcode );
	}

	public function test_getty_reverse_alphanumeric_daashed_id_shortcode() {
		$shortcode = wpcom_shortcodereverse_getty( self::GETTY_EMBED_ALPHANUMERIC_DASHED_ID );
		$this->assertEquals( self::GETTY_SHORTCODE_ALPHANUMERIC_DASHED_ID, $shortcode );
	}

	public function test_getty_reverse_shortcode_works_on_escaped_html() {
		$shortcode = wpcom_shortcodereverse_getty( self::GETTY_ESCAPED_EMBED );
		$this->assertEquals( self::GETTY_SHORTCODE, $shortcode );
	}

	public function test_getty_reverse_shortcode_works_on_old_embed() {
		$shortcode = wpcom_shortcodereverse_getty( self::GETTY_OLD_EMBED );
		$this->assertEquals( self::GETTY_SHORTCODE, $shortcode );
	}

	public function test_getty_reverse_shortcode_2017() {
		$shortcode = wpcom_shortcodereverse_getty( self::GETTY_EMBED_2017 );
		$this->assertEquals( self::GETTY_SHORTCODE_TLD, $shortcode );
	}

	public function test_getty_reverse_shortcode_2017_works_on_escaped_html() {
		$shortcode = wpcom_shortcodereverse_getty( self::GETTY_ESCAPED_EMBED_2017 );
		$this->assertEquals( self::GETTY_SHORTCODE_TLD, $shortcode );
	}

	public function test_getty_reverse_shortcode_doesnt_remove_too_much() {
		$before    = '<div class="something else">test<div class=\'something\'>another div';
		$after     = 'blah</div></div>';
		$shortcode = wpcom_shortcodereverse_getty( $before . self::GETTY_EMBED . $after );
		$expected  = $before . self::GETTY_SHORTCODE . $after;
		$this->assertEquals( $expected, $shortcode );
	}

	public function test_getty_add_oembed_endpoint_caller_non_getty() {
		$provider_url = apply_filters(
			'oembed_fetch_url',
			'https://www.youtube.com/oembed?maxwidth=471&maxheight=594&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ',
			'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			''
		);

		$this->assertEquals(
			'https://www.youtube.com/oembed?maxwidth=471&maxheight=594&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ',
			$provider_url
		);
	}

	/**
	 * Verify that rendering the shortcode returns a Getty image.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_getty_image() {
		$image_id = '82278805';
		$content  = "[getty src='$image_id']";

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $image_id, $shortcode_content );
	}

	/**
	 * Uses a real HTTP request to Getty's oEmbed endpoint to
	 * verify that rendering the shortcode returns a Getty image.
	 *
	 * @group external-http
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_getty_image_via_oembed_http_request() {
		$image_id = '82278805';
		$content  = "[getty src='$image_id']";

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $image_id, $shortcode_content );
	}
}

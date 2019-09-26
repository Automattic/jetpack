<?php

require_once dirname( dirname( dirname( dirname( __DIR__ ) ) ) ) . '/modules/carousel.php';

class Test_Jetpack_Carousel extends WP_UnitTestCase {
	static $post_id = 0;
	static $charset = '';

	var $carousel;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_id = self::factory()->post->create();
		self::$charset = get_option( 'blog_charset', 'utf-8' );
	}

	public static function wpTearDownAfterClass() {
		update_option( 'blog_charset', self::$charset );
	}

	public function setUp() {
		$GLOBALS['post'] = get_post( self::$post_id );

		$this->carousel = $this->getMockBuilder( 'Jetpack_Carousel' )
			->setMethods( null )
			->disableOriginalConstructor()
			->getMock();
	}

	public function test_add_data_to_container() {
		$extra = 'data-carousel-extra=\'{"blog_id":1,"permalink":"http:\\/\\/example.org\\/?p=' . self::$post_id . '"}\'';

		$this->assertEquals( '<div class="gallery" ' . $extra . '>', $this->carousel->add_data_to_container(  '<div class="gallery">' ) );
	}

	public function utf_8_provider() {
		// Data Providers are called prior to `::setUpBeforeClass()`, so we can't know `self::$post_id` here.
		$extra = 'data-carousel-extra=\'{"blog_id":1,"permalink":"http:\\/\\/example.org\\/?p=%%%POST_ID%%%"}\'';

		return [
			'ascii'                 => [ '<div class="gallery">hello</div>', '<div class="gallery" ' . $extra . '>hello</div>' ],
			'latin with diacritics' => [ '<div class="gallery">Ĵëṫṕãḉǩ</div>', '<div class="gallery" ' . $extra . '>Ĵëṫṕãḉǩ</div>' ],
			'encoded'               => [ '<div class="gallery">&#308;&euml;&#7787;&#7765;&atilde;&#7689;&#489;</div>', '<div class="gallery" ' . $extra . '>&#308;&euml;&#7787;&#7765;&atilde;&#7689;&#489;</div>' ],
			'japanese'              => [ '<div class="gallery">最高のパック</div>', '<div class="gallery" ' . $extra . '>最高のパック</div>' ],
			'linear b (4-byte)'     => [ '<div class="gallery">𐁂𐀐𐀷</div>', '<div class="gallery" ' . $extra . '>𐁂𐀐𐀷</div>' ],
			'emoji (4-byte)'        => [ '<div class="gallery">✈️🎒</div>', '<div class="gallery" ' . $extra . '>✈️🎒</div>' ],
		];
	}

	/**
	 * @dataProvider utf_8_provider
	 */
	public function test_add_data_to_html_with_utf_8_input( $input, $expected ) {
		$expected = str_replace( '%%%POST_ID%%%', self::$post_id, $expected );

		update_option( 'blog_charset', 'utf-8' );

		$this->assertEquals( $expected, $this->carousel->add_data_to_html( $input ) );
	}

	public function big_5_provider() {
		// Data Providers are called prior to `::setUpBeforeClass()`, so we can't know `self::$post_id` here.
		$extra = 'data-carousel-extra=\'{"blog_id":1,"permalink":"http:\\/\\/example.org\\/?p=%%%POST_ID%%%"}\'';

		return [
			'ascii'                 => [ '<div class="gallery">hello</div>', '<div class="gallery" ' . $extra . '>hello</div>' ],
			'common characters'     => [ "<div class=\"gallery\">\xB1\x60\xA5\xCE\xA6\x72</div>", "<div class=\"gallery\" $extra>\xB1\x60\xA5\xCE\xA6\x72</div>" ],
			'graphical characters'  => [ "<div class=\"gallery\">\xA1\x4B\xA1\x4B</div>", "<div class=\"gallery\" $extra>\xA1\x4B\xA1\x4B</div>" ],
		];
	}

	/**
	 * @dataProvider big_5_provider
	 */
	public function test_add_data_to_html_with_big_5_input( $input, $expected ) {
		$expected = str_replace( '%%%POST_ID%%%', self::$post_id, $expected );

		update_option( 'blog_charset', 'big-5' );

		$this->assertEquals( $expected, $this->carousel->add_data_to_html( $input ) );
	}
}

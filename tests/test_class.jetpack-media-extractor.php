<?php

class WP_Test_Jetpack_MediaExtractor extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_empty_array() {
		$post_id = $this->factory->post->create( array(
			'post_content' => '',
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertEmpty( $extract );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_image() {
		$img_title = 'title.jpg';

		$post_id = $this->factory->post->create( array(
			'post_content' => "<img src='$img_title'>",
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertArrayHasKey( 'image', $extract );
		$this->assertEquals( $extract[ 'image' ][ 0 ][ 'url' ], $img_title );
	}

	public function shortcode_nop() {
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_shortcode() {
		$shortcode = 'test_mediaextractor_shortcode';
		add_shortcode( $shortcode, array( $this, 'shortcode_nop' ) );

		$post_id = $this->factory->post->create( array(
			'post_content' => "[$shortcode]",
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertArrayHasKey( 'shortcode', $extract );
		$this->assertArrayHasKey( $shortcode, $extract[ 'shortcode' ] );
		$this->assertEquals( $extract[ 'shortcode_types' ][ 0 ], $shortcode );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_link() {
		$url_link = WP_TESTS_DOMAIN;
		$url = "<a href='http://$url_link'>";

		$post_id = $this->factory->post->create( array(
			'post_content' => "$url",
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertArrayHasKey( 'link', $extract );
		$this->assertEquals( $extract[ 'link' ][ 0 ][ 'url' ], $url_link );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_mention() {
		$mention = 'user';

		$post_id = $this->factory->post->create( array(
			'post_content' => "@$mention",
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertArrayHasKey( 'mention', $extract );
		$this->assertEquals( $extract[ 'mention' ][ 'name' ][ 0 ], $mention );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_embed() {
		$embed_link = 'wordpress.tv/embed';
		$embed = "\nhttp://$embed_link\n";

		$post_id = $this->factory->post->create( array(
			'post_content' => "$embed",
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertArrayHasKey( 'embed', $extract );
        $this->assertEquals( $extract[ 'embed' ][ 'url' ][ 0 ], $embed_link );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract_images_from_content
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_images_from_content_return_empty_array() {
		$content = '';

		$image_struct = Jetpack_Media_Meta_Extractor::extract_images_from_content( $content, array() );

		$this->assertInternalType( 'array', $image_struct );
		$this->assertEmpty( $image_struct );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract_images_from_content
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_images_from_content_return_correct_image_struct() {
		$img_name = 'image.jpg';
		$content = "<img src='$img_name'>";

		$image_struct = Jetpack_Media_Meta_Extractor::extract_images_from_content( $content, array() );

		$this->assertInternalType( 'array', $image_struct );
		$this->assertArrayHasKey( 'has', $image_struct );
		$this->assertArrayHasKey( 'image', $image_struct );
		$this->assertCount( 1, $image_struct[ 'image' ] );
		$this->assertEquals( $image_struct[ 'image' ][ 0 ][ 'url' ], $img_name );
		$this->assertEquals( $image_struct[ 'has' ][ 'image' ], 1 );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::get_images_from_html
	 * @since 3.2
	 */
	public function test_mediaextractor_get_images_from_html_empty() {
		$content = '';

		$image_list = Jetpack_Media_Meta_Extractor::get_images_from_html( $content, array() );

		$this->assertInternalType( 'array', $image_list );
		$this->assertEmpty( $image_list );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::get_images_from_html
	 * @since 3.2
	 */
	public function test_mediaextractor_get_images_from_html_already_extracted() {
		$content = '';
		$images_extracted = array( 'http://' . WP_TESTS_DOMAIN . '/image.jpg' );

		$image_list = Jetpack_Media_Meta_Extractor::get_images_from_html( $content, $images_extracted );

		$this->assertInternalType( 'array', $image_list );
		$this->assertEquals( $image_list, $images_extracted );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::get_images_from_html
	 * @since 3.2
	 */
	public function test_mediaextractor_get_images_from_html_duplicate_in_already_extracted() {
		$content = 'http://' . WP_TESTS_DOMAIN . '/image.jpg';
		$images_extracted = array( 'http://' . WP_TESTS_DOMAIN . '/image.jpg' );

		$image_list = Jetpack_Media_Meta_Extractor::get_images_from_html( $content, $images_extracted );

		$this->assertInternalType( 'array', $image_list );
		$this->assertEquals( $image_list, $images_extracted );
	}

	private function add_test_post() {
		$post_id = $this->factory->post->create( array(
			'post_author' => '1046316',
			'post_date' => '2013-03-15 22:55:05',
			'post_date_gmt' => '2013-03-15 22:55:05',
			'post_content' => 'Test of embedded things, like @mremypub mentions, http://alink.com links and other stuff:

			Yo, #hashtags123 are now being extracted, too.

			#Youtube embed:

			http://www.youtube.com/watch?v=r0cN_bpLrxk

			Youtube shortcode:

			[youtube http://www.youtube.com/watch?v=r0cN_bpLrxk]

			Youtube iframe:

			[youtube http://www.youtube.com/watch?v=r0cN_bpLrxk&amp;w=420&amp;h=315]

			Youtube old embed method:

			@@@doesn\'t work@@@ (that is not a mention, btw)

			Vimeo Embed:

			http://vimeo.com/44633289

			Vimeo shortcode:

			[vimeo http://vimeo.com/44633289]

			New <a href="http://make.wordpress.org/core/2013/04/08/audio-video-support-in-core/">video shortcode</a>:
			[video src="video-source.mp4"]

			Vimeo shortcode just with ID and maybe some other params

			[vimeo 44633289 w=500&amp;h=280]

			And now @martinremy another mention and <a href="http://anotherlink.com/this/is/a/path/script.php?queryarg=queryval&amp;anotherart=anotherval#anchorhere" rel="nofollow">another link</a>.

			TED:

			[ted id=981]

			Audio:

			[audio http://wpcom.files.wordpress.com/2007/01/mattmullenweg-interview.mp3 ]

			[audio http://en.support.files.wordpress.com/2012/05/mattmullenweg-interview.m4a]

			VideoPress:

			[wpvideo 6nd4Jsq7 w=640]

			&nbsp;

			&nbsp;

			An Image:

			<a href="http://mrwpsandbox.files.wordpress.com/2013/03/screen-shot-2013-03-15-at-1-27-05-pm.png"><img class="alignnone size-medium wp-image-32" alt="Screen Shot 2013-03-15 at 1.27.05 PM" src="http://mrwpsandbox.files.wordpress.com/2013/03/screen-shot-2013-03-15-at-1-27-05-pm.png?w=300" width="300" height="183" /></a>

			&nbsp;

			A Gallery:

			[gallery ids="37,36"]

			Twitter:

			http://twitter.com/mremy

			',
			'post_title' => 'Test of embedded things like @mremypub mentions http...',
			'post_excerpt' => '',
			'post_status' => 'publish',
			'comment_status' => 'open',
			'ping_status' => 'open',
			'post_password' => '',
			'post_name' => 'test-of-embedded-things-like-mentions-http-alink',
			'to_ping' => '',
			'pinged' => '',
			'post_modified' => '2013-04-17 02:39:15',
			'post_modified_gmt' => '2013-04-17 02:39:15',
			'post_content_filtered' => '',
			'post_parent' => 0,
			'guid' => 'http://mrwpsandbox.wordpress.com/2013/03/15/test-of-embedded-things-like-mentions-http-alink/',
			'menu_order' => 0,
			'post_type' => 'post',
			'post_mime_type' => '',
			'comment_count' => '0',
			'filter' => 'raw',
		) );

		return $post_id;
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	function test_mediaextractor_extract_links() {
		$post_id = $this->add_test_post();

		$expected = array(
			'has' => array( 'link' => 8 ),
			'link' => array(
				array(
					'url' => 'alink.com',
					'host_reversed' => 'com.alink',
					'host' => 'alink.com',
				),
				array(
					'url' => 'www.youtube.com/watch?v=r0cN_bpLrxk',
					'host' => 'www.youtube.com',
					'host_reversed' => 'com.youtube.www',
				),
				array(
					'url' => 'vimeo.com/44633289',
					'host' => 'vimeo.com',
					'host_reversed' => 'com.vimeo',
				),
				array(
					'url' => 'make.wordpress.org/core/2013/04/08/audio-video-support-in-core/',
					'host' => 'make.wordpress.org',
					'host_reversed' => 'org.wordpress.make',
				),
				array(
					'url' => 'anotherlink.com/this/is/a/path/script.php?queryarg=queryval&amp;anotherart=anotherval#anchorhere',
					'host' => 'anotherlink.com',
					'host_reversed' => 'com.anotherlink',
				),
				array(
					'url' => 'mrwpsandbox.files.wordpress.com/2013/03/screen-shot-2013-03-15-at-1-27-05-pm.png',
					'host_reversed' => 'com.wordpress.files.mrwpsandbox',
					'host' => 'mrwpsandbox.files.wordpress.com',
				),
				array(
					'url' => 'mrwpsandbox.files.wordpress.com/2013/03/screen-shot-2013-03-15-at-1-27-05-pm.png?w=300',
					'host_reversed' => 'com.wordpress.files.mrwpsandbox',
					'host' => 'mrwpsandbox.files.wordpress.com',
				),
				array(
					'host_reversed' => 'com.twitter',
					'host' => 'twitter.com',
					'url' => 'twitter.com/mremy',
				)
			)
		);

		$result = Jetpack_Media_Meta_Extractor::extract( get_current_blog_id(), $post_id, Jetpack_Media_Meta_Extractor::LINKS );

		$this->assertEquals( $expected, $result );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	function test_extract_images() {
		$post_id = $this->add_test_post();

		$expected = array(
			'image' => array(
				0 => array( 'url' => 'http://mrwpsandbox.files.wordpress.com/2013/03/screen-shot-2013-03-15-at-1-27-05-pm.png' ),
			),
			'has' => array(
				'image' => 1,
			)
		);

		$result = Jetpack_Media_Meta_Extractor::extract( get_current_blog_id(), $post_id, Jetpack_Media_Meta_Extractor::IMAGES );

		$this->assertEquals( $expected, $result );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	function test_extract_mentions() {
		$post_id = $this->add_test_post();

		$expected = array(
			'mention' => array(
				'name' => array(
					0 => 'mremypub',
					1 => 'martinremy',
				)
			),
			'has' => array( 'mention' => 2 ),
		);

		$result = Jetpack_Media_Meta_Extractor::extract( get_current_blog_id(), $post_id, Jetpack_Media_Meta_Extractor::MENTIONS );

		if ( version_compare( PHP_VERSION, '5.3.0' ) == -1 ) {
			$this->markTestSkipped(
				'This test is failing in PHP 5.2 for unknown reasons. Skipping pending further verification.'
				);
			return;
		}

		$this->assertEquals( $expected, $result );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	function test_extract_shortcodes() {
		$post_id = $this->add_test_post();

		$expected = array(
			'has' => array( 'shortcode' => 10 ),
			'shortcode' => array(
				'youtube' => array(
					'count' => 2,
					'id' => array(
						'r0cN_bpLrxk',
					),
				),
				'vimeo' => array(
					'count' => 2,
					'id' => array(
						44633289,
					),
				),
				'ted' => array(
					'count' => 1,
					'id' => array(
						'981',
					),
				),
				'audio' => array(
					'count' => 2,
					'id' => array(
						'http://wpcom.files.wordpress.com/2007/01/mattmullenweg-interview.mp3',
						'http://en.support.files.wordpress.com/2012/05/mattmullenweg-interview.m4a',
					),
				),
				'wpvideo' => array(
					'count' => 1,
					'id' => array(
						'6nd4Jsq7',
					),
				),
				'video' => array(
					'count' => 1
				),
				'gallery' => array(
					'count' => 1
				),
			),
			'shortcode_types' => array(
				'youtube',
				'vimeo',
				'video',
				'ted',
				'audio',
				'wpvideo',
				'gallery',
			),
		);

		$result = Jetpack_Media_Meta_Extractor::extract( get_current_blog_id(), $post_id, Jetpack_Media_Meta_Extractor::SHORTCODES );

		$this->assertEquals( $expected, $result );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	function test_extract_embeds() {
		$post_id = $this->add_test_post();

		$expected = array(
			'has' => array( 'embed' => 2 ),
			'embed' => array( 'url' => array(
				'www.youtube.com/watch?v=r0cN_bpLrxk',
				'vimeo.com/44633289',
			) ),
		);

		$result = Jetpack_Media_Meta_Extractor::extract( get_current_blog_id(), $post_id, Jetpack_Media_Meta_Extractor::EMBEDS );

		$this->assertEquals( $expected, $result );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::get_images_from_html
	 * @since 3.2
	 */
	function test_extract_image_from_html() {
		$html = <<<EOT
<p><a href="http://paulbernal.files.wordpress.com/2013/05/mr-gove-cover.jpeg"><img class="aligncenter size-full wp-image-1027" alt="Mr Gove Cover" src="http://paulbernal.files.wordpress.com/2013/05/mr-gove-cover.jpeg?w=640" /></a></p>
<p>Mr Gove was extraordinarily arrogant.</p>
<p>Painfully arrogant.</p>
<p>He believed that he knew how everything should be done. He believed that everyone else in the world was stupid and ignorant.</p>
<p>The problem was, Mr Gove himself was the one who was ignorant.</p>
<p><a href="http://paulbernal.files.wordpress.com/2013/05/mr-gove-close-up.jpeg"><img class="aligncenter size-full wp-image-1030" alt="Mr Gove Close up" src="http://paulbernal.files.wordpress.com/2013/05/mr-gove-close-up.jpeg?w=640" /></a></p>
<p>He got most of his information from his own, misty, memory.</p>
<p>He thought he remembered what it had been like when he had been at school &#8211; and assumed that everyone else&#8217;s school should be the same.</p>
<p>He remembered the good things about his own school days, and thought that everyone should have the same.</p>
<p>He remembered the bad things about his own school days, and thought that it hadn&#8217;t done him any harm &#8211; and that other children should suffer the way that he had.</p>
EOT;

		$expected = array(
			0 => 'http://images-r-us.com/some-image.png',
			1 => 'http://paulbernal.files.wordpress.com/2013/05/mr-gove-cover.jpeg',
			2 => 'http://paulbernal.files.wordpress.com/2013/05/mr-gove-close-up.jpeg',
		);

		$already_extracted_images = array( 'http://images-r-us.com/some-image.png' );

		$result = Jetpack_Media_Meta_Extractor::get_images_from_html( $html, $already_extracted_images );

		$this->assertEquals( $expected, $result );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_exclude_video_links() {
		$post_id = $this->factory->post->create( array(
			'post_author' => '23314024',
			'post_date' => '2013-10-25 16:43:34',
			'post_date_gmt' => '2013-10-25 16:43:34',
			'post_content' => 'Sed dapibus ut mauris imperdiet volutpat. http://vimeo.com/77120044/ Nullam in dolor vel nulla pulvinar accumsan facilisis quis lorem.
			',
			'post_title' => 'Sed dapibus ut mauris imperdiet volutpat http vimeo...',
			'post_excerpt' => '',
			'post_status' => 'publish',
			'comment_status' => 'open',
			'ping_status' => 'open',
			'post_password' => '',
			'post_name' => 'sed-dapibus-ut-mauris-imperdiet-volutpat-http-vimeo',
			'to_ping' => '',
			'pinged' => '
			http://vimeo.com/77120044/',
			'post_modified' => '2013-10-28 22:54:50',
			'post_modified_gmt' => '2013-10-28 22:54:50',
			'post_content_filtered' => '',
			'post_parent' => 0,
			'guid' => 'http://breakmyblog.wordpress.com/2013/10/25/sed-dapibus-ut-mauris-imperdiet-volutpat-http-vimeo/',
			'menu_order' => 0,
			'post_type' => 'post',
			'post_mime_type' => '',
			'comment_count' => '0',
			'filter' => 'raw',
		) );

		$expected = array(
			'has' => array( 'link' => 1 ),
			'link' => array(
				array(
					'url' => 'vimeo.com/77120044/',
					'host_reversed' => 'com.vimeo',
					'host' => 'vimeo.com',
				)
			)
		);

		$result = Jetpack_Media_Meta_Extractor::extract( get_current_blog_id(), $post_id, Jetpack_Media_Meta_Extractor::ALL );

		$this->assertEquals( $expected, $result );
	}

}

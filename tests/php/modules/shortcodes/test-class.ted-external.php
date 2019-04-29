<?php

/**
 * @group external-http
 * @covers ::shortcode_ted
 */
class WP_Test_Jetpack_Shortcodes_Ted_External extends WP_UnitTestCase {
	public function setUp() {
		add_filter( 'tests_allow_http_request', '__return_true' );
	}

	/**
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @since 3.2
	 */
	public function test_shortcodes_ted_id() {
		$ted_id = '1969';
		$content = '[ted id=' . $ted_id . ']';

		$post_id = $this->factory->post->create( array(
			'post-content' => $content
		) );

		$GLOBALS[ 'post' ] = get_post( $post_id );

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'ted.com/talks/louie_schwartzberg_hidden_miracles_of_the_natural_world', $shortcode_content );

		unset( $GLOBALS[ 'post' ] );
	}

	/**
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @since 3.2
	 */
	public function test_shortcodes_ted_width_height() {
		$ted_id = '1969';
		$width = '560';
		$height = '315';
		$content = '[ted id=' . $ted_id . ' width=' . $width . ' height=' . $height . ']';

		$post_id = $this->factory->post->create( array(
			'post-content' => $content
		) );
		$GLOBALS[ 'post' ] = get_post( $post_id );

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( 'width="' . $width . '"', $shortcode_content );
		$this->assertContains( 'height="' . $height . '"', $shortcode_content );

		unset( $GLOBALS[ 'post' ] );
	}

	/**
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @since 3.2
	 */
	public function test_shortcodes_ted_lang() {
		$ted_id = '1969';
		$lang = 'fr';
		$content = '[ted id=' . $ted_id . ' lang=' . $lang . ']';

		$post_id = $this->factory->post->create( array(
			'post-content' => $content
		) );
		$GLOBALS[ 'post' ] = get_post( $post_id );

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( '/lang/' . $lang . '/', $shortcode_content );

		unset( $GLOBALS[ 'post' ] );
	}
}

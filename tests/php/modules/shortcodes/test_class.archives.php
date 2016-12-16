<?php

class WP_Test_Jetpack_Shortcodes_Archives extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_exists() {
		$this->assertEquals( shortcode_exists( 'archives' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives() {
		$content = '[archives]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_type_default() {
		$archives = archives_shortcode( array() );

		$this->assertEquals( $archives, '<p>' . __( 'Your blog does not currently have any published posts.' , 'jetpack' ) . '</p>' );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_format_option() {
		$this->factory->post->create( array() );
		$attr = array(
			'format' => 'option'
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( substr( $archives, 0, 7 ), '<select' );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_format_html() {
		$this->factory->post->create( array() );
		$attr = array(
			'format' => 'html'
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( substr( $archives, 0, 3 ), '<ul' );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_type_yearly() {
		$this->factory->post->create( array(
			'post_date' => '2014-01-01 01:00:00'
		) );
		$attr = array(
			'type' => 'yearly'
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( ! false, strpos( $archives, 'm=2014' ) );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_type_monthly() {
		$this->factory->post->create( array(
			'post_date' => '2014-01-01 01:00:00'
		) );
		$attr = array(
			'type' => 'monthly'
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( ! false, strpos( $archives, 'm=201401' ) );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_type_weekly() {
		$this->factory->post->create( array(
			'post_date' => '2014-01-01 01:00:00'
		) );
		$attr = array(
			'type' => 'weekly'
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( ! false, strpos( $archives, 'w=1' ) );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_type_daily() {
		$this->factory->post->create( array(
			'post_date' => '2014-01-01 01:00:00'
		) );
		$attr = array(
			'type' => 'daily'
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( ! false, strpos( $archives, 'm=20140101' ) );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_limit_one() {
		$this->factory->post->create( array() );
		$this->factory->post->create( array() );
		$attr = array(
			'format' => 'html',
			'limit' => '1'
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( 1, substr_count( $archives, '<li>' ) );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_limit_zero_is_all() {
		$this->factory->post->create( array() );
		$this->factory->post->create( array() );
		$attr = array(
			'format' => 'html',
			'limit' => '0'
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( 2, substr_count( $archives, '<li>' ) );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_showcount() {
		$this->factory->post->create( array(
			'post_date' => '2014-01-01 01:00:00'
		) );
		$this->factory->post->create( array(
			'post_date' => '2014-01-01 01:00:00'
		) );
		$attr = array(
			'showcount' => 'true',
			'type' => 'yearly'
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( ! false, strpos( $archives, '(2)' ) );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_before() {
		$content = 'test_string';

		$this->factory->post->create( array() );
		$attr = array(
			'format' => 'html',
			'before' => $content
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( ! false, strpos( $archives, $content ) );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_after() {
		$content = 'test_string';

		$this->factory->post->create( array() );
		$attr = array(
			'format' => 'html',
			'after' => $content
		);

		$archives = archives_shortcode( $attr );

		$this->assertEquals( ! false, strpos( $archives, $content ) );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_order_asc() {
		$this->factory->post->create( array(
			'post_title' => 'first',
			'post_date' => '2014-01-01 01:00:00'
		) );
		$this->factory->post->create( array(
			'post_title' => 'last',
			'post_date' => '2014-01-01 02:00:00'
		) );
		$attr = array(
			'order' => 'asc'
		);

		$archives = archives_shortcode( $attr );

		$this->assertGreaterThan( strpos( $archives, 'first' ), strpos( $archives, 'last' ) );
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_order_desc() {
		$this->factory->post->create( array(
			'post_title' => 'first',
			'post_date' => '2014-01-01 01:00:00'
		) );
		$this->factory->post->create( array(
			'post_title' => 'last',
			'post_date' => '2014-01-01 02:00:00'
		) );
		$attr = array(
			'order' => 'desc'
		);

		$archives = archives_shortcode( $attr );

		$this->assertLessThan( strpos( $archives, 'first' ), strpos( $archives, 'last' ) );
	}

}

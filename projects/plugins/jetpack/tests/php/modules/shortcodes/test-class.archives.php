<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Archives extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

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

		$this->assertEquals( $archives, '<p>' . __( 'Your blog does not currently have any published posts.', 'jetpack' ) . '</p>' );
	}

	/**
	 * Gets the test data for test_shortcodes_archives_format_option().
	 *
	 * @since 8.5.0
	 *
	 * @return array The test data.
	 */
	public function get_data_archives_format_option() {
		return array(
			'non_amp' => array(
				false,
				'<select name="archive-dropdown" onchange="document.location.href=this.options[this.selectedIndex].value;"><option value="">--</option>	<option value=\'{{permalink}}\'> {{title}} </option>' . "\n" . '</select>',
			),
			'amp'     => array(
				true,
				'<select name="archive-dropdown" on="change:AMP.navigateTo(url=event.value)"><option value="">--</option>	<option value=\'{{permalink}}\'> {{title}} </option>' . "\n" . '</select>',
			),
		);
	}

	/**
	 * Test [archives format="option"].
	 *
	 * @dataProvider get_data_archives_format_option
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 *
	 * @param bool   $is_amp Whether this is an AMP endpoint.
	 * @param string $expected The expected return value of the shortcode callback.
	 */
	public function test_shortcodes_archives_format_option( $is_amp, $expected ) {
		if ( $is_amp && defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com is in the process of removing AMP plugin.' );
			return;
		}

		if ( $is_amp ) {
			add_filter( 'jetpack_is_amp_request', '__return_true' );
		}

		$post     = $this->factory->post->create_and_get();
		$expected = str_replace(
			array( '{{permalink}}', '{{title}}' ),
			array( get_permalink( $post ), $post->post_title ),
			$expected
		);

		$this->assertEquals(
			$expected,
			archives_shortcode( array( 'format' => 'option' ) )
		);
	}

	/**
	 * @author scotchfield
	 * @covers ::archives_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_archives_format_html() {
		$this->factory->post->create( array() );
		$attr = array(
			'format' => 'html',
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
		$this->factory->post->create(
			array(
				'post_date' => '2014-01-01 01:00:00',
			)
		);
		$attr = array(
			'type' => 'yearly',
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
		$this->factory->post->create(
			array(
				'post_date' => '2014-01-01 01:00:00',
			)
		);
		$attr = array(
			'type' => 'monthly',
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
		$this->factory->post->create(
			array(
				'post_date' => '2014-01-01 01:00:00',
			)
		);
		$attr = array(
			'type' => 'weekly',
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
		$this->factory->post->create(
			array(
				'post_date' => '2014-01-01 01:00:00',
			)
		);
		$attr = array(
			'type' => 'daily',
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
			'limit'  => '1',
		);

		$archives = archives_shortcode( $attr );

		$this->assertSame( 1, substr_count( $archives, '<li>' ) );
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
			'limit'  => '0',
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
		$this->factory->post->create(
			array(
				'post_date' => '2014-01-01 01:00:00',
			)
		);
		$this->factory->post->create(
			array(
				'post_date' => '2014-01-01 01:00:00',
			)
		);
		$attr = array(
			'showcount' => 'true',
			'type'      => 'yearly',
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
			'before' => $content,
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
			'after'  => $content,
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
		$this->factory->post->create(
			array(
				'post_title' => 'first',
				'post_date'  => '2014-01-01 01:00:00',
			)
		);
		$this->factory->post->create(
			array(
				'post_title' => 'last',
				'post_date'  => '2014-01-01 02:00:00',
			)
		);
		$attr = array(
			'order' => 'asc',
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
		$this->factory->post->create(
			array(
				'post_title' => 'first',
				'post_date'  => '2014-01-01 01:00:00',
			)
		);
		$this->factory->post->create(
			array(
				'post_title' => 'last',
				'post_date'  => '2014-01-01 02:00:00',
			)
		);
		$attr = array(
			'order' => 'desc',
		);

		$archives = archives_shortcode( $attr );

		$this->assertLessThan( strpos( $archives, 'first' ), strpos( $archives, 'last' ) );
	}

}

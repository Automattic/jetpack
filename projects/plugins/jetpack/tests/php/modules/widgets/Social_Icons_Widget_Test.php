<?php

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'modules/widgets/social-icons.php';

/**
 * Test class for the Social Icons Widget.
 *
 * @covers Jetpack_Widget_Social_Icons
 */
#[CoversClass( Jetpack_Widget_Social_Icons::class )]
class Social_Icons_Widget_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private $social_icon_widget;

	/**
	 * This method is called before each test.
	 */
	public function set_up() {
		parent::set_up();
		$this->social_icon_widget = new Jetpack_Widget_Social_Icons();
	}

	/**
	 * Verifies that the target and url attributes in the icon urls are correct when the new tab setting
	 * is enabled.
	 */
	public function test_widget_icon_urls_new_tab() {
		$args = array(
			'before_widget' => null,
			'after_widget'  => null,
			'before_title'  => null,
			'after_title'   => null,
		);

		$instance = array(
			'icons'   => array(
				'test_icon_1' => array(
					'url' => 'https://www.example.com',
				),
			),
			'new-tab' => true,
		);

		ob_start();
		$this->social_icon_widget->widget( $args, $instance );
		$output_string = ob_get_clean();

		$this->assertStringContainsString( 'target="_blank"', $output_string, 'The expected attribute target="_blank" is missing.' );
		$this->assertStringContainsString( 'rel="noopener noreferrer"', $output_string, 'The expected attribute rel="noopener noreferrer" is missing.' );
	}

	/**
	 * Verifies that the target and url attributes in the icon urls are correct when the new tab setting
	 * is disabled.
	 */
	public function test_widget_icon_urls_same_tab() {
		$args = array(
			'before_widget' => null,
			'after_widget'  => null,
			'before_title'  => null,
			'after_title'   => null,
		);

		$instance = array(
			'icons'   => array(
				'test_icon_1' => array(
					'url' => 'https://www.example.com',
				),
			),
			'new-tab' => false,
		);

		ob_start();
		$this->social_icon_widget->widget( $args, $instance );
		$output_string = ob_get_clean();

		$this->assertStringContainsString( 'target="_self"', $output_string, 'The expected attribute target="_self" is missing.' );
		$this->assertStringNotContainsString( 'rel="noopener noreferrer"', $output_string, 'The attribute rel="noopener noreferrer should not be present.' );
	}

	/**
	 * Verifies that WordPress.com and WordPress.org site and profile URLs display the WordPress icon.
	 */
	public function test_widget_wordpress_site_icon() {
		$args = array(
			'before_widget' => null,
			'after_widget'  => null,
			'before_title'  => null,
			'after_title'   => null,
		);

		$instance = array(
			'icons'   => array(
				'test_icon_1' => array(
					'url' => 'https://wordpress.com',
				),
				'test_icon_2' => array(
					'url' => 'https://profiles.wordpress.org/username',
				),
				'test_icon_3' => array(
					'url' => 'https://myblog.wordpress.com',
				),
			),
			'new-tab' => false,
		);

		ob_start();
		$this->social_icon_widget->widget( $args, $instance );
		$output_string = ob_get_clean();

		$this->assertEquals( 3, substr_count( $output_string, '<span class="screen-reader-text">WordPress</span>' ) );
	}

	/**
	 * Verifies that WordPress.com and WordPress.org feed URLs display the RSS Feed icon instead of the WordPress icon.
	 */
	public function test_widget_wordpress_feed_icon() {
		$args = array(
			'before_widget' => null,
			'after_widget'  => null,
			'before_title'  => null,
			'after_title'   => null,
		);

		$instance = array(
			'icons'   => array(
				'test_icon_1' => array(
					'url' => 'https://mmxtest.wordpress.com/feed/',
				),
				'test_icon_2' => array(
					'url' => 'https://mmxtest.wordpress.com/feed',
				),
				'test_icon_3' => array(
					'url' => 'https://mmxtest.wordpress.com/?feed=rss2',
				),
				'test_icon_4' => array(
					'url' => 'https://wordpress.org/news/feed/',
				),
			),
			'new-tab' => false,
		);

		ob_start();
		$this->social_icon_widget->widget( $args, $instance );
		$output_string = ob_get_clean();

		$this->assertEquals( 4, substr_count( $output_string, '<span class="screen-reader-text">RSS Feed</span>' ) );
		$this->assertStringNotContainsString( '<span class="screen-reader-text">WordPress</span>', $output_string );
	}
}

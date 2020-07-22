<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase

require_jetpack_file( 'modules/widgets/social-icons.php' );

/**
 * Test class for the Social Icons Widget.
 *
 * @covers Jetpack_Widget_Social_Icons
 */
class WP_Test_Social_Icons_Widget extends WP_UnitTestCase {

	/**
	 * This method is called before each test.
	 */
	public function setUp() {
		parent::setUp();
		$this->social_icon_widget = new Jetpack_Widget_Social_Icons();
	}

	/**
	 * Verifies that the target and url attributes in the icon urls are correct when the new tab setting
	 * is enabled.
	 *
	 * @covers Jetpack_Widget_Social_Icons::widget
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

		$this->assertNotFalse( strpos( $output_string, 'target="_blank"' ), 'The expected attribute target="_blank" is missing.' );
		$this->assertNotFalse( strpos( $output_string, 'rel="noopener noreferrer"' ), 'The expected attribute rel="noopener noreferrer" is missing.' );
	}

	/**
	 * Verifies that the target and url attributes in the icon urls are correct when the new tab setting
	 * is disabled.
	 *
	 * @covers Jetpack_Widget_Social_Icons::widget
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

		$this->assertNotFalse( strpos( $output_string, 'target="_self"' ), 'The expected attribute target="_self" is missing.' );
		$this->assertFalse( strpos( $output_string, 'rel="noopener noreferrer"' ), 'The attribute rel="noopener noreferrer should not be present.' );
	}
}

<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase

require_once JETPACK__PLUGIN_DIR . 'modules/widgets/contact-info.php';

/**
 * Test class for the Contact Info & Map Widget.
 *
 * @covers Jetpack_Contact_Info_Widget
 */
class WP_Test_Contact_Info_Widget extends WP_UnitTestCase {

	const TEST_API_KEY = '12345abcde';

	/**
	 * This method is called before each test.
	 */
	public function set_up() {
		parent::set_up();
		remove_all_filters( 'jetpack_google_maps_api_key' );
		$this->contact_info_widget = new Jetpack_Contact_Info_Widget();
	}

	/**
	 * No filter callback is set. The API key field should be displayed.
	 *
	 * @covers Jetpack_Contact_Info_Widget::form
	 */
	public function test_form_apikey_field_with_no_filter() {
		ob_start();
		$this->contact_info_widget->form( null );
		$output_string = ob_get_clean();

		$apikey_field_displayed = false === strpos( $output_string, '<input type="hidden" id="widget-widget_contact_info' );
		$this->assertTrue( $apikey_field_displayed );
	}

	/**
	 * The filter callback returns the same api key as $instance['apikey'].
	 * The API key field should not be displayed.
	 */
	public function test_form_apikey_field_filter_with_instance_apikey() {
		$instance           = array();
		$instance['apikey'] = self::TEST_API_KEY;

		add_filter(
			'jetpack_google_maps_api_key',
			function () {
				return self::TEST_API_KEY;
			}
		);

		ob_start();
		$this->contact_info_widget->form( $instance );
		$output_string = ob_get_clean();

		$apikey_field_displayed = false === strpos( $output_string, '<input type="hidden" id="widget-widget_contact_info' );
		$this->assertFalse( $apikey_field_displayed );
	}

	/**
	 * The filter callback returns the input value. The API field should
	 * be displayed.
	 */
	public function test_form_apikey_field_with_pass_through_filter() {
		$instance           = array();
		$instance['apikey'] = self::TEST_API_KEY;

		add_filter(
			'jetpack_google_maps_api_key',
			function ( $value ) {
				return $value;
			}
		);

		ob_start();
		$this->contact_info_widget->form( $instance );
		$output_string = ob_get_clean();

		$apikey_field_displayed = false === strpos( $output_string, '<input type="hidden" id="widget-widget_contact_info' );
		$this->assertTrue( $apikey_field_displayed );
	}
}

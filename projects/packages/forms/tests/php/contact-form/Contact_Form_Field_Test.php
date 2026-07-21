<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Contact_Form.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for Contact_Form
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form
 */
#[CoversClass( Contact_Form::class )]
class Contact_Form_Field_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();

		// Mock global variables
		global $user_identity;

		$user_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'user_email' => 'admin@admin.com',
				'role'       => 'reader',
				'user_url'   => 'https://example.com',
			)
		);

		// Simulate a logged-in user
		wp_set_current_user( $user_id );
		$user_identity = 'Test User';
	}

	protected function tearDown(): void {
		parent::tearDown();
		global $current_user, $user_identity;

		// Clean up globals
		unset( $_POST, $_GET, $current_user, $user_identity );
	}

	/**
	 * Helper function to invoke the function from the class.
	 */
	private function invoke_get_computed_field_value( $field_type, $field_id ) {
		$field = $this->get_new_field_instance(
			array(
				'type' => $field_type,
				'id'   => $field_id,
			)
		);
		return $field->get_computed_field_value( $field_type, $field_id );
	}

	private function get_new_field_instance( $attributes ) {
		$defaults = array(
			'type'    => 'text',
			'id'      => 'id',
			'default' => 'default',
		);

		$form = new Contact_Form( array() );
		return new Contact_Form_Field( wp_parse_args( $attributes, $defaults ), '', $form );
	}

	/**
	 * Test handling $_POST single value
	 */
	public function test_handles_post_single_value() {
		$_POST['test_field'] = 'Post Value';

		$result = $this->invoke_get_computed_field_value( 'text', 'test_field' );

		$this->assertEquals( 'Post Value', $result );
	}

	/**
	 * Test handling $_POST array value
	 */
	public function test_handles_post_array_value() {
		$_POST['test_field'] = array( 'value1', 'value2' );

		$result = $this->invoke_get_computed_field_value( 'text', 'test_field' );

		$this->assertEquals( array( 'value1', 'value2' ), $result );
	}

	/**
	 * Test handling $_GET single value
	 */
	public function test_handles_get_single_value() {
		$_GET['test_field'] = 'Get Value';

		$result = $this->invoke_get_computed_field_value( 'text', 'test_field' );

		$this->assertEquals( 'Get Value', $result );
	}

	/**
	 * Test handling $_GET array value
	 */
	public function test_handles_get_array_value() {
		$_GET['test_field'] = array( 'value1', 'value2' );

		$result = $this->invoke_get_computed_field_value( 'text', 'test_field' );

		$this->assertEquals( array( 'value1', 'value2' ), $result );
	}

	/**
	 * Test logged-in user email return
	 */
	public function test_returns_logged_in_user_email() {
		add_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );
		$result = $this->invoke_get_computed_field_value( 'email', 'test_field' );
		remove_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );

		$this->assertEquals( 'admin@admin.com', $result );
	}

	/**
	 * Test logged-in user name return
	 */
	public function test_returns_logged_in_user_name() {
		add_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );
		$result = $this->invoke_get_computed_field_value( 'name', 'test_field' );
		remove_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );

		$this->assertEquals( 'Test User', $result );
	}

	/**
	 * Test logged-in user URL return
	 */
	public function test_returns_logged_in_user_url() {
		add_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );
		$result = $this->invoke_get_computed_field_value( 'url', 'test_field' );
		remove_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );

		$this->assertEquals( 'https://example.com', $result );
	}

	/**
	 * Test logged-in user URL return
	 */
	public function test_returns_logged_out_user_url() {
		global $current_user;
		unset( $current_user );
		wp_set_current_user( 0 );

		add_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );
		$result = $this->invoke_get_computed_field_value( 'url', 'test_field' );
		remove_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );

		$this->assertEquals( 'default', $result );
	}

	/**
	 * Test sanitization of field values.
	 */
	public function test_sanitizes_field_values() {
		$field = $this->get_new_field_instance(
			array(
				'type' => 'text',
				'id'   => 'test_field',
			)
		);

		$unsanitized_value = '<script>alert("XSS")</script>';
		$this->assertEquals( sanitize_text_field( html_entity_decode( $unsanitized_value, ENT_QUOTES ) ), $field->sanitize_text_field( $unsanitized_value ) );

		$unsanitized_value = 'hello&#044; world';
		$this->assertEquals( sanitize_text_field( html_entity_decode( $unsanitized_value, ENT_QUOTES ) ), $field->sanitize_text_field( $unsanitized_value ) );
	}

	/**
	 * Test consent field renders as hidden input when consent type is implicit.
	 */
	public function test_render_consent_field_implicit_type() {
		$field = $this->get_new_field_instance(
			array(
				'type'                   => 'consent',
				'id'                     => 'test_consent',
				'consenttype'            => 'implicit',
				'implicitconsentmessage' => 'By submitting this form, you agree to our terms.',
			)
		);

		$html = $field->render();

		// Should contain a hidden input field
		$this->assertStringContainsString( 'type=\'hidden\'', $html );
		$this->assertStringContainsString( 'value=\'Yes\'', $html );
		$this->assertStringContainsString( 'consent-implicit', $html );
		$this->assertStringContainsString( 'By submitting this form, you agree to our terms.', $html );
	}

	/**
	 * Test consent field renders as checkbox when consent type is explicit.
	 */
	public function test_render_consent_field_explicit_type() {
		$field = $this->get_new_field_instance(
			array(
				'type'                   => 'consent',
				'id'                     => 'test_consent',
				'consenttype'            => 'explicit',
				'explicitconsentmessage' => 'I agree to the terms and conditions.',
			)
		);

		$html = $field->render();

		// Should contain a checkbox input field
		$this->assertStringContainsString( 'type=\'checkbox\'', $html );
		$this->assertStringContainsString( 'value=\'Yes\'', $html );
		$this->assertStringContainsString( 'consent-explicit', $html );
		$this->assertStringContainsString( 'I agree to the terms and conditions.', $html );
	}

	/**
	 * Test consent field defaults to implicit when no consent type is specified.
	 */
	public function test_render_consent_field_default_implicit() {
		$field = $this->get_new_field_instance(
			array(
				'type'                   => 'consent',
				'id'                     => 'test_consent',
				'implicitconsentmessage' => 'Default implicit consent message.',
			)
		);

		$html = $field->render();

		// Should default to implicit (hidden field)
		$this->assertStringContainsString( 'type=\'hidden\'', $html );
		$this->assertStringContainsString( 'consent-implicit', $html );
	}

	/**
	 * A grouped field whose legend label is fully hidden via block visibility
	 * must render no <legend>, but must move the label onto the <fieldset> as an
	 * aria-label so the group keeps an accessible name. Covers both fieldset code
	 * paths — radio/checkbox-multiple/image-select (via $fieldset_id) and rating
	 * (via sprintf). See FORMS-694.
	 *
	 * @dataProvider data_grouped_field_types
	 *
	 * @param string $type       The grouped field type.
	 * @param array  $extra_atts Extra attributes needed to make the field renderable.
	 */
	#[DataProvider( 'data_grouped_field_types' )]
	public function test_render_grouped_field_hidden_legend_keeps_accessible_name( $type, $extra_atts ) {
		$field = $this->get_new_field_instance(
			array_merge(
				array(
					'type'                         => $type,
					'id'                           => 'test_group',
					'label'                        => 'Pick one',
					'labelhiddenbyblockvisibility' => true,
				),
				$extra_atts
			)
		);

		$html = $field->render();

		// The legend is dropped (no visible group label)...
		$this->assertStringNotContainsString( '<legend', $html );
		// ...but the accessible name is preserved on the fieldset.
		$this->assertStringContainsString( "aria-label='Pick one'", $html );
	}

	/**
	 * When the legend label is NOT hidden, the grouped field renders a normal
	 * <legend> and does not add the aria-label fallback to the fieldset. Guards
	 * the render-level behavior above against regressions. See FORMS-694.
	 *
	 * @dataProvider data_grouped_field_types
	 *
	 * @param string $type       The grouped field type.
	 * @param array  $extra_atts Extra attributes needed to make the field renderable.
	 */
	#[DataProvider( 'data_grouped_field_types' )]
	public function test_render_grouped_field_visible_legend_has_no_aria_label( $type, $extra_atts ) {
		$field = $this->get_new_field_instance(
			array_merge(
				array(
					'type'  => $type,
					'id'    => 'test_group',
					'label' => 'Pick one',
				),
				$extra_atts
			)
		);

		$html = $field->render();

		$this->assertStringContainsString( '<legend', $html );
		$this->assertStringContainsString( 'Pick one', $html );
		$this->assertStringNotContainsString( "aria-label='Pick one'", $html );
	}

	/**
	 * Grouped field types keyed by the two distinct <fieldset> code paths.
	 *
	 * @return array
	 */
	public static function data_grouped_field_types() {
		return array(
			// $fieldset_id path (shared by radio, checkbox-multiple, image-select).
			'radio'             => array( 'radio', array( 'options' => array( 'A', 'B' ) ) ),
			'checkbox-multiple' => array( 'checkbox-multiple', array( 'options' => array( 'A', 'B' ) ) ),
			// sprintf path.
			'rating'            => array( 'rating', array() ),
		);
	}

	/**
	 * Per-viewport hide: a grouped field whose legend label carries a
	 * wp-block-hidden-{viewport} class is still rendered (display:none only on
	 * that viewport), but the <fieldset> also gets an aria-label so the group
	 * keeps an accessible name where the legend is hidden. See FORMS-694.
	 */
	public function test_render_grouped_field_per_viewport_hidden_legend_keeps_accessible_name() {
		$field = $this->get_new_field_instance(
			array(
				'type'         => 'radio',
				'id'           => 'test_group',
				'label'        => 'Pick one',
				'options'      => array( 'A', 'B' ),
				'labelclasses' => 'wp-block-hidden-mobile',
			)
		);

		$html = $field->render();

		// The legend is still rendered (per-viewport is display:none, not removed)...
		$this->assertStringContainsString( '<legend', $html );
		$this->assertStringContainsString( 'wp-block-hidden-mobile', $html );
		// ...and the accessible name is also on the fieldset for the hidden viewport.
		$this->assertStringContainsString( "aria-label='Pick one'", $html );
	}

	/**
	 * Per-viewport hide: a single input whose label carries a
	 * wp-block-hidden-{viewport} class gets an aria-label (the label text, not the
	 * placeholder) so it keeps an accessible name where the label is hidden. See
	 * FORMS-694.
	 */
	public function test_render_input_per_viewport_hidden_label_keeps_accessible_name() {
		$field = $this->get_new_field_instance(
			array(
				'type'         => 'text',
				'id'           => 'test_text',
				'label'        => 'Your name',
				'placeholder'  => 'e.g. Jane',
				'labelclasses' => 'wp-block-hidden-tablet',
			)
		);

		$html = $field->render();

		// The accessible name falls back to the label, matching the visible label.
		$this->assertStringContainsString( "aria-label='Your name'", $html );
		$this->assertStringNotContainsString( "aria-label='e.g. Jane'", $html );
	}

	/**
	 * The slider's <input type="range"> gets the hidden-label aria-label fallback
	 * too — it renders a bare range input with no other accessible name. See
	 * FORMS-694.
	 */
	public function test_render_slider_hidden_label_keeps_accessible_name() {
		$field = $this->get_new_field_instance(
			array(
				'type'                         => 'slider',
				'id'                           => 'test_slider',
				'label'                        => 'Rate us',
				'labelhiddenbyblockvisibility' => true,
			)
		);

		$html = $field->render();

		$this->assertStringContainsString( 'type="range"', $html );
		$this->assertStringContainsString( "aria-label='Rate us'", $html );
	}

	/**
	 * When the label is hidden but empty and there is no placeholder, no
	 * aria-label attribute is emitted (rather than an empty or fragment value).
	 * See FORMS-694.
	 */
	public function test_render_input_hidden_empty_label_emits_no_aria_label() {
		$field = $this->get_new_field_instance(
			array(
				'type'                         => 'text',
				'id'                           => 'test_text',
				'label'                        => '',
				'labelhiddenbyblockvisibility' => true,
			)
		);

		$html = $field->render();

		$this->assertStringNotContainsString( 'aria-label', $html );
	}

	/**
	 * The file field's dropzone button gets a distinct accessible name when its
	 * label is hidden (field label prefixed to the instruction) so two
	 * hidden-label upload fields aren't announced identically, and falls back to
	 * the plain instruction otherwise. Tested directly because the full file
	 * render short-circuits without an active Jetpack. See FORMS-694.
	 *
	 * @dataProvider data_file_dropzone_aria_label
	 *
	 * @param array  $atts     Field attributes.
	 * @param string $expected Expected dropzone accessible name.
	 */
	#[DataProvider( 'data_file_dropzone_aria_label' )]
	public function test_file_dropzone_aria_label( $atts, $expected ) {
		$field  = $this->get_new_field_instance( array_merge( array( 'type' => 'file' ), $atts ) );
		$method = new \ReflectionMethod( $field, 'get_file_dropzone_aria_label' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertSame( $expected, $method->invoke( $field ) );
	}

	/**
	 * Data provider for test_file_dropzone_aria_label.
	 *
	 * @return array
	 */
	public static function data_file_dropzone_aria_label() {
		return array(
			'visible label'          => array( array( 'label' => 'Resume' ), 'Select a file to upload.' ),
			'full-hidden label'      => array(
				array(
					'label'                        => 'Resume',
					'labelhiddenbyblockvisibility' => true,
				),
				'Resume: Select a file to upload.',
			),
			'per-viewport hidden'    => array(
				array(
					'label'        => 'Resume',
					'labelclasses' => 'wp-block-hidden-mobile',
				),
				'Resume: Select a file to upload.',
			),
			'hidden but empty label' => array(
				array(
					'label'                        => '',
					'labelhiddenbyblockvisibility' => true,
				),
				'Select a file to upload.',
			),
		);
	}

	/**
	 * The hidden-label aria-label fallback reaches the other single-input render
	 * paths too — textarea, select and the country-selector phone input each move
	 * the label onto the control when it's hidden. See FORMS-694.
	 *
	 * @dataProvider data_single_input_render_paths
	 *
	 * @param array $atts Field attributes (type plus anything needed to render).
	 */
	#[DataProvider( 'data_single_input_render_paths' )]
	public function test_render_single_input_hidden_label_keeps_accessible_name( $atts ) {
		$hidden = $this->get_new_field_instance(
			array_merge( array( 'label' => 'Your name' ), $atts, array( 'labelhiddenbyblockvisibility' => true ) )
		);
		$this->assertStringContainsString( "aria-label='Your name'", $hidden->render() );

		// And no stray aria-label when the label is visible.
		$shown = $this->get_new_field_instance( array_merge( array( 'label' => 'Your name' ), $atts ) );
		$this->assertStringNotContainsString( "aria-label='Your name'", $shown->render() );
	}

	/**
	 * Data provider for test_render_single_input_hidden_label_keeps_accessible_name.
	 *
	 * @return array
	 */
	public static function data_single_input_render_paths() {
		return array(
			'textarea'          => array( array( 'type' => 'textarea' ) ),
			'select'            => array(
				array(
					'type'    => 'select',
					'options' => array( 'A', 'B' ),
				),
			),
			'phone w/ selector' => array(
				array(
					'type'                => 'phone',
					'showcountryselector' => true,
				),
			),
		);
	}
} // end class

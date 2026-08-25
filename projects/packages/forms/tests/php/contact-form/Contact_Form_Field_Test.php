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

	private function get_new_field_instance( $attributes, $style = '' ) {
		$defaults = array(
			'type'    => 'text',
			'id'      => 'id',
			'default' => 'default',
		);

		$form_attributes = $style ? array( 'className' => 'is-style-' . $style ) : array();
		$form            = new Contact_Form( $form_attributes );
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
	 * A missing checkbox value on a real submission means the visitor unchecked it.
	 * It must not be repopulated from the query string or configured default.
	 *
	 * @dataProvider submitted_unchecked_field_provider
	 *
	 * @param string $field_type  Field type.
	 * @param array  $attributes  Additional field attributes.
	 */
	#[DataProvider( 'submitted_unchecked_field_provider' )]
	public function test_submitted_unchecked_fields_do_not_fall_back_to_prefills( $field_type, $attributes ) {
		$form  = new Contact_Form( array( 'id' => 'submitted-form' ) );
		$field = new Contact_Form_Field(
			array_merge(
				array(
					'id'      => 'choice',
					'type'    => $field_type,
					'default' => 'Yes',
				),
				$attributes
			),
			'',
			$form
		);

		$_GET['choice']             = 'Yes';
		$_POST['action']            = 'grunion-contact-form';
		$_POST['contact-form-id']   = $form->get_attribute( 'id' );
		$_POST['contact-form-hash'] = $form->hash;

		$this->assertSame( '', $field->get_computed_field_value( $field_type, 'choice' ) );
	}

	/**
	 * Field types represented by checkbox controls.
	 *
	 * @return array
	 */
	public static function submitted_unchecked_field_provider() {
		return array(
			'checkbox'          => array( 'checkbox', array() ),
			'checkbox-multiple' => array( 'checkbox-multiple', array() ),
			'explicit consent'  => array( 'consent', array( 'consenttype' => 'explicit' ) ),
		);
	}

	/**
	 * Explicit consent never renders checked, so prefills must not satisfy its conditions.
	 *
	 * @dataProvider explicit_consent_prefill_provider
	 *
	 * @param string $default   Configured default value.
	 * @param string $get_value Query-string value.
	 */
	#[DataProvider( 'explicit_consent_prefill_provider' )]
	public function test_explicit_consent_conditional_value_ignores_prefills( $default, $get_value ) {
		$field = $this->get_new_field_instance(
			array(
				'type'        => 'consent',
				'id'          => 'choice',
				'default'     => $default,
				'consenttype' => 'explicit',
			)
		);

		if ( '' !== $get_value ) {
			$_GET['choice'] = $get_value;
		}

		$this->assertSame( '', $field->get_conditional_logic_value() );
	}

	/**
	 * Prefills that cannot check an explicit-consent control.
	 *
	 * @return array
	 */
	public static function explicit_consent_prefill_provider() {
		return array(
			'configured default' => array( 'Yes', '' ),
			'query string'       => array( '', 'Yes' ),
		);
	}

	/**
	 * Implicit consent is represented by a hidden input whose submitted value is always Yes.
	 */
	public function test_implicit_consent_computed_value_matches_its_hidden_input() {
		$field = $this->get_new_field_instance(
			array(
				'type'        => 'consent',
				'id'          => 'test_consent',
				'consenttype' => 'implicit',
			)
		);

		$this->assertSame( 'Yes', $field->get_computed_field_value( 'consent', 'test_consent' ) );
	}

	/**
	 * JWT submissions omit the normal form action but still represent a submitted checkbox.
	 */
	public function test_submitted_unchecked_field_is_empty_for_jwt_submission() {
		$form  = new Contact_Form( array( 'id' => 'submitted-form' ) );
		$field = new Contact_Form_Field(
			array(
				'id'      => 'choice',
				'type'    => 'checkbox',
				'default' => 'Yes',
			),
			'',
			$form
		);

		$_POST['contact-form-id']          = $form->get_attribute( 'id' );
		$_POST['contact-form-hash']        = $form->hash;
		$_POST['jetpack_contact_form_jwt'] = 'validated-by-submission-handler';

		$this->assertSame( '', $field->get_computed_field_value( 'checkbox', 'choice' ) );
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

		$processor = new \WP_HTML_Tag_Processor( $html );
		$this->assertTrue( $processor->next_tag( array( 'tag_name' => 'DIV' ) ) );
		$context = json_decode( (string) $processor->get_attribute( 'data-wp-context' ), true );
		$this->assertIsArray( $context );
		$this->assertSame( 'Yes', $context['fieldValue'] );
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
	 * Hidden fields can drive conditional logic, so the browser store must register them.
	 */
	public function test_render_hidden_field_registers_its_value_with_interactivity() {
		$field = $this->get_new_field_instance(
			array(
				'type'    => 'hidden',
				'id'      => 'campaign',
				'default' => 'summer',
			)
		);

		$processor = new \WP_HTML_Tag_Processor( $field->render() );
		$this->assertTrue( $processor->next_tag( array( 'tag_name' => 'INPUT' ) ) );
		$this->assertSame( 'campaign', $processor->get_attribute( 'data-jp-field-id' ) );
		$this->assertSame( 'callbacks.initializeField', $processor->get_attribute( 'data-wp-init' ) );

		$context = json_decode( (string) $processor->get_attribute( 'data-wp-context' ), true );
		$this->assertIsArray( $context );
		$this->assertSame( 'hidden', $context['fieldType'] );
		$this->assertSame( 'summer', $context['fieldValue'] );
	}

	/**
	 * Hidden field rendering and server-side visibility share one filtered value.
	 */
	public function test_hidden_field_value_filter_runs_once_for_render_and_conditional_logic() {
		$filter_calls = 0;
		$filter       = static function () use ( &$filter_calls ) {
			++$filter_calls;
			return 'filtered-' . $filter_calls;
		};
		add_filter( 'jetpack_forms_hidden_field_value', $filter );

		$field = $this->get_new_field_instance(
			array(
				'type'    => 'hidden',
				'id'      => 'campaign',
				'default' => 'summer',
			)
		);

		try {
			$html = $field->render();
			$this->assertSame( 'filtered-1', $field->get_conditional_logic_value() );
			$this->assertStringContainsString( "value='filtered-1'", $html );
			$this->assertSame( 1, $filter_calls );
		} finally {
			remove_filter( 'jetpack_forms_hidden_field_value', $filter );
		}
	}

	/**
	 * A submitted hidden value was filtered before it was rendered into the browser.
	 */
	public function test_submitted_hidden_field_value_is_not_filtered_again() {
		$filter_calls = 0;
		$filter       = static function ( $value ) use ( &$filter_calls ) {
			++$filter_calls;
			return 'prefix-' . $value;
		};
		add_filter( 'jetpack_forms_hidden_field_value', $filter );

		$form  = new Contact_Form( array( 'id' => 'submitted-form' ) );
		$field = new Contact_Form_Field(
			array(
				'type'    => 'hidden',
				'id'      => 'campaign',
				'default' => 'summer',
			),
			'',
			$form
		);

		try {
			$this->assertStringContainsString( "value='prefix-summer'", $field->render() );

			$_POST['action']            = 'grunion-contact-form';
			$_POST['contact-form-id']   = $form->get_attribute( 'id' );
			$_POST['contact-form-hash'] = $form->hash;
			$_POST['campaign']          = 'prefix-summer';

			$this->assertSame( 'prefix-summer', $field->get_conditional_logic_value() );
			$submission_html = $field->render();
			$this->assertStringContainsString( "value='prefix-summer'", $submission_html );
			$this->assertStringNotContainsString( 'prefix-prefix-summer', $submission_html );
			$this->assertSame( 1, $filter_calls );
		} finally {
			remove_filter( 'jetpack_forms_hidden_field_value', $filter );
		}
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
	 * @param array  $atts      Field attributes.
	 * @param string $expected  Expected dropzone accessible name.
	 * @param int    $max_files How many files the field accepts.
	 */
	#[DataProvider( 'data_file_dropzone_aria_label' )]
	public function test_file_dropzone_aria_label( $atts, $expected, $max_files = 1 ) {
		$field  = $this->get_new_field_instance( array_merge( array( 'type' => 'file' ), $atts ) );
		$method = new \ReflectionMethod( $field, 'get_file_dropzone_aria_label' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertSame( $expected, $method->invoke( $field, $max_files ) );
	}

	/**
	 * Data provider for test_file_dropzone_aria_label.
	 *
	 * @return array
	 */
	public static function data_file_dropzone_aria_label() {
		return array(
			'visible label'           => array( array( 'label' => 'Resume' ), 'Select a file to upload.' ),
			'full-hidden label'       => array(
				array(
					'label'                        => 'Resume',
					'labelhiddenbyblockvisibility' => true,
				),
				'Resume: Select a file to upload.',
			),
			'per-viewport hidden'     => array(
				array(
					'label'        => 'Resume',
					'labelclasses' => 'wp-block-hidden-mobile',
				),
				'Resume: Select a file to upload.',
			),
			'hidden but empty label'  => array(
				array(
					'label'                        => '',
					'labelhiddenbyblockvisibility' => true,
				),
				'Select a file to upload.',
			),
			// The visible dropzone text is an inner block the author writes, and it may well still
			// read "a file" on a field that takes several — so the count has to be in the name.
			'multi-file field'        => array(
				array( 'label' => 'Attachments' ),
				'Select up to 5 files to upload.',
				5,
			),
			'multi-file hidden label' => array(
				array(
					'label'                        => 'Attachments',
					'labelhiddenbyblockvisibility' => true,
				),
				'Attachments: Select up to 3 files to upload.',
				3,
			),
		);
	}

	/**
	 * `maxfiles` reaches PHP as author-supplied shortcode text, and both the rendered `multiple`
	 * attribute and the submission-time count check are derived from it, so it is clamped rather
	 * than trusted.
	 *
	 * @dataProvider data_file_field_max_files
	 *
	 * @param mixed $attribute The `maxfiles` attribute value.
	 * @param int   $expected  The resolved number of files.
	 */
	#[DataProvider( 'data_file_field_max_files' )]
	public function test_file_field_max_files_is_clamped( $attribute, $expected ) {
		$field = $this->get_new_field_instance(
			array(
				'type'     => 'file',
				'maxfiles' => $attribute,
			)
		);

		$method = new \ReflectionMethod( $field, 'get_file_field_max_files' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertSame( $expected, $method->invoke( $field ) );
	}

	/**
	 * Data provider for test_file_field_max_files_is_clamped.
	 *
	 * @return array
	 */
	public static function data_file_field_max_files() {
		return array(
			'unset'             => array( null, 1 ),
			'a number'          => array( 5, 5 ),
			// Shortcode attributes arrive as strings even when the block stored a number.
			'a numeric string'  => array( '5', 5 ),
			'at the ceiling'    => array( 10, 10 ),
			'above the ceiling' => array( 99, 10 ),
			'zero'              => array( 0, 1 ),
			'negative'          => array( -3, 1 ),
			'not a number'      => array( 'lots', 1 ),
		);
	}

	/**
	 * A site can raise the count past the ceiling that bounds the author-supplied attribute. The
	 * clamp is there because that attribute is content; a filter is site code.
	 */
	public function test_file_field_max_files_is_filterable() {
		$filter = function () {
			return 25;
		};
		add_filter( 'jetpack_forms_file_field_max_files', $filter );

		$field = $this->get_new_field_instance(
			array(
				'type'     => 'file',
				'maxfiles' => 3,
			)
		);

		$method = new \ReflectionMethod( $field, 'get_file_field_max_files' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$filtered = $method->invoke( $field );

		remove_filter( 'jetpack_forms_file_field_max_files', $filter );

		$this->assertSame( 25, $filtered );
	}

	/**
	 * A filter returning nonsense must not produce a field that accepts no files at all.
	 */
	public function test_file_field_max_files_filter_cannot_go_below_one() {
		$filter = function () {
			return 0;
		};
		add_filter( 'jetpack_forms_file_field_max_files', $filter );

		$field  = $this->get_new_field_instance( array( 'type' => 'file' ) );
		$method = new \ReflectionMethod( $field, 'get_file_field_max_files' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$filtered = $method->invoke( $field );

		remove_filter( 'jetpack_forms_file_field_max_files', $filter );

		$this->assertSame( 1, $filtered );
	}

	/**
	 * The filtered count is what reaches the browser, so the front end and the submission-time
	 * check are measured against the same number.
	 */
	public function test_filtered_max_files_reaches_field_extra() {
		$filter = function () {
			return 12;
		};
		add_filter( 'jetpack_forms_file_field_max_files', $filter );

		$field  = $this->get_new_field_instance( array( 'type' => 'file' ) );
		$method = new \ReflectionMethod( $field, 'get_field_extra' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$extra = $method->invoke( $field, 'file', array() );

		remove_filter( 'jetpack_forms_file_field_max_files', $filter );

		$this->assertSame( 12, $extra['maxFiles'] );
	}

	/**
	 * The submission-time check honours the filter too, or a site raising the count would have its
	 * own submissions rejected.
	 */
	public function test_filtered_max_files_is_honoured_on_submission() {
		$filter = function () {
			return 3;
		};
		add_filter( 'jetpack_forms_file_field_max_files', $filter );

		$field = $this->get_new_field_instance(
			array(
				'type'     => 'file',
				'id'       => 'test_files',
				'label'    => 'Attachments',
				'maxfiles' => 1,
				'required' => '1',
			)
		);

		$_POST['test_files'] = array(
			wp_json_encode( array( 'file_id' => 1 ), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( array( 'file_id' => 2 ), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( array( 'file_id' => 3 ), JSON_UNESCAPED_SLASHES ),
		);

		$field->validate();
		unset( $_POST['test_files'] );
		remove_filter( 'jetpack_forms_file_field_max_files', $filter );

		// Three files against an attribute of 1, allowed because the filter raised it.
		$this->assertFalse( $field->is_error() );
	}

	/**
	 * The per-file size limit is filterable, and the message the visitor is shown is built from the
	 * same number — otherwise a site raising the limit would still be told 20 MB.
	 */
	public function test_file_field_max_upload_size_is_filterable() {
		$filter = function () {
			return 5 * 1024 * 1024;
		};
		add_filter( 'jetpack_forms_file_field_max_upload_size', $filter );

		$method = new \ReflectionMethod( Contact_Form_Field::class, 'get_file_field_max_upload_size' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$filtered = $method->invoke( null );

		remove_filter( 'jetpack_forms_file_field_max_upload_size', $filter );

		$this->assertSame( 5 * 1024 * 1024, $filtered );
	}

	/**
	 * The filter cannot raise the limit past what the endpoint will store. A larger value would
	 * have the field accept a file, promise that size in the "file is too large" message, and then
	 * fail the upload after the visitor had already waited for it.
	 */
	public function test_file_field_max_upload_size_filter_cannot_exceed_the_endpoint() {
		$filter = function () {
			return 2 * 1024 * 1024 * 1024;
		};
		add_filter( 'jetpack_forms_file_field_max_upload_size', $filter );

		$method = new \ReflectionMethod( Contact_Form_Field::class, 'get_file_field_max_upload_size' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$filtered = $method->invoke( null );

		remove_filter( 'jetpack_forms_file_field_max_upload_size', $filter );

		$this->assertSame( Contact_Form_Field::FILE_FIELD_MAX_UPLOAD_SIZE, $filtered );
	}

	/**
	 * A filter may reach past what an author can choose, but not without a ceiling — nothing on the
	 * receiving end refuses a submission for holding too many files.
	 */
	public function test_file_field_max_files_filter_cannot_exceed_the_absolute_limit() {
		$filter = function () {
			return 500;
		};
		add_filter( 'jetpack_forms_file_field_max_files', $filter );

		$field  = $this->get_new_field_instance( array( 'type' => 'file' ) );
		$method = new \ReflectionMethod( $field, 'get_file_field_max_files' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$filtered = $method->invoke( $field );

		remove_filter( 'jetpack_forms_file_field_max_files', $filter );

		$this->assertSame( Contact_Form_Field::FILE_FIELD_MAX_FILES_ABSOLUTE_LIMIT, $filtered );
	}

	/**
	 * The ceiling a filter may reach has to sit above the one an author may choose, or the filter
	 * could only ever lower the limit and the two constants would be describing the same thing.
	 */
	public function test_the_filter_ceiling_is_above_the_author_ceiling() {
		$this->assertGreaterThan(
			Contact_Form_Field::FILE_FIELD_MAX_FILES_LIMIT,
			Contact_Form_Field::FILE_FIELD_MAX_FILES_ABSOLUTE_LIMIT
		);
	}

	/**
	 * Unfiltered, the documented default.
	 */
	public function test_file_field_max_upload_size_defaults_to_the_constant() {
		$method = new \ReflectionMethod( Contact_Form_Field::class, 'get_file_field_max_upload_size' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertSame( Contact_Form_Field::FILE_FIELD_MAX_UPLOAD_SIZE, $method->invoke( null ) );
	}

	/**
	 * The editor control's ceiling is a separate constant in JavaScript, kept in step by a comment
	 * on each side. Nothing else fails if one of them moves, and the symptom would be quiet: the
	 * editor would offer a number the front end silently lowers.
	 */
	public function test_file_field_ceiling_matches_the_editor_control() {
		$edit_jsx = file_get_contents( __DIR__ . '/../../../src/blocks/field-file/edit.jsx' );

		$this->assertSame(
			1,
			preg_match( '/const MAX_FILES_LIMIT = (\d+);/', $edit_jsx, $matches ),
			'Could not find MAX_FILES_LIMIT in blocks/field-file/edit.jsx.'
		);
		$this->assertSame(
			Contact_Form_Field::FILE_FIELD_MAX_FILES_LIMIT,
			(int) $matches[1],
			'The editor control offers a different ceiling than the renderer enforces.'
		);
	}

	/**
	 * A file field authored before the setting existed carries no `maxfiles` at all, and has to
	 * keep accepting exactly one file.
	 */
	public function test_file_field_without_max_files_accepts_one() {
		$field  = $this->get_new_field_instance( array( 'type' => 'file' ) );
		$method = new \ReflectionMethod( $field, 'get_file_field_max_files' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertSame( 1, $method->invoke( $field ) );
	}

	/**
	 * The resolved count travels to the front end in `fieldExtra`, which is where the view module
	 * reads it: the dropzone, the add-time capacity check and the picker all work from that value.
	 */
	public function test_file_field_extra_carries_the_resolved_max_files() {
		$field = $this->get_new_field_instance(
			array(
				'type'     => 'file',
				'maxfiles' => 4,
			)
		);

		$method = new \ReflectionMethod( $field, 'get_field_extra' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$extra = $method->invoke( $field, 'file', array() );

		$this->assertSame( 4, $extra['maxFiles'] );
		$this->assertNotEmpty( $extra['allowedMimeTypes'] );
	}

	/**
	 * The count was enforced only in the browser, so a submission assembled by hand could carry
	 * as many uploaded file IDs as it liked and every one would be attached to the response.
	 */
	public function test_file_field_rejects_more_files_than_it_accepts() {
		$field = $this->get_new_field_instance(
			array(
				'type'     => 'file',
				'id'       => 'test_files',
				'label'    => 'Attachments',
				'maxfiles' => 2,
				'required' => '1',
			)
		);

		$_POST['test_files'] = array(
			wp_json_encode( array( 'file_id' => 1 ), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( array( 'file_id' => 2 ), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( array( 'file_id' => 3 ), JSON_UNESCAPED_SLASHES ),
		);

		$field->validate();
		unset( $_POST['test_files'] );

		$this->assertTrue( $field->is_error(), 'A third file on a two-file field must be rejected.' );
	}

	/**
	 * The limit has to hold for an optional field too. It reaches the count check by a different
	 * route — the `! required && ! has_value()` early return — so a change to how has_value() reads
	 * an array value could drop the check for optional fields without any test noticing.
	 */
	public function test_file_field_limit_applies_when_the_field_is_optional() {
		$field = $this->get_new_field_instance(
			array(
				'type'     => 'file',
				'id'       => 'test_files',
				'label'    => 'Attachments',
				'maxfiles' => 2,
			)
		);

		$_POST['test_files'] = array(
			wp_json_encode( array( 'file_id' => 1 ), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( array( 'file_id' => 2 ), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( array( 'file_id' => 3 ), JSON_UNESCAPED_SLASHES ),
		);

		$field->validate();
		unset( $_POST['test_files'] );

		$this->assertTrue( $field->is_error() );
	}

	/**
	 * The shapes an attacker actually sends, rather than the one the field writes.
	 *
	 * @dataProvider data_malformed_file_field_values
	 *
	 * @param mixed $value The posted value.
	 */
	#[DataProvider( 'data_malformed_file_field_values' )]
	public function test_file_field_handles_a_malformed_submission( $value ) {
		$field = $this->get_new_field_instance(
			array(
				'type'     => 'file',
				'id'       => 'test_files',
				'label'    => 'Attachments',
				'maxfiles' => 3,
				'required' => '1',
			)
		);

		$_POST['test_files'] = $value;

		$field->validate();
		unset( $_POST['test_files'] );

		// Rejected rather than fatal, and never silently accepted.
		$this->assertTrue( $field->is_error() );
	}

	/**
	 * Data provider for test_file_field_handles_a_malformed_submission.
	 *
	 * @return array
	 */
	public static function data_malformed_file_field_values() {
		return array(
			'a scalar'            => array( 'not-an-array' ),
			'an empty array'      => array( array() ),
			'no zero index'       => array( array( 1 => '{"file_id":1}' ) ),
			'a nested array'      => array( array( array( 'x' => 'y' ) ) ),
			'an empty first slot' => array( array( '', '{"file_id":1}' ) ),
		);
	}

	/**
	 * The mirror case, so the check above cannot pass by rejecting everything.
	 */
	public function test_file_field_accepts_a_submission_within_its_limit() {
		$field = $this->get_new_field_instance(
			array(
				'type'     => 'file',
				'id'       => 'test_files',
				'label'    => 'Attachments',
				'maxfiles' => 2,
				'required' => '1',
			)
		);

		$_POST['test_files'] = array(
			wp_json_encode( array( 'file_id' => 1 ), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( array( 'file_id' => 2 ), JSON_UNESCAPED_SLASHES ),
		);

		$field->validate();
		unset( $_POST['test_files'] );

		$this->assertFalse( $field->is_error() );
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

	/**
	 * Invoke the private file-field content sanitizer.
	 *
	 * Tested directly because the full file render short-circuits without an active
	 * Jetpack (see test_file_dropzone_aria_label).
	 *
	 * @param string|null $content Raw field content.
	 *
	 * @return string
	 */
	private function sanitize_file_content( $content ) {
		$field  = $this->get_new_field_instance( array( 'type' => 'file' ) );
		$method = new \ReflectionMethod( $field, 'sanitize_file_field_content' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( $field, $content );
	}

	/**
	 * The file field's inner content is entity-decoded before output so the dropzone's
	 * inner blocks render (they are stored esc_html()-encoded by
	 * Contact_Form::parse_contact_field()). An author without unfiltered_html can abuse
	 * that by storing entity-encoded markup, which post-save KSES never inspects because
	 * it is plain text at that point. Decoded output must therefore be filtered.
	 *
	 * @dataProvider data_file_field_content_xss
	 *
	 * @param string $content Entity-encoded field content.
	 */
	#[DataProvider( 'data_file_field_content_xss' )]
	public function test_file_field_content_strips_executable_markup( $content ) {
		$output = $this->sanitize_file_content( $content );

		$this->assertDoesNotMatchRegularExpression( '/<\s*script/i', $output );
		$this->assertDoesNotMatchRegularExpression( '/<[^>]+\son[a-z]+\s*=/i', $output );
		$this->assertStringNotContainsString( '<iframe', $output );
	}

	/**
	 * Data provider for test_file_field_content_strips_executable_markup.
	 *
	 * @return array
	 */
	public static function data_file_field_content_xss() {
		return array(
			'img onerror'      => array( '&lt;img src=x onerror=alert(document.domain)&gt;' ),
			'script tag'       => array( '&lt;script&gt;alert(1)&lt;/script&gt;' ),
			'svg onload'       => array( '&lt;svg onload=alert(1)&gt;&lt;/svg&gt;' ),
			'iframe'           => array( '&lt;iframe src="//evil.example"&gt;&lt;/iframe&gt;' ),
			'div onmouseover'  => array( '&lt;div onmouseover=alert(1)&gt;hi&lt;/div&gt;' ),
			'script in svg'    => array( '&lt;svg&gt;&lt;script&gt;alert(1)&lt;/script&gt;&lt;/svg&gt;' ),
			'body onload'      => array( '&lt;body onload=alert(1)&gt;' ),
			'already-raw html' => array( '<img src=x onerror=alert(1)>' ),
		);
	}

	/**
	 * The date field no longer welds the format into its visible label.
	 */
	public function test_date_field_label_has_no_format_suffix() {
		$field = $this->get_new_field_instance(
			array(
				'type'       => 'date',
				'id'         => 'g1-birthday',
				'label'      => 'Birthday',
				'dateformat' => 'mm/dd/yy',
			)
		);

		$html = $field->render();

		$this->assertStringNotContainsString( 'Birthday (MM/DD/YYYY)', $html );
		$this->assertStringContainsString( 'Birthday', $html );
	}

	/**
	 * The format renders as its own element below the input.
	 */
	public function test_date_field_renders_format_hint_element() {
		$field = $this->get_new_field_instance(
			array(
				'type'       => 'date',
				'id'         => 'g1-birthday',
				'label'      => 'Birthday',
				'dateformat' => 'mm/dd/yy',
			)
		);

		$html = $field->render();

		$this->assertStringContainsString( 'class="contact-form__field-format"', $html );
		$this->assertStringContainsString( 'id="g1-birthday-text-format"', $html );
		// Anchored on the closing tag so a re-introduced prefix would fail.
		$this->assertStringContainsString( 'class="contact-form__field-format">MM/DD/YYYY</span>', $html );
	}

	/**
	 * Each of the three formats produces its own hint text.
	 *
	 * @param string $date_format The dateformat attribute value.
	 * @param string $expected    The expected hint text.
	 * @dataProvider date_format_hint_provider
	 */
	#[DataProvider( 'date_format_hint_provider' )]
	public function test_date_field_format_hint_per_format( $date_format, $expected ) {
		$field = $this->get_new_field_instance(
			array(
				'type'       => 'date',
				'id'         => 'g1-birthday',
				'label'      => 'Birthday',
				'dateformat' => $date_format,
			)
		);

		$this->assertStringContainsString( $expected, $field->render() );
	}

	/**
	 * Data provider for date format hints.
	 *
	 * @return array
	 */
	public static function date_format_hint_provider() {
		return array(
			'US'          => array( 'mm/dd/yy', 'class="contact-form__field-format">MM/DD/YYYY</span>' ),
			'European'    => array( 'dd/mm/yy', 'class="contact-form__field-format">DD/MM/YYYY</span>' ),
			'ISO default' => array( 'yy-mm-dd', 'class="contact-form__field-format">YYYY-MM-DD</span>' ),
		);
	}

	/**
	 * Double-encoding must not survive as live markup either: it decodes to escaped text
	 * (&lt;img …&gt;), which the browser renders as characters rather than an element.
	 */
	public function test_file_field_content_double_encoding_stays_inert() {
		$output = $this->sanitize_file_content( '&amp;lt;img src=x onerror=alert(1)&amp;gt;' );

		$this->assertStringNotContainsString( '<img', $output );
		$this->assertStringContainsString( '&lt;img', $output );
	}

	/**
	 * Links using the javascript: scheme in the decoded content must lose that scheme.
	 */
	public function test_file_field_content_strips_javascript_urls() {
		$output = $this->sanitize_file_content( '&lt;a href="javascript:alert(1)"&gt;x&lt;/a&gt;' );

		$this->assertStringNotContainsString( 'javascript:', $output );
	}

	/**
	 * The legitimate dropzone markup must still render. It reaches this method
	 * esc_html()-encoded, and has to survive the round trip intact - including the
	 * tabindex Contact_Form_Plugin::gutenblock_render_dropzone() adds to keep the
	 * dropzone a single tab stop, and the inline SVG core/icon emits.
	 */
	public function test_file_field_content_preserves_dropzone_markup() {
		$output = $this->sanitize_file_content(
			esc_html(
				'<div class="wp-block-jetpack-dropzone">'
				. '<p class="has-text-align-center">Drag and drop or <strong>browse</strong></p>'
				. '<div class="wp-block-button"><a class="wp-block-button__link" tabindex="-1">Choose file</a></div>'
				. '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true"><path d="M12 3l4 4h-3v6h-2V7H8z"></path></svg>'
				. '<hr class="wp-block-separator" />'
				. '</div>'
			)
		);

		$this->assertStringContainsString( 'wp-block-jetpack-dropzone', $output );
		$this->assertStringContainsString( '<strong>browse</strong>', $output );
		$this->assertStringContainsString( 'tabindex="-1"', $output );
		$this->assertStringContainsString( '<svg', $output );
		$this->assertStringContainsString( '<path', $output );
		$this->assertStringContainsString( '<hr', $output );
	}

	/**
	 * The core/image block is an allowed dropzone inner block, so responsive-image attributes
	 * have to survive. The stock post allowlist omits srcset/sizes/decoding, which would
	 * silently degrade the image to its full-size source.
	 */
	public function test_file_field_content_preserves_responsive_image_attributes() {
		$output = $this->sanitize_file_content(
			esc_html(
				'<figure class="wp-block-image size-large"><img src="https://example.com/a.png"'
				. ' alt="x" class="wp-image-1"'
				. ' srcset="https://example.com/a-300.png 300w, https://example.com/a.png 900w"'
				. ' sizes="(max-width: 900px) 100vw, 900px" decoding="async" loading="lazy" /></figure>'
			)
		);

		$this->assertStringContainsString( 'srcset=', $output );
		$this->assertStringContainsString( 'sizes=', $output );
		$this->assertStringContainsString( 'decoding=', $output );
		$this->assertStringContainsString( 'loading=', $output );
	}

	/**
	 * The core/icon block serializes rotation as `rotate: <deg>`, which is not in WordPress's
	 * safe_style_css list. Without the scoped filter the icon would render unrotated.
	 */
	public function test_file_field_content_preserves_icon_rotation() {
		$output = $this->sanitize_file_content(
			esc_html( '<svg style="width:48px;rotate: 45deg;" viewBox="0 0 24 24"><path d="M12 3l4 4h-3z"></path></svg>' )
		);

		$this->assertStringContainsString( 'rotate', $output );
	}

	/**
	 * The safe_style_css filter that allows `rotate` must not outlive the sanitize call.
	 */
	public function test_file_field_content_rotate_filter_does_not_leak() {
		$this->sanitize_file_content( esc_html( '<svg style="rotate: 45deg;"></svg>' ) );

		$this->assertStringNotContainsString( 'rotate', safecss_filter_attr( 'width:48px;rotate: 45deg;' ) );
	}

	/**
	 * `style` is not allowed on SVG children: safecss_filter_attr() strips the presentation
	 * properties that would justify it, while still permitting position:fixed overlays.
	 */
	public function test_file_field_content_blocks_style_on_svg_children() {
		$output = $this->sanitize_file_content(
			esc_html( '<svg><path style="position:fixed;top:0;left:0;width:100vw;height:100vh" d="M0 0"></path></svg>' )
		);

		$this->assertStringNotContainsString( 'position:fixed', $output );
		$this->assertStringContainsString( '<path', $output );
	}

	/**
	 * Empty and non-string content is handled without notices.
	 */
	public function test_file_field_content_handles_empty_content() {
		$this->assertSame( '', $this->sanitize_file_content( null ) );
		$this->assertSame( '', $this->sanitize_file_content( '' ) );
	}

	/**
	 * Author help text renders above the format hint and is escaped.
	 */
	public function test_help_text_renders_and_is_escaped() {
		$field = $this->get_new_field_instance(
			array(
				'type'     => 'date',
				'id'       => 'g1-birthday',
				'label'    => 'Birthday',
				'helptext' => 'Your <b>birthday</b>',
			)
		);

		$html = $field->render();

		$this->assertStringContainsString( 'id="g1-birthday-text-help"', $html );
		$this->assertStringContainsString( 'Your &lt;b&gt;birthday&lt;/b&gt;', $html );
		$this->assertStringNotContainsString( 'Your <b>birthday</b>', $html );

		$help_position   = strpos( $html, 'contact-form__field-help' );
		$format_position = strpos( $html, 'contact-form__field-format' );
		$this->assertNotFalse( $help_position );
		$this->assertNotFalse( $format_position );
		$this->assertLessThan( $format_position, $help_position, 'Help text must render before the format hint.' );
		$this->assertSame( 1, substr_count( $html, 'class="contact-form__field-hints"' ) );
	}

	/**
	 * Aria-describedby lists error, then help, then format.
	 */
	public function test_aria_describedby_order() {
		$field = $this->get_new_field_instance(
			array(
				'type'     => 'date',
				'id'       => 'g1-birthday',
				'label'    => 'Birthday',
				'helptext' => 'Pick a day',
			)
		);

		$this->assertStringContainsString(
			'aria-describedby=\'g1-birthday-text-error-message g1-birthday-text-help g1-birthday-text-format\'',
			$field->render()
		);
	}

	/**
	 * A field with no help text emits no help element and no dangling id.
	 */
	public function test_no_help_text_leaves_no_element_or_dangling_id() {
		$field = $this->get_new_field_instance(
			array(
				'type'  => 'text',
				'id'    => 'g1-name',
				'label' => 'Name',
			)
		);

		$html = $field->render();

		$this->assertStringNotContainsString( 'contact-form__field-help', $html );
		$this->assertStringNotContainsString( 'g1-name-text-help', $html );
		$this->assertStringContainsString( 'aria-describedby=\'g1-name-text-error-message\'', $html );
	}

	/**
	 * Whitespace-only help text is treated as absent.
	 */
	public function test_whitespace_only_help_text_is_ignored() {
		$field = $this->get_new_field_instance(
			array(
				'type'     => 'text',
				'id'       => 'g1-name',
				'label'    => 'Name',
				'helptext' => '   ',
			)
		);

		$html = $field->render();

		$this->assertStringNotContainsString( 'contact-form__field-help', $html );
		$this->assertStringContainsString( 'aria-describedby=\'g1-name-text-error-message\'', $html );
	}

	/**
	 * Punctuation in help text survives the block -> shortcode -> render trip.
	 *
	 * Contact_Form::esc_shortcode_val() encodes `,` `[` `]` `\` as decimal
	 * entities so they survive the shortcode parser, and unesc_attr() only
	 * decodes the hex forms. Help text is the first attribute rendered through
	 * esc_html() into a text node, so a leftover entity would be escaped again
	 * and shown to the visitor. Building the field directly, as the other tests
	 * here do, skips the hop that does the encoding — this one must not.
	 *
	 * @param string $help_text The author-supplied help text.
	 * @dataProvider help_text_punctuation_provider
	 */
	#[DataProvider( 'help_text_punctuation_provider' )]
	public function test_help_text_punctuation_survives_the_shortcode_round_trip( $help_text ) {
		$field_shortcode = Contact_Form::parse_contact_field(
			array(
				'type'     => 'text',
				'id'       => 'g1-x',
				'label'    => 'Name',
				'helpText' => $help_text,
			),
			null
		);

		$html = do_shortcode( '[contact-form]' . $field_shortcode . '[/contact-form]' );

		$this->assertStringContainsString(
			'class="contact-form__field-help">' . esc_html( $help_text ) . '</span>',
			$html
		);
		$this->assertStringNotContainsString( '&#044;', $html );
		$this->assertStringNotContainsString( '&#091;', $html );
		$this->assertStringNotContainsString( '&#092;', $html );
		$this->assertStringNotContainsString( '&#093;', $html );
	}

	/**
	 * Data provider for help text punctuation.
	 *
	 * @return array
	 */
	public static function help_text_punctuation_provider() {
		return array(
			'comma'     => array( 'Enter your name, then your email.' ),
			'brackets'  => array( 'Use [your] nickname.' ),
			'backslash' => array( 'Domain\\username, please.' ),
		);
	}

	/**
	 * Hand-rolled input markup gets the same description wiring.
	 *
	 * @param array  $attributes Extra field attributes.
	 * @param string $type       The description type used in element ids.
	 * @dataProvider hand_rolled_field_provider
	 */
	#[DataProvider( 'hand_rolled_field_provider' )]
	public function test_hand_rolled_fields_get_descriptions( $attributes, $type ) {
		$field = $this->get_new_field_instance(
			array_merge(
				array(
					'id'       => 'g1-x',
					'label'    => 'Thing',
					'helptext' => 'Say hi',
				),
				$attributes
			)
		);

		$html = $field->render();

		$this->assertStringContainsString( 'id="g1-x-' . $type . '-help"', $html );
		$this->assertStringContainsString( 'g1-x-' . $type . '-error-message g1-x-' . $type . '-help', $html );
		$this->assertSame( 1, substr_count( $html, 'class="contact-form__field-hints"' ) );
	}

	/**
	 * Fields that build their own input markup reference their error message
	 * even with no help text.
	 *
	 * Select and slider gained an aria-describedby they never had. The provider
	 * above sets help text on every row, so without this the common case — a
	 * plain field with nothing but an error to describe — would be uncovered,
	 * and a regression that returned an empty describedby would pass.
	 *
	 * @param array  $attributes Extra field attributes.
	 * @param string $type       The description type used in element ids.
	 * @dataProvider hand_rolled_field_provider
	 */
	#[DataProvider( 'hand_rolled_field_provider' )]
	public function test_hand_rolled_fields_reference_their_error_without_help_text( $attributes, $type ) {
		$field = $this->get_new_field_instance(
			array_merge(
				array(
					'id'    => 'g1-x',
					'label' => 'Thing',
				),
				$attributes
			)
		);

		$html = $field->render();

		// Assert the attribute, not just the id — the id also appears on the
		// error span itself, so a bare substring check would pass even if the
		// input carried no aria-describedby at all.
		$this->assertMatchesRegularExpression(
			'/aria-describedby=[\'"]g1-x-' . preg_quote( $type, '/' ) . '-error-message[\'"]/',
			$html
		);
		$this->assertStringNotContainsString( 'contact-form__field-hints', $html );
		$this->assertStringNotContainsString( 'g1-x-' . $type . '-help', $html );
	}

	/**
	 * Data provider for hand-rolled input markup.
	 *
	 * @return array
	 */
	public static function hand_rolled_field_provider() {
		return array(
			'textarea'         => array( array( 'type' => 'textarea' ), 'textarea' ),
			'select'           => array(
				array(
					'type'    => 'select',
					'options' => 'a,b',
				),
				'select',
			),
			'slider'           => array(
				array(
					'type' => 'slider',
					'min'  => '0',
					'max'  => '10',
				),
				'slider',
			),
			'phone w/ country' => array(
				array(
					'type'                => 'telephone',
					'showcountryselector' => '1',
				),
				'telephone',
			),
		);
	}

	/**
	 * Inset-label styles hoist hints outside the field div, and the ids still
	 * match what aria-describedby references.
	 */
	public function test_inset_label_hoists_hints_with_matching_ids() {
		$field = $this->get_new_field_instance(
			array(
				'type'     => 'date',
				'id'       => 'g1-birthday',
				'label'    => 'Birthday',
				'helptext' => 'Pick a day',
			),
			'outlined'
		);

		$html = $field->render();

		$this->assertStringContainsString( 'contact-form__inset-label-wrap', $html );
		$this->assertStringContainsString( 'id="g1-birthday-text-help"', $html );
		$this->assertStringContainsString( 'id="g1-birthday-text-format"', $html );
		$this->assertStringContainsString( 'id="g1-birthday-text-error"', $html );

		// Check real nesting, not string offsets: the hint must sit outside the
		// inner field div that wraps the <input>, but still inside the outer
		// inset-label wrap. Without the deferral the hint renders inline in
		// render_input_field()'s output and lands inside the inner div.
		$doc              = new \DOMDocument();
		$previous_setting = libxml_use_internal_errors( true );
		$doc->loadHTML( '<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
		libxml_use_internal_errors( $previous_setting );
		$xpath = new \DOMXPath( $doc );

		$has_class    = "contains(concat(' ', normalize-space(@class), ' '), ' %s ')";
		$inside_inner = sprintf( "//div[$has_class]//*[@id='g1-birthday-text-help']", 'grunion-field-date-wrap' );
		$inside_outer = sprintf( "//div[$has_class]//*[@id='g1-birthday-text-help']", 'contact-form__inset-label-wrap' );

		$this->assertCount(
			0,
			$xpath->query( $inside_inner ),
			'Help text must be hoisted outside the inner field div, not rendered inside it.'
		);
		$this->assertCount(
			1,
			$xpath->query( $inside_outer ),
			'Help text must remain inside the inset-label wrap.'
		);
	}

	/**
	 * Regression: on inset-label styles the error id must match the id the
	 * input's aria-describedby points at, for field types whose input type
	 * differs from the field type.
	 *
	 * @param array  $attributes        Extra field attributes (lowercase shortcode names).
	 * @param string $expected_error_id The error element id that must exist.
	 * @dataProvider inset_error_id_provider
	 */
	#[DataProvider( 'inset_error_id_provider' )]
	public function test_inset_label_error_id_matches_describedby( $attributes, $expected_error_id ) {
		$field = $this->get_new_field_instance(
			array_merge(
				array(
					'id'    => 'g1-x',
					'label' => 'Thing',
				),
				$attributes
			),
			'outlined'
		);

		$html = $field->render();

		$this->assertStringContainsString( 'id="' . $expected_error_id . '"', $html );
		// The country-selector phone variant double-quotes its attributes,
		// unlike render_input_field()'s single-quoted markup, so match either.
		$this->assertMatchesRegularExpression(
			'/aria-describedby=[\'"]' . preg_quote( $expected_error_id, '/' ) . '-message/',
			$html
		);
	}

	/**
	 * Data provider for the inset error id regression.
	 *
	 * Each of these renders an input whose type differs from the field type.
	 *
	 * @return array
	 */
	public static function inset_error_id_provider() {
		return array(
			'date'             => array( array( 'type' => 'date' ), 'g1-x-text-error' ),
			'url'              => array( array( 'type' => 'url' ), 'g1-x-text-error' ),
			'name'             => array( array( 'type' => 'name' ), 'g1-x-text-error' ),
			'tel'              => array( array( 'type' => 'telephone' ), 'g1-x-tel-error' ),
			// The block editor maps the country-selector variant to field type
			// 'phone' (see class-contact-form-plugin.php's gutenblock_render_field_telephone()),
			// while render_telephone_field() always builds its ids with the
			// literal string 'telephone' -- these must still match.
			'phone w/ country' => array(
				array(
					'type'                => 'phone',
					'showcountryselector' => '1',
				),
				'g1-x-telephone-error',
			),
		);
	}
} // end class

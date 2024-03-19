<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Grunion Contact Form
 * Add a contact form to any post, page or text widget.
 * Emails will be sent to the post's author by default, or any email address you choose.
 *
 * @deprecated 13.3 Use automattic/jetpack-forms
 * @package automattic/jetpack
 */

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move classes to appropriately-named class files.

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Block;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use Automattic\Jetpack\Forms\ContactForm\Util;

define( 'GRUNION_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'GRUNION_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

if ( is_admin() ) {
	require_once GRUNION_PLUGIN_DIR . 'admin.php';
}

add_action( 'rest_api_init', 'grunion_contact_form_require_endpoint' );

/**
 * Require the Grunion endpoint.
 *
 * @deprecated 13.3
 */
function grunion_contact_form_require_endpoint() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3' );

	require_once GRUNION_PLUGIN_DIR . 'class-grunion-contact-form-endpoint.php';
}

/**
 * Sets the 'block_template' attribute on all instances of wp:jetpack/contact-form in
 * the $_wp_current_template_content global variable.
 *
 * The $_wp_current_template_content global variable is hydrated immediately prior to
 * 'template_include' in wp-includes/template-loader.php.
 *
 * This fixes Contact Form Blocks added to FSE _templates_ (e.g. Single or 404).
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_attribute
 * @param string $template Template to be loaded.
 */
function grunion_contact_form_set_block_template_attribute( $template ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_attribute' );

	return Util::grunion_contact_form_set_block_template_attribute( $template );
}
add_filter( 'template_include', 'grunion_contact_form_set_block_template_attribute' );

/**
 * Sets the $grunion_block_template_part_id global.
 *
 * This is part of the fix for Contact Form Blocks added to FSE _template parts_ (e.g footer).
 * The global is processed in Grunion_Contact_Form::parse().
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_part_id_global
 * @param string $template_part_id ID for the currently rendered template part.
 */
function grunion_contact_form_set_block_template_part_id_global( $template_part_id ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_part_id_global' );

	return Util::grunion_contact_form_set_block_template_part_id_global( $template_part_id );
}
add_action( 'render_block_core_template_part_post', 'grunion_contact_form_set_block_template_part_id_global' );
add_action( 'render_block_core_template_part_file', 'grunion_contact_form_set_block_template_part_id_global' );
add_action( 'render_block_core_template_part_none', 'grunion_contact_form_set_block_template_part_id_global' );
add_action( 'gutenberg_render_block_core_template_part_post', 'grunion_contact_form_set_block_template_part_id_global' );
add_action( 'gutenberg_render_block_core_template_part_file', 'grunion_contact_form_set_block_template_part_id_global' );
add_action( 'gutenberg_render_block_core_template_part_none', 'grunion_contact_form_set_block_template_part_id_global' );

/**
 * Unsets the global when block is done rendering.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_unset_block_template_part_id_global
 * @param string $content Rendered block content.
 * @param array  $block   The full block, including name and attributes.
 * @return string
 */
function grunion_contact_form_unset_block_template_part_id_global( $content, $block ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_unset_block_template_part_id_global' );

	return Util::grunion_contact_form_unset_block_template_part_id_global( $content, $block );
}
add_filter( 'render_block', 'grunion_contact_form_unset_block_template_part_id_global', 10, 2 );

/**
 * Sets the 'widget' attribute on all instances of the contact form in the widget block.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_filter_widget_block_content
 * @param string          $content  Existing widget block content.
 * @param array           $instance Array of settings for the current widget.
 * @param WP_Widget_Block $widget   Current Block widget instance.
 * @return string
 */
function grunion_contact_form_filter_widget_block_content( $content, $instance, $widget ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_filter_widget_block_content' );

	return Util::grunion_contact_form_filter_widget_block_content( $content, $instance, $widget );
}
add_filter( 'widget_block_content', 'grunion_contact_form_filter_widget_block_content', 1, 3 );

/**
 * Adds a given attribute to all instances of the Contact Form block.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_apply_block_attribute
 * @param string $content  Existing content to process.
 * @param array  $new_attr New attributes to add.
 * @return string
 */
function grunion_contact_form_apply_block_attribute( $content, $new_attr ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_apply_block_attribute' );

	return Util::grunion_contact_form_apply_block_attribute( $content, $new_attr );
}

/**
 * Sets up various actions, filters, post types, post statuses, shortcodes.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
 */
class Grunion_Contact_Form_Plugin {

	/**
	 *
	 * The Widget ID of the widget currently being processed.  Used to build the unique contact-form ID for forms embedded in widgets.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
	 * @var string
	 */
	public $current_widget_id;

	/**
	 * If the contact form field is being used.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
	 * @var bool
	 */
	public static $using_contact_form_field = false;

	/**
	 *
	 * The last Feedback Post ID Erased as part of the Personal Data Eraser.
	 * Helps with pagination.
	 *
	 * @var int
	 */
	private $pde_last_post_id_erased = 0;

	/**
	 *
	 * The email address for which we are deleting/exporting all feedbacks
	 * as part of a Personal Data Eraser or Personal Data Exporter request.
	 *
	 * @var string
	 */
	private $pde_email_address = '';

	/**
	 * Initializing function.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::init
	 */
	public static function init() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::init' );

		static $instance = false;

		if ( ! $instance ) {
			$instance = Contact_Form_Plugin::init();
		}

		return $instance;
	}

	/**
	 * Runs daily to clean up spam detection metadata after 15 days.  Keeps your DB squeaky clean.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->daily_akismet_meta_cleanup
	 */
	public function daily_akismet_meta_cleanup() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->daily_akismet_meta_cleanup' );

		return self::$instance->daily_akismet_meta_cleanup();
	}

	/**
	 * Strips HTML tags from input.  Output is NOT HTML safe.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::strip_tags
	 * @param mixed $data_with_tags - data we're stripping HTML tags from.
	 * @return mixed
	 */
	public static function strip_tags( $data_with_tags ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::strip_tags' );

		return Contact_Form_Plugin::strip_tags( $data_with_tags );
	}

	/**
	 * Prevent 'contact-form-styles' script from being concatenated.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm
	 * @param array  $do_concat - the concatenation flag.
	 * @param string $handle - script name.
	 */
	public static function disable_forms_style_script_concat( $do_concat, $handle ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3' );

		if ( 'jetpack-block-contact-form' === $handle ) {
			$do_concat = false;
		}
		return $do_concat;
	}

	/**
	 * Register the contact form block.
	 */
	private static function register_contact_form_blocks() {
		Contact_Form_Block::register_child_blocks();
	}

	/**
	 * Render the gutenblock form.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\ontact_Form_Block::gutenblock_render_form
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string
	 */
	public static function gutenblock_render_form( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Block::gutenblock_render_form' );

		return Contact_Form_Block::gutenblock_render_form( $atts, $content );
	}

	/**
	 * Turn block attribute to shortcode attributes.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::block_attributes_to_shortcode_attributes
	 * @param array  $atts - the block attributes.
	 * @param string $type - the type.
	 *
	 * @return array
	 */
	public static function block_attributes_to_shortcode_attributes( $atts, $type ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::block_attributes_to_shortcode_attributes' );

		return Contact_Form_Plugin::block_attributes_to_shortcode_attributes( $atts, $type );
	}

	/**
	 * Render the text field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_text
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_text( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_text' );

		return Contact_Form_Plugin::gutenblock_render_field_text( $atts, $content );
	}

	/**
	 * Render the name field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_name
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_name( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_name' );

		return Contact_Form_Plugin::gutenblock_render_field_name( $atts, $content );
	}

	/**
	 * Render the email field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_email
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_email( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_email' );

		return Contact_Form_Plugin::gutenblock_render_field_email( $atts, $content );
	}

	/**
	 * Render the url field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_url
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_url( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_url' );

		return Contact_Form_Plugin::gutenblock_render_field_url( $atts, $content );
	}

	/**
	 * Render the date field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_date
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_date( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_date' );

		return Contact_Form_Plugin::gutenblock_render_field_date( $atts, $content );
	}

	/**
	 * Render the telephone field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_telephone
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_telephone( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_telephone' );

		return Contact_Form_Plugin::gutenblock_render_field_telephone( $atts, $content );
	}

	/**
	 * Render the text area field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_textarea
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_textarea( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_textarea' );

		return Contact_Form_Plugin::gutenblock_render_field_textarea( $atts, $content );
	}

	/**
	 * Render the checkbox field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_checkbox
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_checkbox( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_checkbox' );

		return Contact_Form_Plugin::gutenblock_render_field_checkbox( $atts, $content );
	}

	/**
	 * Render the multiple checkbox field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::Contact_Form_Plugin::gutenblock_render_field_checkbox_multiple
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_checkbox_multiple( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::Contact_Form_Plugin::gutenblock_render_field_checkbox_multiple' );

		return Contact_Form_Plugin::gutenblock_render_field_checkbox_multiple( $atts, $content );
	}

	/**
	 * Render the multiple choice field option.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_option
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_option( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_option' );

		return Contact_Form_Plugin::gutenblock_render_field_option( $atts, $content );
	}

	/**
	 * Render the radio button field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_radio
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_radio( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_radio' );

		return Contact_Form_Plugin::gutenblock_render_field_radio( $atts, $content );
	}

	/**
	 * Render the select field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_select
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_select( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_select' );

		return Contact_Form_Plugin::gutenblock_render_field_select( $atts, $content );
	}

	/**
	 * Render the consent field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_consent
	 * @param string $atts consent attributes.
	 * @param string $content html content.
	 */
	public static function gutenblock_render_field_consent( $atts, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::gutenblock_render_field_consent' );

		return Contact_Form_Plugin::gutenblock_render_field_consent( $atts, $content );
	}

	/**
	 * Add the 'Form Responses' menu item as a submenu of Feedback.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->admin_menu
	 */
	public function admin_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->admin_menu' );

		return self::$instance->admin_menu();
	}

	/**
	 * Add to REST API post type allowed list.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->allow_feedback_rest_api_type
	 * @param array $post_types - the post types.
	 */
	public function allow_feedback_rest_api_type( $post_types ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->allow_feedback_rest_api_type' );

		return self::$instance->allow_feedback_rest_api_type( $post_types );
	}

	/**
	 * Display the count of new feedback entries received. It's reset when user visits the Feedback screen.
	 *
	 * @since 4.1.0
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->unread_count
	 * @param object $screen Information about the current screen.
	 */
	public function unread_count( $screen ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->unread_count' );

		return self::$instance->unread_count( $screen );
	}

	/**
	 * Handles all contact-form POST submissions
	 *
	 * Conditionally attached to `template_redirect`
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->process_form_submission
	 */
	public function process_form_submission() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->process_form_submission' );

		return self::$instance->process_form_submission();
	}

	/**
	 * Handle the ajax request.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->ajax_request
	 */
	public function ajax_request() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->ajax_request' );

		return self::$instance->ajax_request();
	}

	/**
	 * Ensure the post author is always zero for contact-form feedbacks
	 * Attached to `wp_insert_post_data`
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->insert_feedback_filter
	 * @see Grunion_Contact_Form::process_submission()
	 * @param array $data the data to insert.
	 * @param array $postarr the data sent to wp_insert_post().
	 * @return array The filtered $data to insert.
	 */
	public function insert_feedback_filter( $data, $postarr ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->insert_feedback_filter' );

		return self::$instance->insert_feedback_filter( $data, $postarr );
	}

	/**
	 * Adds our contact-form shortcode
	 * The "child" contact-field shortcode is enabled as needed by the contact-form shortcode handler
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->add_shortcode
	 */
	public function add_shortcode() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->add_shortcode' );

		return self::$instance->add_shortcode();
	}

	/**
	 * Tokenize the label.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->tokenize_label
	 * @param string $label - the label.
	 * @return string
	 */
	public static function tokenize_label( $label ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->tokenize_label' );

		return Contact_Form_Plugin::tokenize_label( $label );
	}

	/**
	 * Sanitize the value.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->sanitize_value
	 * @param string $value - the value to sanitize.
	 * @return string
	 */
	public static function sanitize_value( $value ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->sanitize_value' );

		return Contact_Form_Plugin::sanitize_value( $value );
	}

	/**
	 * Replaces tokens like {city} or {City} (case insensitive) with the value
	 * of an input field of that name
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->replace_tokens_with_input
	 * @param string $subject - the subject.
	 * @param array  $field_values Array with field label => field value associations.
	 * @return string The filtered $subject with the tokens replaced.
	 */
	public function replace_tokens_with_input( $subject, $field_values ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->replace_tokens_with_input' );

		return self::$instance->replace_tokens_with_input( $subject, $field_values );
	}

	/**
	 * Tracks the widget currently being processed.
	 * Attached to `dynamic_sidebar`
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->track_current_widget
	 * @see $current_widget_id - the current widget ID.
	 * @param array $widget The widget data.
	 */
	public function track_current_widget( $widget ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->track_current_widget' );

		return self::$instance->track_current_widget( $widget );
	}

	/**
	 * Adds a "widget" attribute to every contact-form embedded in a text widget.
	 * Used to tell the difference between post-embedded contact-forms and widget-embedded contact-forms
	 * Attached to `widget_text`
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->widget_atts
	 * @param string $text The widget text.
	 * @return string The filtered widget text.
	 */
	public function widget_atts( $text ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->widget_atts' );

		return self::$instance->widget_atts( $text );
	}

	/**
	 * For sites where text widgets are not processed for shortcodes, we add this hack to process just our shortcode
	 * Attached to `widget_text`
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->widget_shortcode_hack
	 * @param string $text The widget text.
	 * @return string The contact-form filtered widget text
	 */
	public function widget_shortcode_hack( $text ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->widget_shortcode_hack' );

		return self::$instance->widget_shortcode_hack( $text );
	}

	/**
	 * Check if a submission matches the Comment Blocklist.
	 * The Comment Blocklist is a means to moderate discussion, and contact
	 * forms are 1:1 discussion forums, ripe for abuse by users who are being
	 * removed from the public discussion.
	 * Attached to `jetpack_contact_form_is_spam`
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->is_spam_blocklist
	 * @param bool  $is_spam - if the submission is spam.
	 * @param array $form - the form data.
	 * @return bool TRUE => spam, FALSE => not spam
	 */
	public function is_spam_blocklist( $is_spam, $form = array() ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->is_spam_blocklist' );

		return self::$instance->is_spam_blocklist( $is_spam, $form );
	}

	/**
	 * Check if a submission matches the comment disallowed list.
	 * Attached to `jetpack_contact_form_in_comment_disallowed_list`.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->is_in_disallowed_list
	 * @param boolean $in_disallowed_list Whether the feedback is in the disallowed list.
	 * @param array   $form The form array.
	 * @return bool Returns true if the form submission matches the disallowed list and false if it doesn't.
	 */
	public function is_in_disallowed_list( $in_disallowed_list, $form = array() ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->is_in_disallowed_list' );

		return self::$instance->is_in_disallowed_list( $in_disallowed_list, $form );
	}

	/**
	 * Populate an array with all values necessary to submit a NEW contact-form feedback to Akismet.
	 * Note that this includes the current user_ip etc, so this should only be called when accepting a new item via $_POST
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->prepare_for_akismet
	 * @param array $form - contact form feedback array.
	 * @return array feedback array with additional data ready for submission to Akismet.
	 */
	public function prepare_for_akismet( $form ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->prepare_for_akismet' );

		return self::$instance->prepare_for_akismet( $form );
	}

	/**
	 * Submit contact-form data to Akismet to check for spam.
	 * If you're accepting a new item via $_POST, run it Grunion_Contact_Form_Plugin::prepare_for_akismet() first
	 * Attached to `jetpack_contact_form_is_spam`
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->is_spam_akismet
	 * @param bool  $is_spam - if the submission is spam.
	 * @param array $form - the form data.
	 * @return bool|WP_Error TRUE => spam, FALSE => not spam, WP_Error => stop processing entirely
	 */
	public function is_spam_akismet( $is_spam, $form = array() ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->is_spam_akismet' );

		return self::$instance->is_spam_akismet( $is_spam, $form );
	}

	/**
	 * Submit a feedback as either spam or ham
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->akismet_submit
	 * @param string $as - Either 'spam' or 'ham'.
	 * @param array  $form - the contact-form data.
	 * @return bool|string
	 */
	public function akismet_submit( $as, $form ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->akismet_submit' );

		return self::$instance->akismet_submit( $as, $form );
	}

	/**
	 * Prints a dropdown of posts with forms.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::form_posts_dropdown
	 * @param int $selected_id Currently selected post ID.
	 * @return void
	 */
	public static function form_posts_dropdown( $selected_id ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::form_posts_dropdown' );

		Contact_Form_Plugin::form_posts_dropdown( $selected_id );
	}

	/**
	 * Fetch post content for a post and extract just the comment.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_post_content_for_csv_export
	 * @param int $post_id The post id to fetch the content for.
	 * @return string Trimmed post comment.
	 *
	 * @codeCoverageIgnore
	 */
	public function get_post_content_for_csv_export( $post_id ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_post_content_for_csv_export' );

		return self::$instance->get_post_content_for_csv_export( $post_id );
	}

	/**
	 * Get `_feedback_extra_fields` field from post meta data.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_post_meta_for_csv_export
	 * @param int $post_id Id of the post to fetch meta data for.
	 * @return mixed
	 */
	public function get_post_meta_for_csv_export( $post_id ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_post_meta_for_csv_export' );

		return self::$instance->get_post_meta_for_csv_export( $post_id );
	}

	/**
	 * Get parsed feedback post fields.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_parsed_field_contents_of_post
	 * @param int $post_id Id of the post to fetch parsed contents for.
	 * @return array
	 *
	 * @codeCoverageIgnore - No need to be covered.
	 */
	public function get_parsed_field_contents_of_post( $post_id ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_parsed_field_contents_of_post' );

		return self::$instance->get_parsed_field_contents_of_post( $post_id );
	}

	/**
	 * Properly maps fields that are missing from the post meta data
	 * to names, that are similar to those of the post meta.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->map_parsed_field_contents_of_post_to_field_names
	 * @param array $parsed_post_content Parsed post content.
	 * @see parse_fields_from_content for how the input data is generated.
	 * @return array Mapped fields.
	 */
	public function map_parsed_field_contents_of_post_to_field_names( $parsed_post_content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->map_parsed_field_contents_of_post_to_field_names' );

		return self::$instance->map_parsed_field_contents_of_post_to_field_names( $parsed_post_content );
	}

	/**
	 * Registers the personal data exporter.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->register_personal_data_exporter
	 * @since 6.1.1
	 * @param  array $exporters An array of personal data exporters.
	 * @return array $exporters An array of personal data exporters.
	 */
	public function register_personal_data_exporter( $exporters ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->register_personal_data_exporter' );

		return self::$instance->register_personal_data_exporter( $exporters );
	}

	/**
	 * Registers the personal data eraser.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->register_personal_data_eraser
	 * @since 6.1.1
	 * @param  array $erasers An array of personal data erasers.
	 * @return array $erasers An array of personal data erasers.
	 */
	public function register_personal_data_eraser( $erasers ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->register_personal_data_eraser' );

		return self::$instance->register_personal_data_eraser( $erasers );
	}

	/**
	 * Exports personal data.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->personal_data_exporter
	 * @since 6.1.1
	 * @param  string $email  Email address.
	 * @param  int    $page   Page to export.
	 * @return array  $return Associative array with keys expected by core.
	 */
	public function personal_data_exporter( $email, $page = 1 ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->personal_data_exporter' );

		return self::$instance->personal_data_exporter( $email, $page );
	}

	/**
	 * Internal method for exporting personal data.
	 *
	 * Allows us to have a different signature than core expects
	 * while protecting against future core API changes.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->internal_personal_data_exporter
	 * @internal
	 * @since 6.5
	 * @param  string $email    Email address.
	 * @param  int    $page     Page to export.
	 * @param  int    $per_page Number of feedbacks to process per page. Internal use only (testing).
	 * @return array            Associative array with keys expected by core.
	 */
	public function internal_personal_data_exporter( $email, $page = 1, $per_page = 250 ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->internal_personal_data_exporter' );

		return self::$instance->internal_personal_data_exporter( $email, $page, $per_page );
	}

	/**
	 * Erases personal data.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->personal_data_eraser
	 * @since 6.1.1
	 * @param  string $email Email address.
	 * @param  int    $page  Page to erase.
	 * @return array         Associative array with keys expected by core.
	 */
	public function personal_data_eraser( $email, $page = 1 ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->personal_data_eraser' );

		return self::$instance->personal_data_eraser( $email, $page );
	}

	/**
	 * Internal method for erasing personal data.
	 *
	 * Allows us to have a different signature than core expects
	 * while protecting against future core API changes.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->_internal_personal_data_eraser
	 * @internal
	 * @since 6.5
	 * @param  string $email    Email address.
	 * @param  int    $page     Page to erase.
	 * @param  int    $per_page Number of feedbacks to process per page. Internal use only (testing).
	 * @return array            Associative array with keys expected by core.
	 */
	public function _internal_personal_data_eraser( $email, $page = 1, $per_page = 250 ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore -- this is called in other files.
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->_internal_personal_data_eraser' );

		return self::$instance->_internal_personal_data_eraser( $email, $page, $per_page );
	}

	/**
	 * Queries personal data by email address.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->personal_data_post_ids_by_email
	 * @since 6.1.1
	 * @param  string $email        Email address.
	 * @param  int    $per_page     Post IDs per page. Default is `250`.
	 * @param  int    $page         Page to query. Default is `1`.
	 * @param  int    $last_post_id Page to query. Default is `0`. If non-zero, used instead of $page.
	 * @return array An array of post IDs.
	 */
	public function personal_data_post_ids_by_email( $email, $per_page = 250, $page = 1, $last_post_id = 0 ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->personal_data_post_ids_by_email' );

		return self::$instance->personal_data_post_ids_by_email( $email, $per_page, $page, $last_post_id );
	}

	/**
	 * Filters searches by email address.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->personal_data_search_filter
	 * @since 6.1.1
	 * @param  string $search SQL where clause.
	 * @return array          Filtered SQL where clause.
	 */
	public function personal_data_search_filter( $search ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->personal_data_search_filter' );

		return self::$instance->personal_data_search_filter( $search );
	}

	/**
	 * Prepares feedback post data for CSV export.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_export_data_for_posts
	 * @param array $post_ids Post IDs to fetch the data for. These need to be Feedback posts.
	 * @return array
	 */
	public function get_export_data_for_posts( $post_ids ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_export_data_for_posts' );

		return self::$instance->get_export_data_for_posts( $post_ids );
	}

	/**
	 * Returns an array of [prefixed column name] => [translated column name], used on export.
	 * Prefix indicates the position in which the column will be rendered:
	 * - Negative numbers render BEFORE any form field/value column: -5, -3, -1...
	 * - Positive values render AFTER any form field/value column: 1, 30, 93...
	 *   Mind using high numbering on these ones as the prefix is used on regular inputs: 1_Name, 2_Email, etc
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_well_known_column_names
	 * @return array
	 */
	public function get_well_known_column_names() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_well_known_column_names' );

		return self::$instance->get_well_known_column_names();
	}

	/**
	 * Extracts feedback entries based on POST data.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_feedback_entries_from_post
	 */
	public function get_feedback_entries_from_post() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_feedback_entries_from_post' );

		return self::$instance->get_feedback_entries_from_post();
	}

	/**
	 * Download exported data as CSV
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->download_feedback_as_csv
	 */
	public function download_feedback_as_csv() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->download_feedback_as_csv' );

		return self::$instance->download_feedback_as_csv();
	}

	/**
	 * Send an event to Tracks
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->record_tracks_event
	 * @param string $event_name - the name of the event.
	 * @param array  $event_props - event properties to send.
	 * @return null|void
	 */
	public function record_tracks_event( $event_name, $event_props ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->record_tracks_event' );

		return self::$instance->record_tracks_event( $event_name, $event_props );
	}

	/**
	 * Escape a string to be used in a CSV context
	 *
	 * Malicious input can inject formulas into CSV files, opening up the possibility for phishing attacks and
	 * disclosure of sensitive information.
	 *
	 * Additionally, Excel exposes the ability to launch arbitrary commands through the DDE protocol.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->esc_csv
	 * @see https://www.contextis.com/en/blog/comma-separated-vulnerabilities
	 * @param string $field - the CSV field.
	 * @return string
	 */
	public function esc_csv( $field ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->esc_csv' );

		return self::$instance->esc_csv( $field );
	}

	/**
	 * Parse the contact form fields.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->parse_fields_from_content
	 * @param int $post_id - the post ID.
	 * @return array Fields.
	 */
	public static function parse_fields_from_content( $post_id ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->parse_fields_from_content' );

		return Contact_Form_Plugin::parse_fields_from_content( $post_id );
	}

	/**
	 * Get the IP address.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_ip_address
	 * @return string|null IP address.
	 */
	public static function get_ip_address() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->get_ip_address' );

		return Contact_Form_Plugin::get_ip_address();
	}

	/**
	 * Disable Block Editor for feedbacks.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->use_block_editor_for_post_type
	 * @param bool   $can_edit Whether the post type can be edited or not.
	 * @param string $post_type The post type being checked.
	 * @return bool
	 */
	public function use_block_editor_for_post_type( $can_edit, $post_type ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin->use_block_editor_for_post_type' );

		return self::$instance->use_block_editor_for_post_type( $can_edit, $post_type );
	}

	/**
	 * Kludge method: reverses the output of a standard print_r( $array ).
	 * Sort of what unserialize does to a serialized object.
	 * This is here while we work on a better data storage inside the posts. See:
	 * - p1675781140892129-slack-C01CSBEN0QZ
	 * - https://www.php.net/manual/en/function.print-r.php#93529
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::reverse_that_print
	 * @param string $print_r_output The array string to be reverted. Needs to being with 'Array'.
	 * @param bool   $parse_html Whether to run html_entity_decode on each line.
	 *                           As strings are stored right now, they are all escaped, so '=>' are '&gt;'.
	 * @return array|string Array when succesfully reconstructed, string otherwise. Output will always be esc_html'd.
	 */
	public static function reverse_that_print( $print_r_output, $parse_html = false ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::reverse_that_print' );

		return Contact_Form_Plugin::reverse_that_print( $print_r_output, $parse_html );
	}
}

/**
 * Generic shortcode class.
 * Does nothing other than store structured data and output the shortcode as a string
 *
 * Not very general - specific to Grunion.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode
 *
 * // phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */
class Crunion_Contact_Form_Shortcode {
	/**
	 * The name of the shortcode: [$shortcode_name /].
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode
	 * @var string
	 */
	private $shortcode_name;

	/**
	 * Key => value pairs for the shortcode's attributes: [$shortcode_name key="value" ... /]
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode
	 * @var array
	 */
	private $attributes;

	/**
	 * Key => value pair for attribute defaults.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode
	 * @var array
	 */
	private $defaults = array();

	/**
	 * The inner content of otherwise: [$shortcode_name]$content[/$shortcode_name]. Null for selfclosing shortcodes.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode
	 * @var null|string
	 */
	private $content;

	/**
	 * Associative array of inner "child" shortcodes equivalent to the $content: [$shortcode_name][child 1/][child 2/][/$shortcode_name]
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode
	 * @var array
	 */
	private $fields;

	/**
	 * The HTML of the parsed inner "child" shortcodes".  Null for selfclosing shortcodes.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode
	 * @var null|string
	 */
	private $body;

	/**
	 * We're using object composition to call code from the `forms` package.
	 * This holds the reference to the Contact_Form_Shortcode instance.
	 *
	 * @var Contact_Form_Shortcode
	 */
	private $shortcode;

	/**
	 * Constructor function.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->__construct
	 * @param array       $attributes An associative array of shortcode attributes.  @see shortcode_atts().
	 * @param null|string $content Null for selfclosing shortcodes.  The inner content otherwise.
	 */
	public function __construct( $attributes, $content = null ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->__construct' );

		$this->shortcode = new Contact_Form_Shortcode( $attributes, $content );
	}

	/**
	 * Set properties on the Contact_Form_Shortcode instance.
	 *
	 * @param string $name Name of the property.
	 * @param mixed  $value Value of the property.
	 */
	public function __set( $name, $value ) {
		$this->shortcode->{ $name } = $value;
	}

	/**
	 * Get properties from the Contact_Form_Shortcode instance.
	 *
	 * @param string $name Name of the property.
	 * @return mixed
	 */
	public function __get( $name ) {
		return $this->shortcode->{ $name };
	}

	/**
	 * Processes the shortcode's inner content for "child" shortcodes.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->parse_content
	 * @param string $content The shortcode's inner content: [shortcode]$content[/shortcode].
	 */
	public function parse_content( $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->parse_content' );

		return $this->shortcode->parse_content( $content );
	}

	/**
	 * Returns the value of the requested attribute.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->get_attribute
	 * @param string $key The attribute to retrieve.
	 * @return mixed
	 */
	public function get_attribute( $key ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->get_attribute' );

		return $this->shortcode->get_attribute( $key );
	}

	/**
	 * Escape attributes.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->esc_attr
	 * @param array $value - the value we're escaping.
	 * @return array
	 */
	public function esc_attr( $value ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->esc_attr' );

		return $this->shortcode->esc_attr( $value );
	}

	/**
	 * Unescape attributes.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->unesc_attr
	 * @param array $value - the value we're escaping.
	 * @return array
	 */
	public function unesc_attr( $value ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->unesc_attr' );

		return $this->shortcode->unesc_attr( $value );
	}

	/**
	 * Generates the shortcode
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->__toString
	 */
	public function __toString() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Shortcode->__toString' );

		return $this->shortcode->__toString();
	}
}

/**
 * Class for the contact-form shortcode.
 * Parses shortcode to output the contact form as HTML
 * Sends email and stores the contact form response (a.k.a. "feedback")
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form
 */
class Grunion_Contact_Form extends Crunion_Contact_Form_Shortcode {

	/**
	 * The shortcode name.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form
	 * @var string
	 */
	private $shortcode_name = 'contact-form';

	/**
	 *
	 * Stores form submission errors.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form
	 * @var WP_Error
	 */
	private $errors;

	/**
	 * The SHA1 hash of the attributes that comprise the form.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form
	 * @var string
	 */
	private $hash;

	/**
	 * The most recent (inclusive) contact-form shortcode processed.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form
	 * @var Grunion_Contact_Form
	 */
	private static $last;

	/**
	 * Form we are currently looking at. If processed, will become $last
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form
	 * @var Whatever
	 */
	private static $current_form;

	/**
	 * All found forms, indexed by hash.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form
	 * @var array
	 */
	private static $forms = array();

	/**
	 * Whether to print the grunion.css style when processing the contact-form shortcode
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form
	 * @var bool
	 */
	private static $style = false;

	/**
	 * When printing the submit button, what tags are allowed
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form
	 * @var array
	 */
	private static $allowed_html_tags_for_submit_button = array( 'br' => array() );

	/**
	 * We're using object composition to call code from the `forms` package.
	 * This holds the reference to the Contact_Form instance.
	 *
	 * @var Contact_Form
	 */
	private $form;

	/**
	 * Construction function.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form->__construct
	 * @param array  $attributes - the attributes.
	 * @param string $content - the content.
	 */
	public function __construct( $attributes, $content = null ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form->__construct' );

		$this->form = new Contact_Form( $attributes, $content );
	}

	/**
	 * Set properties on the Contact_Form instance.
	 *
	 * @param string $name Name of the property.
	 * @param mixed  $value Value of the property.
	 */
	public function __set( $name, $value ) {
		$this->form->{ $name } = $value;
	}

	/**
	 * Get properties from the Contact_Form instance.
	 *
	 * @param string $name Name of the property.
	 * @return mixed
	 */
	public function __get( $name ) {
		return $this->form->{ $name };
	}

	/**
	 * Store shortcode content for recall later
	 *  - used to receate shortcode when user uses do_shortcode
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::store_shortcode
	 * @param string $content - the content.
	 * @param array  $attributes - the attributes.
	 * @param string $hash - the hash.
	 */
	public static function store_shortcode( $content = null, $attributes = null, $hash = null ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::store_shortcode' );

		return Contact_Form::store_shortcode( $content, $attributes, $hash );
	}

	/**
	 * Toggle for printing the grunion.css stylesheet
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::style
	 * @param bool $style - the CSS style.
	 * @return bool
	 */
	public static function style( $style ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::style' );

		return Contact_Form::style( $style );
	}

	/**
	 * Turn on printing of grunion.css stylesheet
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::style_on
	 * @see ::style()
	 * @internal
	 * @return bool
	 */
	public static function style_on() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::style_on' );

		return Contact_Form::style_on();
	}

	/**
	 * The contact-form shortcode processor
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::parse
	 * @param array       $attributes Key => Value pairs as parsed by shortcode_parse_atts().
	 * @param string|null $content The shortcode's inner content: [contact-form]$content[/contact-form].
	 * @return string HTML for the concat form.
	 */
	public static function parse( $attributes, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::parse' );

		return Contact_Form::parse( $attributes, $content );
	}

	/**
	 * Returns a success message to be returned if the form is sent via AJAX.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::success_message
	 * @param int                         $feedback_id - the feedback ID.
	 * @param object Grunion_Contact_Form $form - the contact form.
	 * @return string $message
	 */
	public static function success_message( $feedback_id, $form ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::success_message' );

		return Contact_Form::success_message( $feedback_id, $form );
	}

	/**
	 * Returns a script that disables the contact form button after a form submission.
	 *
	 * @return string The script.
	 */
	private static function get_script_for_form() {
		return "<script>
			( function () {
				const contact_forms = document.getElementsByClassName('contact-form');

				for ( const form of contact_forms ) {
					form.onsubmit = function() {
						const buttons = form.getElementsByTagName('button');

						for( const button of buttons ) {
							button.setAttribute('disabled', true);
						}
					}
				}
			} )();
		</script>";
	}

	/**
	 * Returns a compiled form with labels and values in a form of  an array
	 * of lines.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::get_compiled_form
	 * @param int                         $feedback_id - the feedback ID.
	 * @param object Grunion_Contact_Form $form - the form.
	 * @return array $lines
	 */
	public static function get_compiled_form( $feedback_id, $form ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::get_compiled_form' );

		return Contact_Form::get_compiled_form( $feedback_id, $form );
	}

	/**
	 * Returns a compiled form with labels and values formatted for the email response
	 * in a form of an array of lines.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::get_compiled_form_for_email
	 * @param int                         $feedback_id - the feedback ID.
	 * @param object Grunion_Contact_Form $form - the form.
	 * @return array $lines
	 */
	public static function get_compiled_form_for_email( $feedback_id, $form ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::get_compiled_form_for_email' );

		return Contact_Form::get_compiled_form_for_email( $feedback_id, $form );
	}

	/**
	 * Escape and sanitize the field value.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::escape_and_sanitize_field_value
	 * @param string $value - the value we're escaping and sanitizing.
	 * @return string
	 */
	public static function escape_and_sanitize_field_value( $value ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::escape_and_sanitize_field_value' );

		return Contact_Form::escape_and_sanitize_field_value( $value );
	}

	/**
	 * Only strip out empty string values and keep all the other values as they are.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::remove_empty
	 * @param string $single_value - the single value.
	 * @return bool
	 */
	public static function remove_empty( $single_value ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::remove_empty' );

		return Contact_Form::remove_empty( $single_value );
	}

	/**
	 * Escape a shortcode value.
	 *
	 * Shortcode attribute values have a number of unfortunate restrictions, which fortunately we
	 * can get around by adding some extra HTML encoding.
	 *
	 * The output HTML will have a few extra escapes, but that makes no functional difference.
	 *
	 * @since 9.1.0
	 * @param string $val Value to escape.
	 * @return string
	 */
	private static function esc_shortcode_val( $val ) {
		return Contact_Form::esc_shortcode_val( $val );
	}

	/**
	 * The contact-field shortcode processor.
	 * We use an object method here instead of a static Grunion_Contact_Form_Field class method to parse contact-field shortcodes so that we can tie them to the contact-form object.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::parse_contact_field
	 * @param array       $attributes Key => Value pairs as parsed by shortcode_parse_atts().
	 * @param string|null $content The shortcode's inner content: [contact-field]$content[/contact-field].
	 * @return string HTML for the contact form field
	 */
	public static function parse_contact_field( $attributes, $content ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::parse_contact_field' );

		return Contact_Form::parse_contact_field( $attributes, $content );
	}

	/**
	 * Get the default label from type.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::get_default_label_from_type
	 * @param string $type - the type of label.
	 * @return string
	 */
	public static function get_default_label_from_type( $type ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::get_default_label_from_type' );

		return Contact_Form::get_default_label_from_type( $type );
	}

	/**
	 * Loops through $this->fields to generate a (structured) list of field IDs.
	 *
	 * Important: Currently the allowed fields are defined as follows:
	 *  `name`, `email`, `url`, `subject`, `textarea`
	 *
	 * If you need to add new fields to the Contact Form, please don't add them
	 * to the allowed fields and leave them as extra fields.
	 *
	 * The reasoning behind this is that both the admin Feedback view and the CSV
	 * export will not include any fields that are added to the list of
	 * allowed fields without taking proper care to add them to all the
	 * other places where they accessed/used/saved.
	 *
	 * The safest way to add new fields is to add them to the dropdown and the
	 * HTML list ( @see Grunion_Contact_Form_Field::render ) and don't add them
	 * to the list of allowed fields. This way they will become a part of the
	 * `extra fields` which are saved in the post meta and will be properly
	 * handled by the admin Feedback view and the CSV Export without any extra
	 * work.
	 *
	 * If there is need to add a field to the allowed fields, then please
	 * take proper care to add logic to handle the field in the following places:
	 *
	 *  - Below in the switch statement - so the field is recognized as allowed.
	 *
	 *  - Grunion_Contact_Form::process_submission - validation and logic.
	 *
	 *  - Grunion_Contact_Form::process_submission - add the field as an additional
	 *      field in the `post_content` when saving the feedback content.
	 *
	 *  - Grunion_Contact_Form_Plugin::parse_fields_from_content - add mapping
	 *      for the field, defined in the above method.
	 *
	 *  - Grunion_Contact_Form_Plugin::map_parsed_field_contents_of_post_to_field_names -
	 *      add mapping of the field for the CSV Export. Otherwise it will be missing
	 *      from the exported data.
	 *
	 *  - admin.php / grunion_manage_post_columns - add the field to the render logic.
	 *      Otherwise it will be missing from the admin Feedback view.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form->get_field_ids
	 * @return array
	 */
	public function get_field_ids() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form->get_field_ids' );

		return $this->form->get_field_ids();
	}

	/**
	 * Process the contact form's POST submission
	 * Stores feedback.  Sends email.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form->process_submission
	 */
	public function process_submission() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form->process_submission' );

		return $this->form->process_submission();
	}

	/**
	 * Wrapper for wp_mail() that enables HTML messages with text alternatives
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::wp_mail
	 * @param string|array $to          Array or comma-separated list of email addresses to send message.
	 * @param string       $subject     Email subject.
	 * @param string       $message     Message contents.
	 * @param string|array $headers     Optional. Additional headers.
	 * @param string|array $attachments Optional. Files to attach.
	 * @return bool Whether the email contents were sent successfully.
	 */
	public static function wp_mail( $to, $subject, $message, $headers = '', $attachments = array() ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::wp_mail' );

		return Contact_Form::wp_mail( $to, $subject, $message, $headers, $attachments );
	}

	/**
	 * Add a display name part to an email address
	 *
	 * SpamAssassin doesn't like addresses in HTML messages that are missing display names (e.g., `foo@bar.org`
	 * instead of `Foo Bar <foo@bar.org>`.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form->add_name_to_address
	 * @param string $address - the email address.
	 * @return string
	 */
	public function add_name_to_address( $address ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form->add_name_to_address' );

		return $this->form->add_name_to_address( $address );
	}

	/**
	 * Get the content type that should be assigned to outbound emails
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::get_mail_content_type
	 * @return string
	 */
	public static function get_mail_content_type() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::get_mail_content_type' );

		return Contact_Form::get_mail_content_type();
	}

	/**
	 * Wrap a message body with the appropriate in HTML tags
	 *
	 * This helps to ensure correct parsing by clients, and also helps avoid triggering spam filtering rules
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::wrap_message_in_html_tags
	 * @param string $title - title of the email.
	 * @param string $body - the message body.
	 * @param string $footer - the footer containing meta information.
	 * @return string
	 */
	public static function wrap_message_in_html_tags( $title, $body, $footer ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::wrap_message_in_html_tags' );

		return Contact_Form::wrap_message_in_html_tags( $title, $body, $footer );
	}

	/**
	 * Add a plain-text alternative part to an outbound email
	 *
	 * This makes the message more accessible to mail clients that aren't HTML-aware, and decreases the likelihood
	 * that the message will be flagged as spam.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form::add_plain_text_alternative
	 * @param PHPMailer $phpmailer - the phpmailer.
	 */
	public static function add_plain_text_alternative( $phpmailer ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form::add_plain_text_alternative' );

		return Contact_Form::add_plain_text_alternative( $phpmailer );
	}

	/**
	 * Add deepslashes.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Block->addslashes_deep
	 * @param array $value - the value.
	 * @return array The value, with slashes added.
	 */
	public function addslashes_deep( $value ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Block->addslashes_deep' );

		return $this->form->addslashes_deep( $value );
	}

	/**
	 * Rough implementation of Gutenberg's align-attribute-to-css-class map.
	 * Only allowin "wide" and "full" as "center", "left" and "right" don't
	 * make much sense for the form.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Block::get_block_alignment_class
	 * @param array $attributes Block attributes.
	 * @return string The CSS alignment class: alignfull | alignwide.
	 */
	public static function get_block_alignment_class( $attributes = array() ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Block::get_block_alignment_class' );

		return Contact_Form::get_block_alignment_class( $attributes );
	}
} // end class Grunion_Contact_Form

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound -- how many times I have to disable this?
/**
 * Class for the contact-field shortcode.
 * Parses shortcode to output the contact form field as HTML.
 * Validates input.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
 */
class Grunion_Contact_Form_Field extends Crunion_Contact_Form_Shortcode {

	/**
	 * The shortcode name.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
	 * @var string
	 */
	public $shortcode_name = 'contact-field';

	/**
	 * The parent form.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
	 * @var Grunion_Contact_Form
	 */
	public $form;

	/**
	 * Default or POSTed value.
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
	 * @var string
	 */
	public $value;

	/**
	 * Is the input valid?
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
	 * @var bool
	 */
	public $error = false;

	/**
	 * Styles to be applied to the field
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
	 * @var string
	 */
	public $block_styles = '';

	/**
	 * Styles to be applied to the field
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
	 * @var string
	 */
	public $field_styles = '';

	/**
	 * Styles to be applied to the field option
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
	 * @var string
	 */
	public $option_styles = '';

	/**
	 * Styles to be applied to the field
	 *
	 * @deprecated 13.3 See Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
	 * @var string
	 */
	public $label_styles = '';

	/**
	 * Constructor function.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->__construct
	 * @param array                $attributes An associative array of shortcode attributes.  @see shortcode_atts().
	 * @param null|string          $content Null for selfclosing shortcodes.  The inner content otherwise.
	 * @param Grunion_Contact_Form $form The parent form.
	 */
	public function __construct( $attributes, $content = null, $form = null ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->__construct' );

		$attributes = shortcode_atts(
			array(
				'label'                  => null,
				'togglelabel'            => null,
				'type'                   => 'text',
				'required'               => false,
				'requiredtext'           => null,
				'options'                => array(),
				'id'                     => null,
				'style'                  => null,
				'fieldbackgroundcolor'   => null,
				'textcolor'              => null,
				'default'                => null,
				'values'                 => null,
				'placeholder'            => null,
				'class'                  => null,
				'width'                  => null,
				'consenttype'            => null,
				'implicitconsentmessage' => null,
				'explicitconsentmessage' => null,
				'borderradius'           => null,
				'borderwidth'            => null,
				'lineheight'             => null,
				'labellineheight'        => null,
				'bordercolor'            => null,
				'inputcolor'             => null,
				'labelcolor'             => null,
				'labelfontsize'          => null,
				'fieldfontsize'          => null,
			),
			$attributes,
			'contact-field'
		);

		// special default for subject field
		if ( 'subject' === $attributes['type'] && $attributes['default'] === null && $form !== null ) {
			$attributes['default'] = $form->get_attribute( 'subject' );
		}

		// allow required=1 or required=true
		if ( '1' === $attributes['required'] || 'true' === strtolower( $attributes['required'] ) ) {
			$attributes['required'] = true;
		} else {
			$attributes['required'] = false;
		}

		if ( $attributes['requiredtext'] === null ) {
			$attributes['requiredtext'] = __( '(required)', 'jetpack' );
		}

		// parse out comma-separated options list (for selects, radios, and checkbox-multiples)
		if ( ! empty( $attributes['options'] ) && is_string( $attributes['options'] ) ) {
			$attributes['options'] = array_map( 'trim', explode( ',', $attributes['options'] ) );

			if ( ! empty( $attributes['values'] ) && is_string( $attributes['values'] ) ) {
				$attributes['values'] = array_map( 'trim', explode( ',', $attributes['values'] ) );
			}
		}

		if ( $form ) {
			// make a unique field ID based on the label, with an incrementing number if needed to avoid clashes
			$form_id = $form->get_attribute( 'id' );
			$id      = isset( $attributes['id'] ) ? $attributes['id'] : false;

			$unescaped_label = $this->unesc_attr( $attributes['label'] );
			$unescaped_label = str_replace( '%', '-', $unescaped_label ); // jQuery doesn't like % in IDs?
			$unescaped_label = preg_replace( '/[^a-zA-Z0-9.-_:]/', '', $unescaped_label );

			if ( empty( $id ) ) {
				$id        = sanitize_title_with_dashes( 'g' . $form_id . '-' . $unescaped_label );
				$i         = 0;
				$max_tries = 99;
				while ( isset( $form->fields[ $id ] ) ) {
					++$i;
					$id = sanitize_title_with_dashes( 'g' . $form_id . '-' . $unescaped_label . '-' . $i );

					if ( $i > $max_tries ) {
						break;
					}
				}
			}

			$attributes['id'] = $id;
		}

		parent::__construct( $attributes, $content );

		// Store parent form
		$this->form = $form;
	}

	/**
	 * This field's input is invalid.  Flag as invalid and add an error to the parent form
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->add_error
	 * @param string $message The error message to display on the form.
	 */
	public function add_error( $message ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->add_error' );

		$this->is_error = true;

		if ( ! is_wp_error( $this->form->errors ) ) {
			$this->form->errors = new WP_Error();
		}

		$this->form->errors->add( $this->get_attribute( 'id' ), $message );
	}

	/**
	 * Is the field input invalid?
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->is_error
	 * @see $error
	 * @return bool
	 */
	public function is_error() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->is_error' );

		return $this->error;
	}

	/**
	 * Validates the form input
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->validate
	 */
	public function validate() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->validate' );

		// If it's not required, there's nothing to validate
		if ( ! $this->get_attribute( 'required' ) ) {
			return;
		}

		$field_id    = $this->get_attribute( 'id' );
		$field_type  = $this->maybe_override_type();
		$field_label = $this->get_attribute( 'label' );

		if ( isset( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
			if ( is_array( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
				$field_value = array_map( 'sanitize_text_field', wp_unslash( $_POST[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verification should happen in caller.
			} else {
				$field_value = sanitize_text_field( wp_unslash( $_POST[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verification should happen in caller.
			}
		} else {
			$field_value = '';
		}

		switch ( $field_type ) {
			case 'url':
				if ( ! is_string( $field_value ) || empty( $field_value ) || ! preg_match(
					'%^(?:(?:https?|ftp)://)?(?:\S+(?::\S*)?@|\d{1,3}(?:\.\d{1,3}){3}|(?:(?:[a-z\d\x{00a1}-\x{ffff}]+-?)*[a-z\d\x{00a1}-\x{ffff}]+)(?:\.(?:[a-z\d\x{00a1}-\x{ffff}]+-?)*[a-z\d\x{00a1}-\x{ffff}]+)*(?:\.[a-z\x{00a1}-\x{ffff}]{2,6}))(?::\d+)?(?:[^\s]*)?$%iu',
					$field_value
				) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s: Please enter a valid URL - https://www.example.com', 'jetpack' ), $field_label ) );
				}
				break;
			case 'email':
				// Make sure the email address is valid
				if ( ! is_string( $field_value ) || ! is_email( $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires a valid email address', 'jetpack' ), $field_label ) );
				}
				break;
			case 'checkbox-multiple':
				// Check that there is at least one option selected
				if ( empty( $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires at least one selection', 'jetpack' ), $field_label ) );
				}
				break;
			default:
				// Just check for presence of any text
				if ( ! is_string( $field_value ) || ! strlen( trim( $field_value ) ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s is required', 'jetpack' ), $field_label ) );
				}
		}
	}

	/**
	 * Check the default value for options field
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->get_option_value
	 * @param string $value - the value we're checking.
	 * @param int    $index - the index.
	 * @param string $options - default field option.
	 * @return string
	 */
	public function get_option_value( $value, $index, $options ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->get_option_value' );

		if ( empty( $value[ $index ] ) ) {
			return $options;
		}
		return $value[ $index ];
	}

	/**
	 * Outputs the HTML for this form field
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render
	 * @return string HTML
	 */
	public function render() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render' );

		global $current_user, $user_identity;

		$field_id            = $this->get_attribute( 'id' );
		$field_type          = $this->maybe_override_type();
		$field_label         = $this->get_attribute( 'label' );
		$field_required      = $this->get_attribute( 'required' );
		$field_required_text = $this->get_attribute( 'requiredtext' );
		$field_placeholder   = $this->get_attribute( 'placeholder' );
		$field_width         = $this->get_attribute( 'width' );
		$class               = 'date' === $field_type ? 'jp-contact-form-date' : $this->get_attribute( 'class' );

		if ( is_numeric( $this->get_attribute( 'borderradius' ) ) ) {
			$this->block_styles .= '--jetpack--contact-form--border-radius: ' . esc_attr( $this->get_attribute( 'borderradius' ) ) . 'px;';
			$this->field_styles .= 'border-radius: ' . (int) $this->get_attribute( 'borderradius' ) . 'px;';
		}
		if ( is_numeric( $this->get_attribute( 'borderwidth' ) ) ) {
			$this->block_styles .= '--jetpack--contact-form--border-size: ' . esc_attr( $this->get_attribute( 'borderwidth' ) ) . 'px;';
			$this->field_styles .= 'border-width: ' . (int) $this->get_attribute( 'borderwidth' ) . 'px;';
		}
		if ( is_numeric( $this->get_attribute( 'lineheight' ) ) ) {
			$this->block_styles  .= '--jetpack--contact-form--line-height: ' . esc_attr( $this->get_attribute( 'lineheight' ) ) . ';';
			$this->field_styles  .= 'line-height: ' . (int) $this->get_attribute( 'lineheight' ) . ';';
			$this->option_styles .= 'line-height: ' . (int) $this->get_attribute( 'lineheight' ) . ';';
		}
		if ( ! empty( $this->get_attribute( 'bordercolor' ) ) ) {
			$this->block_styles .= '--jetpack--contact-form--border-color: ' . esc_attr( $this->get_attribute( 'bordercolor' ) ) . ';';
			$this->field_styles .= 'border-color: ' . esc_attr( $this->get_attribute( 'bordercolor' ) ) . ';';
		}
		if ( ! empty( $this->get_attribute( 'inputcolor' ) ) ) {
			$this->block_styles  .= '--jetpack--contact-form--text-color: ' . esc_attr( $this->get_attribute( 'inputcolor' ) ) . ';';
			$this->field_styles  .= 'color: ' . esc_attr( $this->get_attribute( 'inputcolor' ) ) . ';';
			$this->option_styles .= 'color: ' . esc_attr( $this->get_attribute( 'inputcolor' ) ) . ';';
		}
		if ( ! empty( $this->get_attribute( 'fieldbackgroundcolor' ) ) ) {
			$this->block_styles .= '--jetpack--contact-form--input-background: ' . esc_attr( $this->get_attribute( 'fieldbackgroundcolor' ) ) . ';';
			$this->field_styles .= 'background-color: ' . esc_attr( $this->get_attribute( 'fieldbackgroundcolor' ) ) . ';';
		}
		if ( ! empty( $this->get_attribute( 'fieldfontsize' ) ) ) {
			$this->block_styles  .= '--jetpack--contact-form--font-size: ' . esc_attr( $this->get_attribute( 'fieldfontsize' ) ) . ';';
			$this->field_styles  .= 'font-size: ' . esc_attr( $this->get_attribute( 'fieldfontsize' ) ) . ';';
			$this->option_styles .= 'font-size: ' . esc_attr( $this->get_attribute( 'fieldfontsize' ) ) . ';';
		}

		if ( ! empty( $this->get_attribute( 'labelcolor' ) ) ) {
			$this->label_styles .= 'color: ' . esc_attr( $this->get_attribute( 'labelcolor' ) ) . ';';
		}
		if ( ! empty( $this->get_attribute( 'labelfontsize' ) ) ) {
			$this->label_styles .= 'font-size: ' . esc_attr( $this->get_attribute( 'labelfontsize' ) ) . ';';
		}
		if ( is_numeric( $this->get_attribute( 'labellineheight' ) ) ) {
			$this->label_styles .= 'line-height: ' . (int) $this->get_attribute( 'labellineheight' ) . ';';
		}

		if ( ! empty( $field_width ) ) {
			$class .= ' grunion-field-width-' . $field_width;
		}

		/**
		 * Filters the "class" attribute of the contact form input
		 *
		 * @module contact-form
		 *
		 * @since 6.6.0
		 *
		 * @param string $class Additional CSS classes for input class attribute.
		 */
		$field_class = apply_filters( 'jetpack_contact_form_input_class', $class );

		if ( isset( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
			if ( is_array( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
				$this->value = array_map( 'sanitize_textarea_field', wp_unslash( $_POST[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
			} else {
				$this->value = sanitize_textarea_field( wp_unslash( $_POST[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
			}
		} elseif ( isset( $_GET[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no site changes.
			$this->value = sanitize_textarea_field( wp_unslash( $_GET[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no site changes.
		} elseif (
			is_user_logged_in() &&
			( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ||
			/**
			 * Allow third-party tools to prefill the contact form with the user's details when they're logged in.
			 *
			 * @module contact-form
			 *
			 * @since 3.2.0
			 *
			 * @param bool false Should the Contact Form be prefilled with your details when you're logged in. Default to false.
			 */
			true === apply_filters( 'jetpack_auto_fill_logged_in_user', false )
			)
		) {
			// Special defaults for logged-in users
			switch ( $field_type ) {
				case 'email':
					$this->value = $current_user->data->user_email;
					break;
				case 'name':
					$this->value = $user_identity;
					break;
				case 'url':
					$this->value = $current_user->data->user_url;
					break;
				default:
					$this->value = $this->get_attribute( 'default' );
			}
		} else {
			$this->value = $this->get_attribute( 'default' );
		}

		$field_value = Grunion_Contact_Form_Plugin::strip_tags( $this->value );
		$field_label = Grunion_Contact_Form_Plugin::strip_tags( $field_label );

		$rendered_field = $this->render_field( $field_type, $field_id, $field_label, $field_value, $field_class, $field_placeholder, $field_required, $field_required_text );

		/**
		 * Filter the HTML of the Contact Form.
		 *
		 * @module contact-form
		 *
		 * @since 2.6.0
		 *
		 * @param string $rendered_field Contact Form HTML output.
		 * @param string $field_label Field label.
		 * @param int|null $id Post ID.
		 */
		return apply_filters( 'grunion_contact_form_field_html', $rendered_field, $field_label, ( in_the_loop() ? get_the_ID() : null ) );
	}

	/**
	 * Return the HTML for the label.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_label
	 * @param string $type - the field type.
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param array  $extra_attrs Array of key/value pairs to append as attributes to the element.
	 * @return string HTML
	 */
	public function render_label( $type, $id, $label, $required, $required_field_text, $extra_attrs = array() ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_label' );

		$form_style = $this->get_form_style();

		if ( ! empty( $form_style ) && $form_style !== 'default' ) {
			return '';
		}

		if ( ! empty( $this->label_styles ) ) {
			$extra_attrs['style'] = $this->label_styles;
		}

		$extra_attrs_string = '';
		if ( is_array( $extra_attrs ) && ! empty( $extra_attrs ) ) {
			foreach ( $extra_attrs as $attr => $val ) {
				$extra_attrs_string .= sprintf( '%s="%s" ', esc_attr( $attr ), esc_attr( $val ) );
			}
		}

		$type_class = $type ? ' ' . $type : '';
		return "<label
				for='" . esc_attr( $id ) . "'
				class='grunion-field-label{$type_class}" . ( $this->is_error() ? ' form-error' : '' ) . "'"
				. $extra_attrs_string . '
				>'
				. esc_html( $label )
				. ( $required ? '<span>' . $required_field_text . '</span>' : '' )
			. "</label>\n";
	}

	/**
	 * Return the HTML for the input field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_input_field
	 * @param string $type - the field type.
	 * @param int    $id - the ID.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param string $placeholder - the field placeholder content.
	 * @param bool   $required - if the field is marked as required.
	 * @param array  $extra_attrs Array of key/value pairs to append as attributes to the element.
	 * @return string HTML
	 */
	public function render_input_field( $type, $id, $value, $class, $placeholder, $required, $extra_attrs = array() ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_input_field' );

		$extra_attrs_string = '';

		if ( ! empty( $this->field_styles ) ) {
			$extra_attrs['style'] = $this->field_styles;
		}

		if ( is_array( $extra_attrs ) && ! empty( $extra_attrs ) ) {
			foreach ( $extra_attrs as $attr => $val ) {
				$extra_attrs_string .= sprintf( '%s="%s" ', esc_attr( $attr ), esc_attr( $val ) );
			}
		}
		return "<input
					type='" . esc_attr( $type ) . "'
					name='" . esc_attr( $id ) . "'
					id='" . esc_attr( $id ) . "'
					value='" . esc_attr( $value ) . "'
					" . $class . $placeholder . '
					' . ( $required ? "required aria-required='true'" : '' ) .
					$extra_attrs_string .
					" />\n";
	}

	/**
	 * Return the HTML for the email field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_email_field
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 * @return string HTML
	 */
	public function render_email_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_email_field' );

		$field  = $this->render_label( 'email', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'email', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	/**
	 * Return the HTML for the telephone field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_telephone_field
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 * @return string HTML
	 */
	public function render_telephone_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_telephone_field' );

		$field  = $this->render_label( 'telephone', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'tel', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	/**
	 * Return the HTML for the URL field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_url_field
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 * @return string HTML
	 */
	public function render_url_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_url_field' );

		$custom_validation_message = __( 'Please enter a valid URL - https://www.example.com', 'jetpack' );
		$validation_attrs          = array(
			'title'              => $custom_validation_message,
			'oninvalid'          => 'setCustomValidity("' . $custom_validation_message . '")',
			'oninput'            => 'setCustomValidity("")',
			'pattern'            => '(([:\/a-zA-Z0-9_\-]+)?(\.[a-zA-Z0-9_\-\/]+)+)',
			'data-type-override' => 'url',
		);

		$field  = $this->render_label( 'url', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'text', $id, $value, $class, $placeholder, $required, $validation_attrs );
		return $field;
	}

	/**
	 * Return the HTML for the text area field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_textarea_field
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 * @return string HTML
	 */
	public function render_textarea_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_textarea_field' );

		$field  = $this->render_label( 'textarea', 'contact-form-comment-' . $id, $label, $required, $required_field_text );
		$field .= "<textarea
		                style='" . $this->field_styles . "'
		                name='" . esc_attr( $id ) . "'
		                id='contact-form-comment-" . esc_attr( $id ) . "'
		                rows='20' "
						. $class
						. $placeholder
						. ' ' . ( $required ? "required aria-required='true'" : '' ) .
						'>' . esc_textarea( $value )
				. "</textarea>\n";
		return $field;
	}

	/**
	 * Return the HTML for the radio field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_radio_field
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @return string HTML
	 */
	public function render_radio_field( $id, $label, $value, $class, $required, $required_field_text ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_radio_field' );

		$field  = $this->render_label( '', $id, $label, $required, $required_field_text );
		$field .= '<div class="grunion-radio-options">';

		$field_style = 'style="' . $this->option_styles . '"';

		foreach ( (array) $this->get_attribute( 'options' ) as $option_index => $option ) {
			$option = Grunion_Contact_Form_Plugin::strip_tags( $option );
			if ( is_string( $option ) && $option !== '' ) {
				$field .= "\t\t<label {$field_style} class='grunion-radio-label radio" . ( $this->is_error() ? ' form-error' : '' ) . "'>";
				$field .= "<input
									type='radio'
									name='" . esc_attr( $id ) . "'
									value='" . esc_attr( $this->get_option_value( $this->get_attribute( 'values' ), $option_index, $option ) ) . "' "
									. $class
									. checked( $option, $value, false ) . ' '
									. ( $required ? "required aria-required='true'" : '' )
									. '/> ';
				$field .= esc_html( $option ) . "</label>\n";
			}
		}
		$field .= '</div>';
		return $field;
	}

	/**
	 * Return the HTML for the checkbox field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_checkbox_field
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @return string HTML
	 */
	public function render_checkbox_field( $id, $label, $value, $class, $required, $required_field_text ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_checkbox_field' );

		$field  = "<label class='grunion-field-label checkbox" . ( $this->is_error() ? ' form-error' : '' ) . "' style='" . $this->label_styles . "'>";
		$field .= "\t\t<input type='checkbox' name='" . esc_attr( $id ) . "' value='" . esc_attr__( 'Yes', 'jetpack' ) . "' " . $class . checked( (bool) $value, true, false ) . ' ' . ( $required ? "required aria-required='true'" : '' ) . "/> \n";
		$field .= "\t\t" . esc_html( $label ) . ( $required ? '<span>' . $required_field_text . '</span>' : '' );
		$field .= "</label>\n";
		$field .= "<div class='clear-form'></div>\n";
		return $field;
	}

	/**
	 * Return the HTML for the consent field.
	 *
	 * @param string $id field id.
	 * @param string $class html classes (can be set by the admin).
	 */
	private function render_consent_field( $id, $class ) {
		$consent_type    = 'explicit' === $this->get_attribute( 'consenttype' ) ? 'explicit' : 'implicit';
		$consent_message = 'explicit' === $consent_type ? $this->get_attribute( 'explicitconsentmessage' ) : $this->get_attribute( 'implicitconsentmessage' );

		$field = "<label class='grunion-field-label consent consent-" . $consent_type . "' style='" . $this->label_styles . "'>";

		if ( 'implicit' === $consent_type ) {
			$field .= "\t\t<input aria-hidden='true' type='checkbox' checked name='" . esc_attr( $id ) . "' value='" . esc_attr__( 'Yes', 'jetpack' ) . "' style='display:none;' /> \n";
		} else {
			$field .= "\t\t<input type='checkbox' name='" . esc_attr( $id ) . "' value='" . esc_attr__( 'Yes', 'jetpack' ) . "' " . $class . "/> \n";
		}
		$field .= "\t\t" . esc_html( $consent_message );
		$field .= "</label>\n";
		$field .= "<div class='clear-form'></div>\n";
		return $field;
	}

	/**
	 * Return the HTML for the multiple checkbox field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_checkbox_multiple_field
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @return string HTML
	 */
	public function render_checkbox_multiple_field( $id, $label, $value, $class, $required, $required_field_text ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_checkbox_multiple_field' );

		$field  = $this->render_label( '', $id, $label, $required, $required_field_text );
		$field .= '<div class="grunion-checkbox-multiple-options">';

		$field_style = 'style="' . $this->option_styles . '"';

		foreach ( (array) $this->get_attribute( 'options' ) as $option_index => $option ) {
			$option = Grunion_Contact_Form_Plugin::strip_tags( $option );
			if ( is_string( $option ) && $option !== '' ) {
				$field .= "\t\t<label {$field_style} class='grunion-checkbox-multiple-label checkbox-multiple " . ( $this->is_error() ? ' form-error' : '' ) . "'>";
				$field .= "<input type='checkbox' name='" . esc_attr( $id ) . "[]' value='" . esc_attr( $this->get_option_value( $this->get_attribute( 'values' ), $option_index, $option ) ) . "' " . $class . checked( in_array( $option, (array) $value, true ), true, false ) . ' /> ';
				$field .= esc_html( $option ) . "</label>\n";
			}
		}
		$field .= '</div>';

		return $field;
	}

	/**
	 * Return the HTML for the select field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_select_field
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @return string HTML
	 */
	public function render_select_field( $id, $label, $value, $class, $required, $required_field_text ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_select_field' );

		$field  = $this->render_label( 'select', $id, $label, $required, $required_field_text );
		$field .= "\t<select name='" . esc_attr( $id ) . "' id='" . esc_attr( $id ) . "' " . $class . ( $required ? "required aria-required='true'" : '' ) . ">\n";

		if ( $this->get_attribute( 'togglelabel' ) ) {
			$field .= "\t\t<option value=''>" . $this->get_attribute( 'togglelabel' ) . "</option>\n";
		}

		foreach ( (array) $this->get_attribute( 'options' ) as $option_index => $option ) {
			$option = Grunion_Contact_Form_Plugin::strip_tags( $option );
			if ( is_string( $option ) && $option !== '' ) {
				$field .= "\t\t<option"
								. selected( $option, $value, false )
								. " value='" . esc_attr( $this->get_option_value( $this->get_attribute( 'values' ), $option_index, $option ) )
								. "'>" . esc_html( $option )
								. "</option>\n";
			}
		}
		$field .= "\t</select>\n";

		wp_enqueue_style(
			'jquery-ui-selectmenu',
			plugins_url( 'css/jquery-ui-selectmenu.css', __FILE__ ),
			array(),
			'1.13.2'
		);

		wp_enqueue_script( 'jquery-ui-selectmenu' );

		wp_enqueue_script(
			'contact-form-dropdown',
			plugins_url( 'js/dropdown.js', __FILE__ ),
			array( 'jquery', 'jquery-ui-selectmenu' ),
			JETPACK__VERSION,
			true
		);

		return $field;
	}

	/**
	 * Return the HTML for the email field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_date_field
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 * @return string HTML
	 */
	public function render_date_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_date_field' );

		$field  = $this->render_label( 'date', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'text', $id, $value, $class, $placeholder, $required );

		/* For AMP requests, use amp-date-picker element: https://amp.dev/documentation/components/amp-date-picker */
		if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
			return sprintf(
				'<%1$s mode="overlay" layout="container" type="single" input-selector="[name=%2$s]">%3$s</%1$s>',
				'amp-date-picker',
				esc_attr( $id ),
				$field
			);
		}

		wp_enqueue_script(
			'grunion-frontend',
			Assets::get_file_url_for_environment(
				'_inc/build/contact-form/js/grunion-frontend.min.js',
				'modules/contact-form/js/grunion-frontend.js'
			),
			array( 'jquery', 'jquery-ui-datepicker' ),
			JETPACK__VERSION,
			false
		);
		wp_enqueue_style( 'jp-jquery-ui-datepicker', plugins_url( 'css/jquery-ui-datepicker.css', __FILE__ ), array( 'dashicons' ), '1.0' );

		// Using Core's built-in datepicker localization routine
		wp_localize_jquery_ui_datepicker();
		return $field;
	}

	/**
	 * Return the HTML for the default field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_default_field
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 * @param string $type - the type.
	 * @return string HTML
	 */
	public function render_default_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $type ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_default_field' );

		$field  = $this->render_label( $type, $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'text', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	/**
	 * Return the HTML for the outlined label.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_outline_label
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @return string HTML
	 */
	public function render_outline_label( $id, $label, $required, $required_field_text ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_outline_label' );

		return '
			<div class="notched-label">
				<div class="notched-label__leading"></div>
				<div class="notched-label__notch">
					<label
						for="' . esc_attr( $id ) . '"
						class="notched-label__label ' . ( $this->is_error() ? ' form-error' : '' ) . '"
						style="' . $this->label_styles . '"
					>'
						. esc_html( $label )
						. ( $required ? '<span>' . $required_field_text . '</span>' : '' ) .
					'</label>
				</div>
				<div class="notched-label__trailing"></div>
			</div>';
	}

	/**
	 * Return the HTML for the animated label.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_animated_label
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @return string HTML
	 */
	public function render_animated_label( $id, $label, $required, $required_field_text ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_animated_label' );

		return '
			<label
				for="' . esc_attr( $id ) . '"
				class="animated-label__label ' . ( $this->is_error() ? ' form-error' : '' ) . '"
				style="' . $this->label_styles . '"
			>'
				. esc_html( $label )
				. ( $required ? '<span>' . $required_field_text . '</span>' : '' ) .
			'</label>';
	}

	/**
	 * Return the HTML for the below label.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_below_label
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @return string HTML
	 */
	public function render_below_label( $id, $label, $required, $required_field_text ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_below_label' );

		return '
			<label
				for="' . esc_attr( $id ) . '"
				class="below-label__label ' . ( $this->is_error() ? ' form-error' : '' ) . '"
			>'
				. esc_html( $label )
				. ( $required ? '<span>' . $required_field_text . '</span>' : '' ) .
				'</label>';
	}

	/**
	 * Return the HTML for the email field.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_field
	 * @param string $type - the type.
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param string $placeholder - the field placeholder content.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text for a field marked as required.
	 * @return string HTML
	 */
	public function render_field( $type, $id, $label, $value, $class, $placeholder, $required, $required_field_text ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field->render_field' );

		$class .= ' grunion-field';

		if ( $type === 'select' ) {
			$class .= ' contact-form-dropdown';
		}

		$form_style = $this->get_form_style();
		if ( ! empty( $form_style ) && $form_style !== 'default' ) {
			if ( empty( $placeholder ) ) {
				$placeholder .= ' ';
			} else {
				$class .= ' has-placeholder';
			}
		}

		$field_placeholder = ( ! empty( $placeholder ) ) ? "placeholder='" . esc_attr( $placeholder ) . "'" : '';
		$field_class       = "class='" . trim( esc_attr( $type ) . ' ' . esc_attr( $class ) ) . "' ";
		$wrap_classes      = empty( $class ) ? '' : implode( '-wrap ', array_filter( explode( ' ', $class ) ) ) . '-wrap'; // this adds

		if ( $type === 'select' ) {
			$wrap_classes .= ' ui-front';
		}

		if ( empty( $label ) ) {
			$wrap_classes .= ' no-label';
		}

		$shell_field_class = "class='grunion-field-" . trim( esc_attr( $type ) . '-wrap ' . esc_attr( $wrap_classes ) ) . "' ";

		/**
		 * Filter the Contact Form required field text
		 *
		 * @module contact-form
		 *
		 * @since 3.8.0
		 *
		 * @param string $var Required field text. Default is "(required)".
		 */
		$required_field_text = esc_html( apply_filters( 'jetpack_required_field_text', $required_field_text ) );

		$block_style = 'style="' . $this->block_styles . '"';

		$field = "\n<div {$block_style} {$shell_field_class} >\n"; // new in Jetpack 6.8.0

		// If they are logged in, and this is their site, don't pre-populate fields
		if ( current_user_can( 'manage_options' ) ) {
			$value = '';
		}

		switch ( $type ) {
			case 'email':
				$field .= $this->render_email_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
				break;
			case 'telephone':
				$field .= $this->render_telephone_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
				break;
			case 'url':
				$field .= $this->render_url_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
				break;
			case 'textarea':
				$field .= $this->render_textarea_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
				break;
			case 'radio':
				$field .= $this->render_radio_field( $id, $label, $value, $field_class, $required, $required_field_text );
				break;
			case 'checkbox':
				$field .= $this->render_checkbox_field( $id, $label, $value, $field_class, $required, $required_field_text );
				break;
			case 'checkbox-multiple':
				$field .= $this->render_checkbox_multiple_field( $id, $label, $value, $field_class, $required, $required_field_text );
				break;
			case 'select':
				$field .= $this->render_select_field( $id, $label, $value, $field_class, $required, $required_field_text );
				break;
			case 'date':
				$field .= $this->render_date_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
				break;
			case 'consent':
				$field .= $this->render_consent_field( $id, $field_class );
				break;
			default: // text field
				$field .= $this->render_default_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $type );
				break;
		}

		if ( ! empty( $form_style ) && $form_style !== 'default' && ! in_array( $type, array( 'checkbox', 'consent' ), true ) ) {
			switch ( $form_style ) {
				case 'outlined':
					$field .= $this->render_outline_label( $id, $label, $required, $required_field_text );
					break;
				case 'animated':
					$field .= $this->render_animated_label( $id, $label, $required, $required_field_text );
					break;
				case 'below':
					$field .= $this->render_below_label( $id, $label, $required, $required_field_text );
					break;
			}
		}

		$field .= "\t</div>\n";
		return $field;
	}

	/**
	 * Overrides input type (maybe).
	 *
	 * @module contact-form
	 *
	 * Custom input types, like URL, will rely on browser's implementation to validate
	 * the value. If the input carries a data-type-override, we allow to override
	 * the type at render/submit so it can be validated with custom patterns.
	 * This method will try to match the input's type to a custom data-type-override
	 * attribute and return it. Defaults to input's type.
	 *
	 * @return string The input's type attribute or the overriden type.
	 */
	private function maybe_override_type() {
		// Define overridables-to-custom-type, extend as needed.
		$overridable_types = array( 'text' => array( 'url' ) );
		$type              = $this->get_attribute( 'type' );

		if ( ! array_key_exists( $type, $overridable_types ) ) {
			return $type;
		}

		$override_type = $this->get_attribute( 'data-type-override' );

		if ( in_array( $override_type, $overridable_types[ $type ], true ) ) {
			return $override_type;
		}

		return $type;
	}

	/**
	 * Gets the form style based on its CSS class.
	 *
	 * @return string The form style type.
	 */
	private function get_form_style() {
		$class_name = $this->form->get_attribute( 'className' );
		preg_match( '/is-style-([^\s]+)/i', $class_name, $matches );
		return count( $matches ) >= 2 ? $matches[1] : null;
	}
}

add_action( 'init', array( 'Grunion_Contact_Form_Plugin', 'init' ), 9 );

add_action( 'grunion_scheduled_delete', 'grunion_delete_old_spam' );

/**
 * Deletes old spam feedbacks to keep the posts table size under control
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Util::grunion_delete_old_spam'
 */
function grunion_delete_old_spam() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Util::grunion_delete_old_spam' );

	global $wpdb;

	$grunion_delete_limit = 100;

	$now_gmt  = current_time( 'mysql', 1 );
	$sql      = $wpdb->prepare(
		"
		SELECT `ID`
		FROM $wpdb->posts
		WHERE DATE_SUB( %s, INTERVAL 15 DAY ) > `post_date_gmt`
			AND `post_type` = 'feedback'
			AND `post_status` = 'spam'
		LIMIT %d
	",
		$now_gmt,
		$grunion_delete_limit
	);
	$post_ids = $wpdb->get_col( $sql ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

	foreach ( (array) $post_ids as $post_id ) {
		// force a full delete, skip the trash
		wp_delete_post( $post_id, true );
	}

	if (
		/**
		 * Filter if the module run OPTIMIZE TABLE on the core WP tables.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 * @since 6.4.0 Set to false by default.
		 *
		 * @param bool $filter Should Jetpack optimize the table, defaults to false.
		 */
		apply_filters( 'grunion_optimize_table', false )
	) {
		$wpdb->query( "OPTIMIZE TABLE $wpdb->posts" );
	}

	// if we hit the max then schedule another run
	if ( is_countable( $post_ids ) && count( $post_ids ) >= $grunion_delete_limit ) {
		wp_schedule_single_event( time() + 700, 'grunion_scheduled_delete' );
	}
}

/**
 * Send an event to Tracks on form submission.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Util::jetpack_tracks_record_grunion_pre_message_sent
 * @param int $post_id - the post_id for the CPT that is created.
 * @return null|void
 */
function jetpack_tracks_record_grunion_pre_message_sent( $post_id ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Util::jetpack_tracks_record_grunion_pre_message_sent' );

	$post = get_post( $post_id );
	if ( $post ) {
		$extra = gmdate( 'Y-W', strtotime( $post->post_date_gmt ) );
	} else {
		$extra = 'no-post';
	}

	/** This action is documented in modules/widgets/social-media-icons.php */
	do_action( 'jetpack_bump_stats_extras', 'jetpack_forms_message_sent', $extra );
}
add_action( 'grunion_pre_message_sent', 'jetpack_tracks_record_grunion_pre_message_sent', 12 );

<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- legacy file
/**
 * Contact form elements in the admin area. Used with Classic Editor.
 *
 * @deprecated 13.3 Use automattic/jetpack-forms
 * @package automattic/jetpack
 */

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move classes to appropriately-named class files.

use Automattic\Jetpack\Forms\ContactForm\Admin;

/**
 * Build contact form button.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_media_button
 * @return void
 */
function grunion_media_button() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_media_button' );

	Grunion_Admin::$instance->grunion_media_button();
}

/**
 * Display edit form view.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_display_form_view
 * @return void
 */
function grunion_display_form_view() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_display_form_view' );

	Grunion_Admin::$instance->grunion_display_form_view();
}

/**
 * Enqueue styles.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_admin_css
 * @return void
 */
function grunion_admin_css() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_admin_css' );

	Grunion_Admin::$instance->grunion_admin_css();
}

/**
 * Enqueue scripts.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_admin_js
 * @return void
 */
function grunion_admin_js() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_admin_js' );

	Grunion_Admin::$instance->grunion_admin_js();
}

/**
 * Hack a 'Bulk Spam' option for bulk edit in other than spam view
 * Hack a 'Bulk Delete' option for bulk edit in spam view
 *
 * There isn't a better way to do this until
 * https://core.trac.wordpress.org/changeset/17297 is resolved
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_add_bulk_edit_option
 */
function grunion_add_bulk_edit_option() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_add_bulk_edit_option' );

	return Grunion_Admin::$instance->grunion_add_bulk_edit_option();
}

/**
 * Handle a bulk spam report
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_handle_bulk_spam
 */
function grunion_handle_bulk_spam() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_handle_bulk_spam' );

	return Grunion_Admin::$instance->grunion_handle_bulk_spam();
}

/**
 * Display spam message.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_message_bulk_spam
 * @return void
 */
function grunion_message_bulk_spam() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_message_bulk_spam' );

	Grunion_Admin::$instance->grunion_message_bulk_spam();
}

/**
 * Unset edit option when bulk editing.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_admin_bulk_actions
 * @param array $actions List of actions available.
 * @return array $actions
 */
function grunion_admin_bulk_actions( $actions ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_admin_bulk_actions' );

	return Grunion_Admin::$instance->grunion_admin_bulk_actions( $actions );
}

/**
 * Unset publish button when editing feedback.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_admin_view_tabs
 * @param array $views List of post views.
 * @return array $views
 */
function grunion_admin_view_tabs( $views ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_admin_view_tabs' );

	return Grunion_Admin::$instance->grunion_admin_view_tabs( $views );
}

/**
 * Build Feedback admin page columns.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_post_type_columns_filter
 * @param array $cols List of available columns.
 * @return array
 */
function grunion_post_type_columns_filter( $cols ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_post_type_columns_filter' );

	return Grunion_Admin::$instance->grunion_post_type_columns_filter( $cols );
}

/**
 * Displays the value for the source column. (This function runs within the loop.)
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_column_date
 * @return void
 */
function grunion_manage_post_column_date() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_column_date' );

	Grunion_Admin::$instance->grunion_manage_post_column_date();
}

/**
 * Displays the value for the from column.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_column_from
 * @param  \WP_Post $post Current post.
 * @return void
 */
function grunion_manage_post_column_from( $post ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_column_from' );

	Grunion_Admin::$instance->grunion_manage_post_column_from( $post );
}

/**
 * Displays the value for the response column.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_column_response
 * @param  \WP_Post $post Current post.
 * @return void
 */
function grunion_manage_post_column_response( $post ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_column_response' );

	Grunion_Admin::$instance->grunion_manage_post_column_response( $post );
}

/**
 * Displays the value for the source column.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_column_source
 * @param  \WP_Post $post Current post.
 * @return void
 */
function grunion_manage_post_column_source( $post ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_column_source' );

	Grunion_Admin::$instance->grunion_manage_post_column_source( $post );
}

/**
 * Parse message content and display in appropriate columns.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_columns
 * @param array $col List of columns available on admin page.
 * @param int   $post_id The current post ID.
 * @return void
 */
function grunion_manage_post_columns( $col, $post_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_columns' );

	Grunion_Admin::$instance->grunion_manage_post_columns( $col, $post_id );
}

/**
 * Add a post filter dropdown at the top of the admin page.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_source_filter
 * @return void
 */
function grunion_source_filter() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_source_filter' );

	Grunion_Admin::$instance->grunion_source_filter();
}

/**
 * Filter feedback posts by parent_id if present.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_source_filter_results
 * @param WP_Query $query Current query.
 * @return void
 */
function grunion_source_filter_results( $query ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_source_filter_results' );

	Grunion_Admin::$instance->grunion_source_filter_results( $query );
}

/**
 * Add actions to feedback response rows in WP Admin.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_row_actions
 * @param string[] $actions Default actions.
 * @return string[]
 */
function grunion_manage_post_row_actions( $actions ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_manage_post_row_actions' );

	return Grunion_Admin::$instance->grunion_manage_post_row_actions( $actions );
}

/**
 * Escape grunion attributes.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_esc_attr
 * @param string $attr - the attribute we're escaping.
 * @return string
 */
function grunion_esc_attr( $attr ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_esc_attr' );

	return Grunion_Admin::$instance->grunion_esc_attr( $attr );
}

/**
 * Sort grunion items.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_sort_objects
 * @param array $a - the first item we're sorting.
 * @param array $b - the second item we're sorting.
 * @return string
 */
function grunion_sort_objects( $a, $b ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_sort_objects' );

	return Grunion_Admin::$instance->grunion_sort_objects( $a, $b );
}

/**
 * Take an array of field types from the form builder, and construct a shortcode form.
 * returns both the shortcode form, and HTML markup representing a preview of the form
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_ajax_shortcode
 */
function grunion_ajax_shortcode() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_ajax_shortcode' );

	return Grunion_Admin::$instance->grunion_ajax_shortcode();
}

/**
 * Takes a post_id, extracts the contact-form shortcode from that post (if there is one), parses it,
 * and constructs a json object representing its contents and attributes.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_ajax_shortcode_to_json
 */
function grunion_ajax_shortcode_to_json() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_ajax_shortcode_to_json' );

	return Grunion_Admin::$instance->grunion_ajax_shortcode_to_json();
}

/**
 * Handle marking feedback as spam.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_ajax_spam
 */
function grunion_ajax_spam() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_ajax_spam' );

	return Grunion_Admin::$instance->grunion_ajax_spam();
}

/**
 * Add the scripts that will add the "Check for Spam" button to the Feedbacks dashboard page.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_enable_spam_recheck
 */
function grunion_enable_spam_recheck() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_enable_spam_recheck' );

	return Grunion_Admin::$instance->grunion_enable_spam_recheck();
}

/**
 * Add the JS and CSS necessary for the Feedback admin page to function.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_add_admin_scripts
 */
function grunion_add_admin_scripts() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_add_admin_scripts' );

	return Grunion_Admin::$instance->grunion_add_admin_scripts();
}

/**
 * Adds the 'Export' button to the feedback dashboard page.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_export_button
 * @return void
 */
function grunion_export_button() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_export_button' );

	Grunion_Admin::$instance->grunion_export_button();
}

/**
 * Add the "Check for Spam" button to the Feedbacks dashboard page.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_check_for_spam_button
 */
function grunion_check_for_spam_button() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_check_for_spam_button' );

	return Grunion_Admin::$instance->grunion_check_for_spam_button();
}

/**
 * Recheck all approved feedbacks for spam.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_recheck_queue
 */
function grunion_recheck_queue() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_recheck_queue' );

	return Grunion_Admin::$instance->grunion_recheck_queue();
}

/**
 * Delete a number of spam feedbacks via an AJAX request.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_delete_spam_feedbacks
 */
function grunion_delete_spam_feedbacks() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_delete_spam_feedbacks' );

	return Grunion_Admin::$instance->grunion_delete_spam_feedbacks();
}

/**
 * Show an admin notice if the "Empty Spam" or "Check Spam" process was unable to complete, probably due to a permissions error.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->grunion_feedback_admin_notice
 */
function grunion_feedback_admin_notice() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->grunion_feedback_admin_notice' );

	return Grunion_Admin::$instance->grunion_feedback_admin_notice();
}

/**
 * Class Grunion_Admin
 *
 * Singleton for Grunion admin area support.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin
 */
class Grunion_Admin {
	/**
	 * CSV export nonce field name
	 *
	 * @var string The nonce field name for CSV export.
	 */
	private $export_nonce_field_csv = 'feedback_export_nonce_csv';

	/**
	 * GDrive export nonce field name
	 *
	 * @var string The nonce field name for GDrive export.
	 */
	private $export_nonce_field_gdrive = 'feedback_export_nonce_gdrive';

	/**
	 * Singleton class instance
	 *
	 * @var Grunion_Admin Class instance.
	 */
	public static $instance;

	/**
	 * Instantiates this singleton class
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin::init
	 * @return Grunion_Admin The Grunion Admin class instance.
	 */
	public static function init() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin::init' );

		if ( ! isset( self::$instance ) ) {
			self::$instance = new Admin();
		}

		return self::$instance;
	}

	/**
	 * Grunion_Admin constructor
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->__construct
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->__construct' );
	}

	/**
	 * Hook handler for admin_enqueue_scripts hook
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->admin_enqueue_scripts
	 */
	public function admin_enqueue_scripts() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->admin_enqueue_scripts' );

		return self::$instance->admin_enqueue_scripts();
	}

	/**
	 * Prints the modal markup with export buttons/content.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->print_export_modal
	 */
	public function print_export_modal() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->print_export_modal' );

		return self::$instance->print_export_modal();
	}

	/**
	 * Ajax handler for wp_ajax_grunion_export_to_gdrive.
	 * Exports data to Google Drive, based on POST data.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->export_to_gdrive
	 * @see Grunion_Contact_Form_Plugin::get_feedback_entries_from_post
	 */
	public function export_to_gdrive() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->export_to_gdrive' );

		return self::$instance->export_to_gdrive();
	}

	/**
	 * Return HTML markup for the CSV download button.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->get_csv_export_section
	 */
	public function get_csv_export_section() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->get_csv_export_section' );

		return self::$instance->get_csv_export_section();
	}

	/**
	 * Render/output HTML markup for the export to gdrive section.
	 * If the user doesn't hold a Google Drive connection a button to connect will render (See grunion-admin.js).
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->get_gdrive_export_section
	 */
	public function get_gdrive_export_section() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->get_gdrive_export_section' );

		return self::$instance->get_gdrive_export_section();
	}

	/**
	 * Ajax handler. Sends a payload with connection status and html to replace
	 * the Connect button with the Export button using get_gdrive_export_button
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->test_gdrive_connection
	 */
	public function test_gdrive_connection() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->test_gdrive_connection' );

		return self::$instance->test_gdrive_connection();
	}

	/**
	 * Markup helper so we DRY, returns the button markup for the export to GDrive feature.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->get_gdrive_export_button_markup
	 * @return string The HTML button markup
	 */
	public function get_gdrive_export_button_markup() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->get_gdrive_export_button_markup' );

		return self::$instance->get_gdrive_export_button_markup();
	}

	/**
	 * Get a filename for export tasks
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Admin->get_export_filename
	 * @param string $source The filtered source for exported data.
	 * @return string The filename without source nor date suffix.
	 */
	public function get_export_filename( $source = '' ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Admin->get_export_filename' );

		return self::$instance->get_export_filename( $source );
	}
}

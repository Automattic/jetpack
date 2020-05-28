<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Grunion Contact Form
 * Add a contact form to any post, page or text widget.
 * Emails will be sent to the post's author by default, or any email address you choose.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Sync\Settings;

define( 'GRUNION_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'GRUNION_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

if ( is_admin() ) {
	require_once GRUNION_PLUGIN_DIR . 'admin.php';
}

add_action( 'rest_api_init', 'grunion_contact_form_require_endpoint' );
function grunion_contact_form_require_endpoint() {
	require_once GRUNION_PLUGIN_DIR . 'class-grunion-contact-form-endpoint.php';
}

/**
 * Sets up various actions, filters, post types, post statuses, shortcodes.
 */
class Grunion_Contact_Form_Plugin {

	/**
	 * @var string The Widget ID of the widget currently being processed.  Used to build the unique contact-form ID for forms embedded in widgets.
	 */
	public $current_widget_id;

	static $using_contact_form_field = false;

	/**
	 * @var int The last Feedback Post ID Erased as part of the Personal Data Eraser.
	 * Helps with pagination.
	 */
	private $pde_last_post_id_erased = 0;

	/**
	 * @var string The email address for which we are deleting/exporting all feedbacks
	 * as part of a Personal Data Eraser or Personal Data Exporter request.
	 */
	private $pde_email_address = '';

	static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new Grunion_Contact_Form_Plugin();

			// Schedule our daily cleanup
			add_action( 'wp_scheduled_delete', array( $instance, 'daily_akismet_meta_cleanup' ) );
		}

		return $instance;
	}

	/**
	 * Runs daily to clean up spam detection metadata after 15 days.  Keeps your DB squeaky clean.
	 */
	public function daily_akismet_meta_cleanup() {
		global $wpdb;

		$feedback_ids = $wpdb->get_col( "SELECT p.ID FROM {$wpdb->posts} as p INNER JOIN {$wpdb->postmeta} as m on m.post_id = p.ID WHERE p.post_type = 'feedback' AND m.meta_key = '_feedback_akismet_values' AND DATE_SUB(NOW(), INTERVAL 15 DAY) > p.post_date_gmt LIMIT 10000" );

		if ( empty( $feedback_ids ) ) {
			return;
		}

		/**
		 * Fires right before deleting the _feedback_akismet_values post meta on $feedback_ids
		 *
		 * @module contact-form
		 *
		 * @since 6.1.0
		 *
		 * @param array $feedback_ids list of feedback post ID
		 */
		do_action( 'jetpack_daily_akismet_meta_cleanup_before', $feedback_ids );
		foreach ( $feedback_ids as $feedback_id ) {
			delete_post_meta( $feedback_id, '_feedback_akismet_values' );
		}

		/**
		 * Fires right after deleting the _feedback_akismet_values post meta on $feedback_ids
		 *
		 * @module contact-form
		 *
		 * @since 6.1.0
		 *
		 * @param array $feedback_ids list of feedback post ID
		 */
		do_action( 'jetpack_daily_akismet_meta_cleanup_after', $feedback_ids );
	}

	/**
	 * Strips HTML tags from input.  Output is NOT HTML safe.
	 *
	 * @param mixed $data_with_tags
	 * @return mixed
	 */
	public static function strip_tags( $data_with_tags ) {
		if ( is_array( $data_with_tags ) ) {
			foreach ( $data_with_tags as $index => $value ) {
				$index = sanitize_text_field( strval( $index ) );
				$value = wp_kses( strval( $value ), array() );
				$value = str_replace( '&amp;', '&', $value ); // undo damage done by wp_kses_normalize_entities()

				$data_without_tags[ $index ] = $value;
			}
		} else {
			$data_without_tags = wp_kses( $data_with_tags, array() );
			$data_without_tags = str_replace( '&amp;', '&', $data_without_tags ); // undo damage done by wp_kses_normalize_entities()
		}

		return $data_without_tags;
	}

	/**
	 * Class uses singleton pattern; use Grunion_Contact_Form_Plugin::init() to initialize.
	 */
	protected function __construct() {
		$this->add_shortcode();

		// While generating the output of a text widget with a contact-form shortcode, we need to know its widget ID.
		add_action( 'dynamic_sidebar', array( $this, 'track_current_widget' ) );

		// Add a "widget" shortcode attribute to all contact-form shortcodes embedded in widgets
		add_filter( 'widget_text', array( $this, 'widget_atts' ), 0 );

		// If Text Widgets don't get shortcode processed, hack ours into place.
		if (
			version_compare( get_bloginfo( 'version' ), '4.9-z', '<=' )
			&& ! has_filter( 'widget_text', 'do_shortcode' )
		) {
			add_filter( 'widget_text', array( $this, 'widget_shortcode_hack' ), 5 );
		}

		add_filter( 'jetpack_contact_form_is_spam', array( $this, 'is_spam_blacklist' ), 10, 2 );

		// Akismet to the rescue
		if ( defined( 'AKISMET_VERSION' ) || function_exists( 'akismet_http_post' ) ) {
			add_filter( 'jetpack_contact_form_is_spam', array( $this, 'is_spam_akismet' ), 10, 2 );
			add_action( 'contact_form_akismet', array( $this, 'akismet_submit' ), 10, 2 );
		}

		add_action( 'loop_start', array( 'Grunion_Contact_Form', '_style_on' ) );

		add_action( 'wp_ajax_grunion-contact-form', array( $this, 'ajax_request' ) );
		add_action( 'wp_ajax_nopriv_grunion-contact-form', array( $this, 'ajax_request' ) );

		// GDPR: personal data exporter & eraser.
		add_filter( 'wp_privacy_personal_data_exporters', array( $this, 'register_personal_data_exporter' ) );
		add_filter( 'wp_privacy_personal_data_erasers', array( $this, 'register_personal_data_eraser' ) );

		// Export to CSV feature
		if ( is_admin() ) {
			add_action( 'admin_init', array( $this, 'download_feedback_as_csv' ) );
			add_action( 'admin_footer-edit.php', array( $this, 'export_form' ) );
			add_action( 'admin_menu', array( $this, 'admin_menu' ) );
			add_action( 'current_screen', array( $this, 'unread_count' ) );
		}

		// custom post type we'll use to keep copies of the feedback items
		register_post_type(
			'feedback', array(
				'labels'                => array(
					'name'               => __( 'Feedback', 'jetpack' ),
					'singular_name'      => __( 'Feedback', 'jetpack' ),
					'search_items'       => __( 'Search Feedback', 'jetpack' ),
					'not_found'          => __( 'No feedback found', 'jetpack' ),
					'not_found_in_trash' => __( 'No feedback found', 'jetpack' ),
				),
				// Matrial Ballot icon
				'menu_icon'             => 'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M13 7.5h5v2h-5zm0 7h5v2h-5zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM11 6H6v5h5V6zm-1 4H7V7h3v3zm1 3H6v5h5v-5zm-1 4H7v-3h3v3z"/></svg>'),
				'show_ui'               => true,
				'show_in_admin_bar'     => false,
				'public'                => false,
				'rewrite'               => false,
				'query_var'             => false,
				'capability_type'       => 'page',
				'show_in_rest'          => true,
				'rest_controller_class' => 'Grunion_Contact_Form_Endpoint',
				'capabilities'          => array(
					'create_posts'        => 'do_not_allow',
					'publish_posts'       => 'publish_pages',
					'edit_posts'          => 'edit_pages',
					'edit_others_posts'   => 'edit_others_pages',
					'delete_posts'        => 'delete_pages',
					'delete_others_posts' => 'delete_others_pages',
					'read_private_posts'  => 'read_private_pages',
					'edit_post'           => 'edit_page',
					'delete_post'         => 'delete_page',
					'read_post'           => 'read_page',
				),
				'map_meta_cap'          => true,
			)
		);

		// Add to REST API post type whitelist
		add_filter( 'rest_api_allowed_post_types', array( $this, 'allow_feedback_rest_api_type' ) );

		// Add "spam" as a post status
		register_post_status(
			'spam', array(
				'label'                  => 'Spam',
				'public'                 => false,
				'exclude_from_search'    => true,
				'show_in_admin_all_list' => false,
				'label_count'            => _n_noop( 'Spam <span class="count">(%s)</span>', 'Spam <span class="count">(%s)</span>', 'jetpack' ),
				'protected'              => true,
				'_builtin'               => false,
			)
		);

		// POST handler
		if (
			isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' == strtoupper( $_SERVER['REQUEST_METHOD'] )
			&&
			isset( $_POST['action'] ) && 'grunion-contact-form' == $_POST['action']
			&&
			isset( $_POST['contact-form-id'] )
		) {
			add_action( 'template_redirect', array( $this, 'process_form_submission' ) );
		}

		/*
		 Can be dequeued by placing the following in wp-content/themes/yourtheme/functions.php
		 *
		 * 	function remove_grunion_style() {
		 *		wp_deregister_style('grunion.css');
		 *	}
		 *	add_action('wp_print_styles', 'remove_grunion_style');
		 */
		wp_register_style( 'grunion.css', GRUNION_PLUGIN_URL . 'css/grunion.css', array(), JETPACK__VERSION );
		wp_style_add_data( 'grunion.css', 'rtl', 'replace' );

		self::register_contact_form_blocks();
	}

	private static function register_contact_form_blocks() {
		jetpack_register_block( 'jetpack/contact-form', array(
			'render_callback' => array( __CLASS__, 'gutenblock_render_form' ),
		) );

		// Field render methods.
		jetpack_register_block( 'jetpack/field-text', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_text' ),
		) );
		jetpack_register_block( 'jetpack/field-name', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_name' ),
		) );
		jetpack_register_block( 'jetpack/field-email', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_email' ),
		) );
		jetpack_register_block( 'jetpack/field-url', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_url' ),
		) );
		jetpack_register_block( 'jetpack/field-date', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_date' ),
		) );
		jetpack_register_block( 'jetpack/field-telephone', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_telephone' ),
		) );
		jetpack_register_block( 'jetpack/field-textarea', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_textarea' ),
		) );
		jetpack_register_block( 'jetpack/field-checkbox', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_checkbox' ),
		) );
		jetpack_register_block( 'jetpack/field-checkbox-multiple', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_checkbox_multiple' ),
		) );
		jetpack_register_block( 'jetpack/field-radio', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_radio' ),
		) );
		jetpack_register_block( 'jetpack/field-select', array(
			'parent'          => array( 'jetpack/contact-form' ),
			'render_callback' => array( __CLASS__, 'gutenblock_render_field_select' ),
		) );
	}

	public static function gutenblock_render_form( $atts, $content ) {
		return Grunion_Contact_Form::parse( $atts, do_blocks( $content ) );
	}

	public static function block_attributes_to_shortcode_attributes( $atts, $type ) {
		$atts['type'] = $type;
		if ( isset( $atts['className'] ) ) {
			$atts['class'] = $atts['className'];
			unset( $atts['className'] );
		}

		if ( isset( $atts['defaultValue'] ) ) {
			$atts['default'] = $atts['defaultValue'];
			unset( $atts['defaultValue'] );
		}

		return $atts;
	}

	public static function gutenblock_render_field_text( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'text' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}
	public static function gutenblock_render_field_name( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'name' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}
	public static function gutenblock_render_field_email( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'email' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}
	public static function gutenblock_render_field_url( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'url' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}
	public static function gutenblock_render_field_date( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'date' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}
	public static function gutenblock_render_field_telephone( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'telephone' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}
	public static function gutenblock_render_field_textarea( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'textarea' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}
	public static function gutenblock_render_field_checkbox( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'checkbox' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}
	public static function gutenblock_render_field_checkbox_multiple( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'checkbox-multiple' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}
	public static function gutenblock_render_field_radio( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'radio' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}
	public static function gutenblock_render_field_select( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'select' );
		return Grunion_Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Add the 'Export' menu item as a submenu of Feedback.
	 */
	public function admin_menu() {
		add_submenu_page(
			'edit.php?post_type=feedback',
			__( 'Export feedback as CSV', 'jetpack' ),
			__( 'Export CSV', 'jetpack' ),
			'export',
			'feedback-export',
			array( $this, 'export_form' )
		);
	}

	/**
	 * Add to REST API post type whitelist
	 */
	function allow_feedback_rest_api_type( $post_types ) {
		$post_types[] = 'feedback';
		return $post_types;
	}

	/**
	 * Display the count of new feedback entries received. It's reset when user visits the Feedback screen.
	 *
	 * @since 4.1.0
	 *
	 * @param object $screen Information about the current screen.
	 */
	function unread_count( $screen ) {
		if ( isset( $screen->post_type ) && 'feedback' == $screen->post_type ) {
			update_option( 'feedback_unread_count', 0 );
		} else {
			global $menu;
			if ( isset( $menu ) && is_array( $menu ) && ! empty( $menu ) ) {
				foreach ( $menu as $index => $menu_item ) {
					if ( 'edit.php?post_type=feedback' == $menu_item[2] ) {
						$unread = get_option( 'feedback_unread_count', 0 );
						if ( $unread > 0 ) {
							$unread_count       = current_user_can( 'publish_pages' ) ? " <span class='feedback-unread count-{$unread} awaiting-mod'><span class='feedback-unread-count'>" . number_format_i18n( $unread ) . '</span></span>' : '';
							$menu[ $index ][0] .= $unread_count;
						}
						break;
					}
				}
			}
		}
	}

	/**
	 * Handles all contact-form POST submissions
	 *
	 * Conditionally attached to `template_redirect`
	 */
	function process_form_submission() {
		// Add a filter to replace tokens in the subject field with sanitized field values
		add_filter( 'contact_form_subject', array( $this, 'replace_tokens_with_input' ), 10, 2 );

		$id   = stripslashes( $_POST['contact-form-id'] );
		$hash = isset( $_POST['contact-form-hash'] ) ? $_POST['contact-form-hash'] : '';
		$hash = preg_replace( '/[^\da-f]/i', '', $hash );

		if ( ! is_string( $id ) || ! is_string( $hash ) ) {
			return false;
		}

		if ( is_user_logged_in() ) {
			check_admin_referer( "contact-form_{$id}" );
		}

		$is_widget = 0 === strpos( $id, 'widget-' );

		$form = false;

		if ( $is_widget ) {
			// It's a form embedded in a text widget
			$this->current_widget_id = substr( $id, 7 ); // remove "widget-"
			$widget_type             = implode( '-', array_slice( explode( '-', $this->current_widget_id ), 0, -1 ) ); // Remove trailing -#

			// Is the widget active?
			$sidebar = is_active_widget( false, $this->current_widget_id, $widget_type );

			// This is lame - no core API for getting a widget by ID
			$widget = isset( $GLOBALS['wp_registered_widgets'][ $this->current_widget_id ] ) ? $GLOBALS['wp_registered_widgets'][ $this->current_widget_id ] : false;

			if ( $sidebar && $widget && isset( $widget['callback'] ) ) {
				// prevent PHP notices by populating widget args
				$widget_args = array(
					'before_widget' => '',
					'after_widget'  => '',
					'before_title'  => '',
					'after_title'   => '',
				);
				// This is lamer - no API for outputting a given widget by ID
				ob_start();
				// Process the widget to populate Grunion_Contact_Form::$last
				call_user_func( $widget['callback'], $widget_args, $widget['params'][0] );
				ob_end_clean();
			}
		} else {
			// It's a form embedded in a post
			$post = get_post( $id );

			// Process the content to populate Grunion_Contact_Form::$last
			if ( $post ) {
				/** This filter is already documented in core. wp-includes/post-template.php */
				apply_filters( 'the_content', $post->post_content );
			}
		}

		$form = isset( Grunion_Contact_Form::$forms[ $hash ] ) ? Grunion_Contact_Form::$forms[ $hash ] : null;

		// No form may mean user is using do_shortcode, grab the form using the stored post meta
		if ( ! $form && is_numeric( $id ) && $hash ) {

			// Get shortcode from post meta
			$shortcode = get_post_meta( $id, "_g_feedback_shortcode_{$hash}", true );

			// Format it
			if ( $shortcode != '' ) {

				// Get attributes from post meta.
				$parameters = '';
				$attributes = get_post_meta( $id, "_g_feedback_shortcode_atts_{$hash}", true );
				if ( ! empty( $attributes ) && is_array( $attributes ) ) {
					foreach ( array_filter( $attributes ) as $param => $value ) {
						$parameters .= " $param=\"$value\"";
					}
				}

				$shortcode = '[contact-form' . $parameters . ']' . $shortcode . '[/contact-form]';
				do_shortcode( $shortcode );

				// Recreate form
				$form = Grunion_Contact_Form::$last;
			}
		}

		if ( ! $form ) {
			return false;
		}

		if ( is_wp_error( $form->errors ) && $form->errors->get_error_codes() ) {
			return $form->errors;
		}

		// Process the form
		return $form->process_submission();
	}

	function ajax_request() {
		$submission_result = self::process_form_submission();

		if ( ! $submission_result ) {
			header( 'HTTP/1.1 500 Server Error', 500, true );
			echo '<div class="form-error"><ul class="form-errors"><li class="form-error-message">';
			esc_html_e( 'An error occurred. Please try again later.', 'jetpack' );
			echo '</li></ul></div>';
		} elseif ( is_wp_error( $submission_result ) ) {
			header( 'HTTP/1.1 400 Bad Request', 403, true );
			echo '<div class="form-error"><ul class="form-errors"><li class="form-error-message">';
			echo esc_html( $submission_result->get_error_message() );
			echo '</li></ul></div>';
		} else {
			echo '<h3>' . esc_html__( 'Message Sent', 'jetpack' ) . '</h3>' . $submission_result;
		}

		die;
	}

	/**
	 * Ensure the post author is always zero for contact-form feedbacks
	 * Attached to `wp_insert_post_data`
	 *
	 * @see Grunion_Contact_Form::process_submission()
	 *
	 * @param array $data the data to insert
	 * @param array $postarr the data sent to wp_insert_post()
	 * @return array The filtered $data to insert
	 */
	function insert_feedback_filter( $data, $postarr ) {
		if ( $data['post_type'] == 'feedback' && $postarr['post_type'] == 'feedback' ) {
			$data['post_author'] = 0;
		}

		return $data;
	}
	/*
	 * Adds our contact-form shortcode
	 * The "child" contact-field shortcode is enabled as needed by the contact-form shortcode handler
	 */
	function add_shortcode() {
		add_shortcode( 'contact-form', array( 'Grunion_Contact_Form', 'parse' ) );
		add_shortcode( 'contact-field', array( 'Grunion_Contact_Form', 'parse_contact_field' ) );
	}

	static function tokenize_label( $label ) {
		return '{' . trim( preg_replace( '#^\d+_#', '', $label ) ) . '}';
	}

	static function sanitize_value( $value ) {
		return preg_replace( '=((<CR>|<LF>|0x0A/%0A|0x0D/%0D|\\n|\\r)\S).*=i', null, $value );
	}

	/**
	 * Replaces tokens like {city} or {City} (case insensitive) with the value
	 * of an input field of that name
	 *
	 * @param string $subject
	 * @param array  $field_values Array with field label => field value associations
	 *
	 * @return string The filtered $subject with the tokens replaced
	 */
	function replace_tokens_with_input( $subject, $field_values ) {
		// Wrap labels into tokens (inside {})
		$wrapped_labels = array_map( array( 'Grunion_Contact_Form_Plugin', 'tokenize_label' ), array_keys( $field_values ) );
		// Sanitize all values
		$sanitized_values = array_map( array( 'Grunion_Contact_Form_Plugin', 'sanitize_value' ), array_values( $field_values ) );

		foreach ( $sanitized_values as $k => $sanitized_value ) {
			if ( is_array( $sanitized_value ) ) {
				$sanitized_values[ $k ] = implode( ', ', $sanitized_value );
			}
		}

		// Search for all valid tokens (based on existing fields) and replace with the field's value
		$subject = str_ireplace( $wrapped_labels, $sanitized_values, $subject );
		return $subject;
	}

	/**
	 * Tracks the widget currently being processed.
	 * Attached to `dynamic_sidebar`
	 *
	 * @see $current_widget_id
	 *
	 * @param array $widget The widget data
	 */
	function track_current_widget( $widget ) {
		$this->current_widget_id = $widget['id'];
	}

	/**
	 * Adds a "widget" attribute to every contact-form embedded in a text widget.
	 * Used to tell the difference between post-embedded contact-forms and widget-embedded contact-forms
	 * Attached to `widget_text`
	 *
	 * @param string $text The widget text
	 * @return string The filtered widget text
	 */
	function widget_atts( $text ) {
		Grunion_Contact_Form::style( true );

		return preg_replace( '/\[contact-form([^a-zA-Z_-])/', '[contact-form widget="' . $this->current_widget_id . '"\\1', $text );
	}

	/**
	 * For sites where text widgets are not processed for shortcodes, we add this hack to process just our shortcode
	 * Attached to `widget_text`
	 *
	 * @param string $text The widget text
	 * @return string The contact-form filtered widget text
	 */
	function widget_shortcode_hack( $text ) {
		if ( ! preg_match( '/\[contact-form([^a-zA-Z_-])/', $text ) ) {
			return $text;
		}

		$old = $GLOBALS['shortcode_tags'];
		remove_all_shortcodes();
		Grunion_Contact_Form_Plugin::$using_contact_form_field = true;
		$this->add_shortcode();

		$text = do_shortcode( $text );

		Grunion_Contact_Form_Plugin::$using_contact_form_field = false;
		$GLOBALS['shortcode_tags']                             = $old;

		return $text;
	}

	/**
	 * Check if a submission matches the Comment Blacklist.
	 * The Comment Blacklist is a means to moderate discussion, and contact
	 * forms are 1:1 discussion forums, ripe for abuse by users who are being
	 * removed from the public discussion.
	 * Attached to `jetpack_contact_form_is_spam`
	 *
	 * @param bool  $is_spam
	 * @param array $form
	 * @return bool TRUE => spam, FALSE => not spam
	 */
	function is_spam_blacklist( $is_spam, $form = array() ) {
		if ( $is_spam ) {
			return $is_spam;
		}

		if ( wp_blacklist_check( $form['comment_author'], $form['comment_author_email'], $form['comment_author_url'], $form['comment_content'], $form['user_ip'], $form['user_agent'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Populate an array with all values necessary to submit a NEW contact-form feedback to Akismet.
	 * Note that this includes the current user_ip etc, so this should only be called when accepting a new item via $_POST
	 *
	 * @param array $form Contact form feedback array
	 * @return array feedback array with additional data ready for submission to Akismet
	 */
	function prepare_for_akismet( $form ) {
		$form['comment_type'] = 'contact_form';
		$form['user_ip']      = $_SERVER['REMOTE_ADDR'];
		$form['user_agent']   = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : '';
		$form['referrer']     = isset( $_SERVER['HTTP_REFERER'] ) ? $_SERVER['HTTP_REFERER'] : '';
		$form['blog']         = get_option( 'home' );

		foreach ( $_SERVER as $key => $value ) {
			if ( ! is_string( $value ) ) {
				continue;
			}
			if ( in_array( $key, array( 'HTTP_COOKIE', 'HTTP_COOKIE2', 'HTTP_USER_AGENT', 'HTTP_REFERER' ) ) ) {
				// We don't care about cookies, and the UA and Referrer were caught above.
				continue;
			} elseif ( in_array( $key, array( 'REMOTE_ADDR', 'REQUEST_URI', 'DOCUMENT_URI' ) ) ) {
				// All three of these are relevant indicators and should be passed along.
				$form[ $key ] = $value;
			} elseif ( wp_startswith( $key, 'HTTP_' ) ) {
				// Any other HTTP header indicators.
				// `wp_startswith()` is a wpcom helper function and is included in Jetpack via `functions.compat.php`
				$form[ $key ] = $value;
			}
		}

		return $form;
	}

	/**
	 * Submit contact-form data to Akismet to check for spam.
	 * If you're accepting a new item via $_POST, run it Grunion_Contact_Form_Plugin::prepare_for_akismet() first
	 * Attached to `jetpack_contact_form_is_spam`
	 *
	 * @param bool  $is_spam
	 * @param array $form
	 * @return bool|WP_Error TRUE => spam, FALSE => not spam, WP_Error => stop processing entirely
	 */
	function is_spam_akismet( $is_spam, $form = array() ) {
		global $akismet_api_host, $akismet_api_port;

		// The signature of this function changed from accepting just $form.
		// If something only sends an array, assume it's still using the old
		// signature and work around it.
		if ( empty( $form ) && is_array( $is_spam ) ) {
			$form    = $is_spam;
			$is_spam = false;
		}

		// If a previous filter has alrady marked this as spam, trust that and move on.
		if ( $is_spam ) {
			return $is_spam;
		}

		if ( ! function_exists( 'akismet_http_post' ) && ! defined( 'AKISMET_VERSION' ) ) {
			return false;
		}

		$query_string = http_build_query( $form );

		if ( method_exists( 'Akismet', 'http_post' ) ) {
			$response = Akismet::http_post( $query_string, 'comment-check' );
		} else {
			$response = akismet_http_post( $query_string, $akismet_api_host, '/1.1/comment-check', $akismet_api_port );
		}

		$result = false;

		if ( isset( $response[0]['x-akismet-pro-tip'] ) && 'discard' === trim( $response[0]['x-akismet-pro-tip'] ) && get_option( 'akismet_strictness' ) === '1' ) {
			$result = new WP_Error( 'feedback-discarded', __( 'Feedback discarded.', 'jetpack' ) );
		} elseif ( isset( $response[1] ) && 'true' == trim( $response[1] ) ) { // 'true' is spam
			$result = true;
		}

		/**
		 * Filter the results returned by Akismet for each submitted contact form.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 *
		 * @param WP_Error|bool $result Is the submitted feedback spam.
		 * @param array|bool $form Submitted feedback.
		 */
		return apply_filters( 'contact_form_is_spam_akismet', $result, $form );
	}

	/**
	 * Submit a feedback as either spam or ham
	 *
	 * @param string $as Either 'spam' or 'ham'.
	 * @param array  $form the contact-form data
	 */
	function akismet_submit( $as, $form ) {
		global $akismet_api_host, $akismet_api_port;

		if ( ! in_array( $as, array( 'ham', 'spam' ) ) ) {
			return false;
		}

		$query_string = '';
		if ( is_array( $form ) ) {
			$query_string = http_build_query( $form );
		}
		if ( method_exists( 'Akismet', 'http_post' ) ) {
			$response = Akismet::http_post( $query_string, "submit-{$as}" );
		} else {
			$response = akismet_http_post( $query_string, $akismet_api_host, "/1.1/submit-{$as}", $akismet_api_port );
		}

		return trim( $response[1] );
	}

	/**
	 * Prints the menu
	 */
	function export_form() {
		$current_screen = get_current_screen();
		if ( ! in_array( $current_screen->id, array( 'edit-feedback', 'feedback_page_feedback-export' ) ) ) {
			return;
		}

		if ( ! current_user_can( 'export' ) ) {
			return;
		}

		// if there aren't any feedbacks, bail out
		if ( ! (int) wp_count_posts( 'feedback' )->publish ) {
			return;
		}
		?>

		<div id="feedback-export" style="display:none">
			<h2><?php _e( 'Export feedback as CSV', 'jetpack' ); ?></h2>
			<div class="clear"></div>
			<form action="<?php echo admin_url( 'admin-post.php' ); ?>" method="post" class="form">
				<?php wp_nonce_field( 'feedback_export', 'feedback_export_nonce' ); ?>

				<input name="action" value="feedback_export" type="hidden">
				<label for="post"><?php _e( 'Select feedback to download', 'jetpack' ); ?></label>
				<select name="post">
					<option value="all"><?php esc_html_e( 'All posts', 'jetpack' ); ?></option>
					<?php echo $this->get_feedbacks_as_options(); ?>
				</select>

				<br><br>
				<input type="submit" name="submit" id="submit" class="button button-primary" value="<?php esc_html_e( 'Download', 'jetpack' ); ?>">
			</form>
		</div>

		<?php
		// There aren't any usable actions in core to output the "export feedback" form in the correct place,
		// so this inline JS moves it from the top of the page to the bottom.
		?>
		<script type='text/javascript'>
		    var menu = document.getElementById( 'feedback-export' ),
                wrapper = document.getElementsByClassName( 'wrap' )[0];
            <?php if ( 'edit-feedback' === $current_screen->id ) : ?>
            wrapper.appendChild(menu);
            <?php endif; ?>
            menu.style.display = 'block';
		</script>
		<?php
	}

	/**
	 * Fetch post content for a post and extract just the comment.
	 *
	 * @param int $post_id The post id to fetch the content for.
	 *
	 * @return string Trimmed post comment.
	 *
	 * @codeCoverageIgnore
	 */
	public function get_post_content_for_csv_export( $post_id ) {
		$post_content = get_post_field( 'post_content', $post_id );
		$content      = explode( '<!--more-->', $post_content );

		return trim( $content[0] );
	}

	/**
	 * Get `_feedback_extra_fields` field from post meta data.
	 *
	 * @param int $post_id Id of the post to fetch meta data for.
	 *
	 * @return mixed
	 */
	public function get_post_meta_for_csv_export( $post_id ) {
		$md                  = get_post_meta( $post_id, '_feedback_extra_fields', true );
		$md['feedback_date'] = get_the_date( DATE_RFC3339, $post_id );
		$content_fields      = self::parse_fields_from_content( $post_id );
		$md['feedback_ip']   = ( isset( $content_fields['_feedback_ip'] ) ) ? $content_fields['_feedback_ip'] : 0;
		return $md;
	}

	/**
	 * Get parsed feedback post fields.
	 *
	 * @param int $post_id Id of the post to fetch parsed contents for.
	 *
	 * @return array
	 *
	 * @codeCoverageIgnore - No need to be covered.
	 */
	public function get_parsed_field_contents_of_post( $post_id ) {
		return self::parse_fields_from_content( $post_id );
	}

	/**
	 * Properly maps fields that are missing from the post meta data
	 * to names, that are similar to those of the post meta.
	 *
	 * @param array $parsed_post_content Parsed post content
	 *
	 * @see parse_fields_from_content for how the input data is generated.
	 *
	 * @return array Mapped fields.
	 */
	public function map_parsed_field_contents_of_post_to_field_names( $parsed_post_content ) {

		$mapped_fields = array();

		$field_mapping = array(
			'_feedback_subject'      => __( 'Contact Form', 'jetpack' ),
			'_feedback_author'       => '1_Name',
			'_feedback_author_email' => '2_Email',
			'_feedback_author_url'   => '3_Website',
			'_feedback_main_comment' => '4_Comment',
			'_feedback_author_ip'    => '5_IP',
		);

		foreach ( $field_mapping as $parsed_field_name => $field_name ) {
			if (
				isset( $parsed_post_content[ $parsed_field_name ] )
				&& ! empty( $parsed_post_content[ $parsed_field_name ] )
			) {
				$mapped_fields[ $field_name ] = $parsed_post_content[ $parsed_field_name ];
			}
		}

		return $mapped_fields;
	}

	/**
	 * Registers the personal data exporter.
	 *
	 * @since 6.1.1
	 *
	 * @param  array $exporters An array of personal data exporters.
	 *
	 * @return array $exporters An array of personal data exporters.
	 */
	public function register_personal_data_exporter( $exporters ) {
		$exporters['jetpack-feedback'] = array(
			'exporter_friendly_name' => __( 'Feedback', 'jetpack' ),
			'callback'               => array( $this, 'personal_data_exporter' ),
		);

		return $exporters;
	}

	/**
	 * Registers the personal data eraser.
	 *
	 * @since 6.1.1
	 *
	 * @param  array $erasers An array of personal data erasers.
	 *
	 * @return array $erasers An array of personal data erasers.
	 */
	public function register_personal_data_eraser( $erasers ) {
		$erasers['jetpack-feedback'] = array(
			'eraser_friendly_name' => __( 'Feedback', 'jetpack' ),
			'callback'             => array( $this, 'personal_data_eraser' ),
		);

		return $erasers;
	}

	/**
	 * Exports personal data.
	 *
	 * @since 6.1.1
	 *
	 * @param  string $email  Email address.
	 * @param  int    $page   Page to export.
	 *
	 * @return array  $return Associative array with keys expected by core.
	 */
	public function personal_data_exporter( $email, $page = 1 ) {
		return $this->_internal_personal_data_exporter( $email, $page );
	}

	/**
	 * Internal method for exporting personal data.
	 *
	 * Allows us to have a different signature than core expects
	 * while protecting against future core API changes.
	 *
	 * @internal
	 * @since 6.5
	 *
	 * @param  string $email    Email address.
	 * @param  int    $page     Page to export.
	 * @param  int    $per_page Number of feedbacks to process per page. Internal use only (testing)
	 *
	 * @return array            Associative array with keys expected by core.
	 */
	public function _internal_personal_data_exporter( $email, $page = 1, $per_page = 250 ) {
		$export_data = array();
		$post_ids    = $this->personal_data_post_ids_by_email( $email, $per_page, $page );

		foreach ( $post_ids as $post_id ) {
			$post_fields = $this->get_parsed_field_contents_of_post( $post_id );

			if ( ! is_array( $post_fields ) || empty( $post_fields['_feedback_subject'] ) ) {
				continue; // Corrupt data.
			}

			$post_fields['_feedback_main_comment'] = $this->get_post_content_for_csv_export( $post_id );
			$post_fields                           = $this->map_parsed_field_contents_of_post_to_field_names( $post_fields );

			if ( ! is_array( $post_fields ) || empty( $post_fields ) ) {
				continue; // No fields to export.
			}

			$post_meta = $this->get_post_meta_for_csv_export( $post_id );
			$post_meta = is_array( $post_meta ) ? $post_meta : array();

			$post_export_data = array();
			$post_data        = array_merge( $post_fields, $post_meta );
			ksort( $post_data );

			foreach ( $post_data as $post_data_key => $post_data_value ) {
				$post_export_data[] = array(
					'name'  => preg_replace( '/^[0-9]+_/', '', $post_data_key ),
					'value' => $post_data_value,
				);
			}

			$export_data[] = array(
				'group_id'    => 'feedback',
				'group_label' => __( 'Feedback', 'jetpack' ),
				'item_id'     => 'feedback-' . $post_id,
				'data'        => $post_export_data,
			);
		}

		return array(
			'data' => $export_data,
			'done' => count( $post_ids ) < $per_page,
		);
	}

	/**
	 * Erases personal data.
	 *
	 * @since 6.1.1
	 *
	 * @param  string $email Email address.
	 * @param  int    $page  Page to erase.
	 *
	 * @return array         Associative array with keys expected by core.
	 */
	public function personal_data_eraser( $email, $page = 1 ) {
		return $this->_internal_personal_data_eraser( $email, $page );
	}

	/**
	 * Internal method for erasing personal data.
	 *
	 * Allows us to have a different signature than core expects
	 * while protecting against future core API changes.
	 *
	 * @internal
	 * @since 6.5
	 *
	 * @param  string $email    Email address.
	 * @param  int    $page     Page to erase.
	 * @param  int    $per_page Number of feedbacks to process per page. Internal use only (testing)
	 *
	 * @return array            Associative array with keys expected by core.
	 */
	public function _internal_personal_data_eraser( $email, $page = 1, $per_page = 250 ) {
		$removed      = false;
		$retained     = false;
		$messages     = array();
		$option_name  = sprintf( '_jetpack_pde_feedback_%s', md5( $email ) );
		$last_post_id = 1 === $page ? 0 : get_option( $option_name, 0 );
		$post_ids     = $this->personal_data_post_ids_by_email( $email, $per_page, $page, $last_post_id );

		foreach ( $post_ids as $post_id ) {
			/**
			 * Filters whether to erase a particular Feedback post.
			 *
			 * @since 6.3.0
			 *
			 * @param bool|string $prevention_message Whether to apply erase the Feedback post (bool).
			 *                                        Custom prevention message (string). Default true.
			 * @param int         $post_id            Feedback post ID.
			 */
			$prevention_message = apply_filters( 'grunion_contact_form_delete_feedback_post', true, $post_id );

			if ( true !== $prevention_message ) {
				if ( $prevention_message && is_string( $prevention_message ) ) {
					$messages[] = esc_html( $prevention_message );
				} else {
					$messages[] = sprintf(
					// translators: %d: Post ID.
						__( 'Feedback ID %d could not be removed at this time.', 'jetpack' ),
						$post_id
					);
				}

				$retained = true;

				continue;
			}

			if ( wp_delete_post( $post_id, true ) ) {
				$removed = true;
			} else {
				$retained   = true;
				$messages[] = sprintf(
				// translators: %d: Post ID.
					__( 'Feedback ID %d could not be removed at this time.', 'jetpack' ),
					$post_id
				);
			}
		}

		$done = count( $post_ids ) < $per_page;

		if ( $done ) {
			delete_option( $option_name );
		} else {
			update_option( $option_name, (int) $post_id );
		}

		return array(
			'items_removed'  => $removed,
			'items_retained' => $retained,
			'messages'       => $messages,
			'done'           => $done,
		);
	}

	/**
	 * Queries personal data by email address.
	 *
	 * @since 6.1.1
	 *
	 * @param  string $email        Email address.
	 * @param  int    $per_page     Post IDs per page. Default is `250`.
	 * @param  int    $page         Page to query. Default is `1`.
	 * @param  int    $last_post_id Page to query. Default is `0`. If non-zero, used instead of $page.
	 *
	 * @return array An array of post IDs.
	 */
	public function personal_data_post_ids_by_email( $email, $per_page = 250, $page = 1, $last_post_id = 0 ) {
		add_filter( 'posts_search', array( $this, 'personal_data_search_filter' ) );

		$this->pde_last_post_id_erased = $last_post_id;
		$this->pde_email_address       = $email;

		$post_ids = get_posts(
			array(
				'post_type'        => 'feedback',
				'post_status'      => 'publish',
				// This search parameter gets overwritten in ->personal_data_search_filter()
				's'                => '..PDE..AUTHOR EMAIL:..PDE..',
				'sentence'         => true,
				'order'            => 'ASC',
				'orderby'          => 'ID',
				'fields'           => 'ids',
				'posts_per_page'   => $per_page,
				'paged'            => $last_post_id ? 1 : $page,
				'suppress_filters' => false,
			)
		);

		$this->pde_last_post_id_erased = 0;
		$this->pde_email_address       = '';

		remove_filter( 'posts_search', array( $this, 'personal_data_search_filter' ) );

		return $post_ids;
	}

	/**
	 * Filters searches by email address.
	 *
	 * @since 6.1.1
	 *
	 * @param  string $search SQL where clause.
	 *
	 * @return array          Filtered SQL where clause.
	 */
	public function personal_data_search_filter( $search ) {
		global $wpdb;

		/*
		 * Limits search to `post_content` only, and we only match the
		 * author's email address whenever it's on a line by itself.
		 */
		if ( $this->pde_email_address && false !== strpos( $search, '..PDE..AUTHOR EMAIL:..PDE..' ) ) {
			$search = $wpdb->prepare(
				" AND (
					{$wpdb->posts}.post_content LIKE %s
					OR {$wpdb->posts}.post_content LIKE %s
				)",
				// `chr( 10 )` = `\n`, `chr( 13 )` = `\r`
				'%' . $wpdb->esc_like( chr( 10 ) . 'AUTHOR EMAIL: ' . $this->pde_email_address . chr( 10 ) ) . '%',
				'%' . $wpdb->esc_like( chr( 13 ) . 'AUTHOR EMAIL: ' . $this->pde_email_address . chr( 13 ) ) . '%'
			);

			if ( $this->pde_last_post_id_erased ) {
				$search .= $wpdb->prepare( " AND {$wpdb->posts}.ID > %d", $this->pde_last_post_id_erased );
			}
		}

		return $search;
	}

	/**
	 * Prepares feedback post data for CSV export.
	 *
	 * @param array $post_ids Post IDs to fetch the data for. These need to be Feedback posts.
	 *
	 * @return array
	 */
	public function get_export_data_for_posts( $post_ids ) {

		$posts_data  = array();
		$field_names = array();
		$result      = array();

		/**
		 * Fetch posts and get the possible field names for later use
		 */
		foreach ( $post_ids as $post_id ) {

			/**
			 * Fetch post main data, because we need the subject and author data for the feedback form.
			 */
			$post_real_data = $this->get_parsed_field_contents_of_post( $post_id );

			/**
			 * If `$post_real_data` is not an array or there is no `_feedback_subject` set,
			 * then something must be wrong with the feedback post. Skip it.
			 */
			if ( ! is_array( $post_real_data ) || ! isset( $post_real_data['_feedback_subject'] ) ) {
				continue;
			}

			/**
			 * Fetch main post comment. This is from the default textarea fields.
			 * If it is non-empty, then we add it to data, otherwise skip it.
			 */
			$post_comment_content = $this->get_post_content_for_csv_export( $post_id );
			if ( ! empty( $post_comment_content ) ) {
				$post_real_data['_feedback_main_comment'] = $post_comment_content;
			}

			/**
			 * Map parsed fields to proper field names
			 */
			$mapped_fields = $this->map_parsed_field_contents_of_post_to_field_names( $post_real_data );

			/**
			 * Fetch post meta data.
			 */
			$post_meta_data = $this->get_post_meta_for_csv_export( $post_id );

			/**
			 * If `$post_meta_data` is not an array or if it is empty, then there is no
			 * extra feedback to work with. Create an empty array.
			 */
			if ( ! is_array( $post_meta_data ) || empty( $post_meta_data ) ) {
				$post_meta_data = array();
			}

			/**
			 * Prepend the feedback subject to the list of fields.
			 */
			$post_meta_data = array_merge(
				$mapped_fields,
				$post_meta_data
			);

			/**
			 * Save post metadata for later usage.
			 */
			$posts_data[ $post_id ] = $post_meta_data;

			/**
			 * Save field names, so we can use them as header fields later in the CSV.
			 */
			$field_names = array_merge( $field_names, array_keys( $post_meta_data ) );
		}

		/**
		 * Make sure the field names are unique, because we don't want duplicate data.
		 */
		$field_names = array_unique( $field_names );

		/**
		 * Sort the field names by the field id number
		 */
		sort( $field_names, SORT_NUMERIC );

		/**
		 * Loop through every post, which is essentially CSV row.
		 */
		foreach ( $posts_data as $post_id => $single_post_data ) {

			/**
			 * Go through all the possible fields and check if the field is available
			 * in the current post.
			 *
			 * If it is - add the data as a value.
			 * If it is not - add an empty string, which is just a placeholder in the CSV.
			 */
			foreach ( $field_names as $single_field_name ) {
				if (
					isset( $single_post_data[ $single_field_name ] )
					&& ! empty( $single_post_data[ $single_field_name ] )
				) {
					$result[ $single_field_name ][] = trim( $single_post_data[ $single_field_name ] );
				} else {
					$result[ $single_field_name ][] = '';
				}
			}
		}

		return $result;
	}

	/**
	 * download as a csv a contact form or all of them in a csv file
	 */
	function download_feedback_as_csv() {
		if ( empty( $_POST['feedback_export_nonce'] ) ) {
			return;
		}

		check_admin_referer( 'feedback_export', 'feedback_export_nonce' );

		if ( ! current_user_can( 'export' ) ) {
			return;
		}

		$args = array(
			'posts_per_page'   => -1,
			'post_type'        => 'feedback',
			'post_status'      => 'publish',
			'order'            => 'ASC',
			'fields'           => 'ids',
			'suppress_filters' => false,
		);

		$filename = date( 'Y-m-d' ) . '-feedback-export.csv';

		// Check if we want to download all the feedbacks or just a certain contact form
		if ( ! empty( $_POST['post'] ) && $_POST['post'] !== 'all' ) {
			$args['post_parent'] = (int) $_POST['post'];
			$filename            = date( 'Y-m-d' ) . '-' . str_replace( '&nbsp;', '-', get_the_title( (int) $_POST['post'] ) ) . '.csv';
		}

		$feedbacks = get_posts( $args );

		if ( empty( $feedbacks ) ) {
			return;
		}

		$filename = sanitize_file_name( $filename );

		/**
		 * Prepare data for export.
		 */
		$data = $this->get_export_data_for_posts( $feedbacks );

		/**
		 * If `$data` is empty, there's nothing we can do below.
		 */
		if ( ! is_array( $data ) || empty( $data ) ) {
			return;
		}

		/**
		 * Extract field names from `$data` for later use.
		 */
		$fields = array_keys( $data );

		/**
		 * Count how many rows will be exported.
		 */
		$row_count = count( reset( $data ) );

		// Forces the download of the CSV instead of echoing
		header( 'Content-Disposition: attachment; filename=' . $filename );
		header( 'Pragma: no-cache' );
		header( 'Expires: 0' );
		header( 'Content-Type: text/csv; charset=utf-8' );

		$output = fopen( 'php://output', 'w' );

		/**
		 * Print CSV headers
		 */
		fputcsv( $output, $fields );

		/**
		 * Print rows to the output.
		 */
		for ( $i = 0; $i < $row_count; $i ++ ) {

			$current_row = array();

			/**
			 * Put all the fields in `$current_row` array.
			 */
			foreach ( $fields as $single_field_name ) {
				$current_row[] = $this->esc_csv( $data[ $single_field_name ][ $i ] );
			}

			/**
			 * Output the complete CSV row
			 */
			fputcsv( $output, $current_row );
		}

		fclose( $output );
	}

	/**
	 * Escape a string to be used in a CSV context
	 *
	 * Malicious input can inject formulas into CSV files, opening up the possibility for phishing attacks and
	 * disclosure of sensitive information.
	 *
	 * Additionally, Excel exposes the ability to launch arbitrary commands through the DDE protocol.
	 *
	 * @see https://www.contextis.com/en/blog/comma-separated-vulnerabilities
	 *
	 * @param string $field
	 *
	 * @return string
	 */
	public function esc_csv( $field ) {
		$active_content_triggers = array( '=', '+', '-', '@' );

		if ( in_array( mb_substr( $field, 0, 1 ), $active_content_triggers, true ) ) {
			$field = "'" . $field;
		}

		return $field;
	}

	/**
	 * Returns a string of HTML <option> items from an array of posts
	 *
	 * @return string a string of HTML <option> items
	 */
	protected function get_feedbacks_as_options() {
		$options = '';

		// Get the feedbacks' parents' post IDs
		$feedbacks = get_posts(
			array(
				'fields'           => 'id=>parent',
				'posts_per_page'   => 100000,
				'post_type'        => 'feedback',
				'post_status'      => 'publish',
				'suppress_filters' => false,
			)
		);
		$parents   = array_unique( array_values( $feedbacks ) );

		$posts = get_posts(
			array(
				'orderby'          => 'ID',
				'posts_per_page'   => 1000,
				'post_type'        => 'any',
				'post__in'         => array_values( $parents ),
				'suppress_filters' => false,
			)
		);

		// creates the string of <option> elements
		foreach ( $posts as $post ) {
			$options .= sprintf( '<option value="%s">%s</option>', esc_attr( $post->ID ), esc_html( $post->post_title ) );
		}

		return $options;
	}

	/**
	 * Get the names of all the form's fields
	 *
	 * @param  array|int $posts the post we want the fields of
	 *
	 * @return array     the array of fields
	 *
	 * @deprecated As this is no longer necessary as of the CSV export rewrite. - 2015-12-29
	 */
	protected function get_field_names( $posts ) {
		$posts      = (array) $posts;
		$all_fields = array();

		foreach ( $posts as $post ) {
			$fields = self::parse_fields_from_content( $post );

			if ( isset( $fields['_feedback_all_fields'] ) ) {
				$extra_fields = array_keys( $fields['_feedback_all_fields'] );
				$all_fields   = array_merge( $all_fields, $extra_fields );
			}
		}

		$all_fields = array_unique( $all_fields );
		return $all_fields;
	}

	public static function parse_fields_from_content( $post_id ) {
		static $post_fields;

		if ( ! is_array( $post_fields ) ) {
			$post_fields = array();
		}

		if ( isset( $post_fields[ $post_id ] ) ) {
			return $post_fields[ $post_id ];
		}

		$all_values   = array();
		$post_content = get_post_field( 'post_content', $post_id );
		$content      = explode( '<!--more-->', $post_content );
		$lines        = array();

		if ( count( $content ) > 1 ) {
			$content  = str_ireplace( array( '<br />', ')</p>' ), '', $content[1] );
			$one_line = preg_replace( '/\s+/', ' ', $content );
			$one_line = preg_replace( '/.*Array \( (.*)\)/', '$1', $one_line );

			preg_match_all( '/\[([^\]]+)\] =\&gt\; ([^\[]+)/', $one_line, $matches );

			if ( count( $matches ) > 1 ) {
				$all_values = array_combine( array_map( 'trim', $matches[1] ), array_map( 'trim', $matches[2] ) );
			}

			$lines = array_filter( explode( "\n", $content ) );
		}

		$var_map = array(
			'AUTHOR'       => '_feedback_author',
			'AUTHOR EMAIL' => '_feedback_author_email',
			'AUTHOR URL'   => '_feedback_author_url',
			'SUBJECT'      => '_feedback_subject',
			'IP'           => '_feedback_ip',
		);

		$fields = array();

		foreach ( $lines as $line ) {
			$vars = explode( ': ', $line, 2 );
			if ( ! empty( $vars ) ) {
				if ( isset( $var_map[ $vars[0] ] ) ) {
					$fields[ $var_map[ $vars[0] ] ] = self::strip_tags( trim( $vars[1] ) );
				}
			}
		}

		$fields['_feedback_all_fields'] = $all_values;

		$post_fields[ $post_id ] = $fields;

		return $fields;
	}

	/**
	 * Creates a valid csv row from a post id
	 *
	 * @param  int   $post_id The id of the post
	 * @param  array $fields  An array containing the names of all the fields of the csv
	 * @return String The csv row
	 *
	 * @deprecated This is no longer needed, as of the CSV export rewrite.
	 */
	protected static function make_csv_row_from_feedback( $post_id, $fields ) {
		$content_fields = self::parse_fields_from_content( $post_id );
		$all_fields     = array();

		if ( isset( $content_fields['_feedback_all_fields'] ) ) {
			$all_fields = $content_fields['_feedback_all_fields'];
		}

		// Overwrite the parsed content with the content we stored in post_meta in a better format.
		$extra_fields = get_post_meta( $post_id, '_feedback_extra_fields', true );
		foreach ( $extra_fields as $extra_field => $extra_value ) {
			$all_fields[ $extra_field ] = $extra_value;
		}

		// The first element in all of the exports will be the subject
		$row_items[] = $content_fields['_feedback_subject'];

		// Loop the fields array in order to fill the $row_items array correctly
		foreach ( $fields as $field ) {
			if ( $field === __( 'Contact Form', 'jetpack' ) ) { // the first field will ever be the contact form, so we can continue
				continue;
			} elseif ( array_key_exists( $field, $all_fields ) ) {
				$row_items[] = $all_fields[ $field ];
			} else {
				$row_items[] = '';
			}
		}

		return $row_items;
	}

	public static function get_ip_address() {
		return isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : null;
	}
}

/**
 * Generic shortcode class.
 * Does nothing other than store structured data and output the shortcode as a string
 *
 * Not very general - specific to Grunion.
 */
class Crunion_Contact_Form_Shortcode {
	/**
	 * @var string the name of the shortcode: [$shortcode_name /]
	 */
	public $shortcode_name;

	/**
	 * @var array key => value pairs for the shortcode's attributes: [$shortcode_name key="value" ... /]
	 */
	public $attributes;

	/**
	 * @var array key => value pair for attribute defaults
	 */
	public $defaults = array();

	/**
	 * @var null|string Null for selfclosing shortcodes.  Hhe inner content of otherwise: [$shortcode_name]$content[/$shortcode_name]
	 */
	public $content;

	/**
	 * @var array Associative array of inner "child" shortcodes equivalent to the $content: [$shortcode_name][child 1/][child 2/][/$shortcode_name]
	 */
	public $fields;

	/**
	 * @var null|string The HTML of the parsed inner "child" shortcodes".  Null for selfclosing shortcodes.
	 */
	public $body;

	/**
	 * @param array       $attributes An associative array of shortcode attributes.  @see shortcode_atts()
	 * @param null|string $content Null for selfclosing shortcodes.  The inner content otherwise.
	 */
	function __construct( $attributes, $content = null ) {
		$this->attributes = $this->unesc_attr( $attributes );
		if ( is_array( $content ) ) {
			$string_content = '';
			foreach ( $content as $field ) {
				$string_content .= (string) $field;
			}

			$this->content = $string_content;
		} else {
			$this->content = $content;
		}

		$this->parse_content( $this->content );
	}

	/**
	 * Processes the shortcode's inner content for "child" shortcodes
	 *
	 * @param string $content The shortcode's inner content: [shortcode]$content[/shortcode]
	 */
	function parse_content( $content ) {
		if ( is_null( $content ) ) {
			$this->body = null;
		}

		$this->body = do_shortcode( $content );
	}

	/**
	 * Returns the value of the requested attribute.
	 *
	 * @param string $key The attribute to retrieve
	 * @return mixed
	 */
	function get_attribute( $key ) {
		return isset( $this->attributes[ $key ] ) ? $this->attributes[ $key ] : null;
	}

	function esc_attr( $value ) {
		if ( is_array( $value ) ) {
			return array_map( array( $this, 'esc_attr' ), $value );
		}

		$value = Grunion_Contact_Form_Plugin::strip_tags( $value );
		$value = _wp_specialchars( $value, ENT_QUOTES, false, true );

		// Shortcode attributes can't contain "]"
		$value = str_replace( ']', '', $value );
		$value = str_replace( ',', '&#x002c;', $value ); // store commas encoded
		$value = strtr(
			$value, array(
				'%' => '%25',
				'&' => '%26',
			)
		);

		// shortcode_parse_atts() does stripcslashes()
		$value = addslashes( $value );
		return $value;
	}

	function unesc_attr( $value ) {
		if ( is_array( $value ) ) {
			return array_map( array( $this, 'unesc_attr' ), $value );
		}

		// For back-compat with old Grunion encoding
		// Also, unencode commas
		$value = strtr(
			$value, array(
				'%26' => '&',
				'%25' => '%',
			)
		);
		$value = preg_replace( array( '/&#x0*22;/i', '/&#x0*27;/i', '/&#x0*26;/i', '/&#x0*2c;/i' ), array( '"', "'", '&', ',' ), $value );
		$value = htmlspecialchars_decode( $value, ENT_QUOTES );
		$value = Grunion_Contact_Form_Plugin::strip_tags( $value );

		return $value;
	}

	/**
	 * Generates the shortcode
	 */
	function __toString() {
		$r = "[{$this->shortcode_name} ";

		foreach ( $this->attributes as $key => $value ) {
			if ( ! $value ) {
				continue;
			}

			if ( isset( $this->defaults[ $key ] ) && $this->defaults[ $key ] == $value ) {
				continue;
			}

			if ( 'id' == $key ) {
				continue;
			}

			$value = $this->esc_attr( $value );

			if ( is_array( $value ) ) {
				$value = join( ',', $value );
			}

			if ( false === strpos( $value, "'" ) ) {
				$value = "'$value'";
			} elseif ( false === strpos( $value, '"' ) ) {
				$value = '"' . $value . '"';
			} else {
				// Shortcodes can't contain both '"' and "'".  Strip one.
				$value = str_replace( "'", '', $value );
				$value = "'$value'";
			}

			$r .= "{$key}={$value} ";
		}

		$r = rtrim( $r );

		if ( $this->fields ) {
			$r .= ']';

			foreach ( $this->fields as $field ) {
				$r .= (string) $field;
			}

			$r .= "[/{$this->shortcode_name}]";
		} else {
			$r .= '/]';
		}

		return $r;
	}
}

/**
 * Class for the contact-form shortcode.
 * Parses shortcode to output the contact form as HTML
 * Sends email and stores the contact form response (a.k.a. "feedback")
 */
class Grunion_Contact_Form extends Crunion_Contact_Form_Shortcode {
	public $shortcode_name = 'contact-form';

	/**
	 * @var WP_Error stores form submission errors
	 */
	public $errors;

	/**
	 * @var string The SHA1 hash of the attributes that comprise the form.
	 */
	public $hash;

	/**
	 * @var Grunion_Contact_Form The most recent (inclusive) contact-form shortcode processed
	 */
	static $last;

	/**
	 * @var Whatever form we are currently looking at. If processed, will become $last
	 */
	static $current_form;

	/**
	 * @var array All found forms, indexed by hash.
	 */
	static $forms = array();

	/**
	 * @var bool Whether to print the grunion.css style when processing the contact-form shortcode
	 */
	static $style = false;

	/**
	 * @var array When printing the submit button, what tags are allowed
	 */
	static $allowed_html_tags_for_submit_button = array( 'br' => array() );

	function __construct( $attributes, $content = null ) {
		global $post;

		$this->hash                 = sha1( json_encode( $attributes ) . $content );
		self::$forms[ $this->hash ] = $this;

		// Set up the default subject and recipient for this form
		$default_to      = '';
		$default_subject = '[' . get_option( 'blogname' ) . ']';

		if ( ! isset( $attributes ) || ! is_array( $attributes ) ) {
			$attributes = array();
		}

		if ( ! empty( $attributes['widget'] ) && $attributes['widget'] ) {
			$default_to      .= get_option( 'admin_email' );
			$attributes['id'] = 'widget-' . $attributes['widget'];
			$default_subject  = sprintf( _x( '%1$s Sidebar', '%1$s = blog name', 'jetpack' ), $default_subject );
		} elseif ( $post ) {
			$attributes['id'] = $post->ID;
			$default_subject  = sprintf( _x( '%1$s %2$s', '%1$s = blog name, %2$s = post title', 'jetpack' ), $default_subject, Grunion_Contact_Form_Plugin::strip_tags( $post->post_title ) );
			$post_author      = get_userdata( $post->post_author );
			$default_to      .= $post_author->user_email;
		}

		// Keep reference to $this for parsing form fields
		self::$current_form = $this;

		$this->defaults = array(
			'to'                     => $default_to,
			'subject'                => $default_subject,
			'show_subject'           => 'no', // only used in back-compat mode
			'widget'                 => 0,    // Not exposed to the user. Works with Grunion_Contact_Form_Plugin::widget_atts()
			'id'                     => null, // Not exposed to the user. Set above.
			'submit_button_text'     => __( 'Submit', 'jetpack' ),
			// These attributes come from the block editor, so use camel case instead of snake case.
			'customThankyou'         => '', // Whether to show a custom thankyou response after submitting a form. '' for no, 'message' for a custom message, 'redirect' to redirect to a new URL.
			'customThankyouMessage'  => __( 'Thank you for your submission!', 'jetpack' ), // The message to show when customThankyou is set to 'message'.
			'customThankyouRedirect' => '', // The URL to redirect to when customThankyou is set to 'redirect'.
		);

		$attributes = shortcode_atts( $this->defaults, $attributes, 'contact-form' );

		// We only enable the contact-field shortcode temporarily while processing the contact-form shortcode
		Grunion_Contact_Form_Plugin::$using_contact_form_field = true;

		parent::__construct( $attributes, $content );

		// There were no fields in the contact form. The form was probably just [contact-form /]. Build a default form.
		if ( empty( $this->fields ) ) {
			// same as the original Grunion v1 form
			$default_form = '
				[contact-field label="' . __( 'Name', 'jetpack' ) . '" type="name"  required="true" /]
				[contact-field label="' . __( 'Email', 'jetpack' ) . '" type="email" required="true" /]
				[contact-field label="' . __( 'Website', 'jetpack' ) . '" type="url" /]';

			if ( 'yes' == strtolower( $this->get_attribute( 'show_subject' ) ) ) {
				$default_form .= '
					[contact-field label="' . __( 'Subject', 'jetpack' ) . '" type="subject" /]';
			}

			$default_form .= '
				[contact-field label="' . __( 'Message', 'jetpack' ) . '" type="textarea" /]';

			$this->parse_content( $default_form );

			// Store the shortcode
			$this->store_shortcode( $default_form, $attributes, $this->hash );
		} else {
			// Store the shortcode
			$this->store_shortcode( $content, $attributes, $this->hash );
		}

		// $this->body and $this->fields have been setup.  We no longer need the contact-field shortcode.
		Grunion_Contact_Form_Plugin::$using_contact_form_field = false;
	}

	/**
	 * Store shortcode content for recall later
	 *  - used to receate shortcode when user uses do_shortcode
	 *
	 * @param string $content
	 * @param array $attributes
	 * @param string $hash
	 */
	static function store_shortcode( $content = null, $attributes = null, $hash = null ) {

		if ( $content != null and isset( $attributes['id'] ) ) {

			if ( empty( $hash ) ) {
				$hash = sha1( json_encode( $attributes ) . $content );
			}

			$shortcode_meta = get_post_meta( $attributes['id'], "_g_feedback_shortcode_{$hash}", true );

			if ( $shortcode_meta != '' or $shortcode_meta != $content ) {
				update_post_meta( $attributes['id'], "_g_feedback_shortcode_{$hash}", $content );

				// Save attributes to post_meta for later use. They're not available later in do_shortcode situations.
				update_post_meta( $attributes['id'], "_g_feedback_shortcode_atts_{$hash}", $attributes );
			}
		}
	}

	/**
	 * Toggle for printing the grunion.css stylesheet
	 *
	 * @param bool $style
	 */
	static function style( $style ) {
		$previous_style = self::$style;
		self::$style    = (bool) $style;
		return $previous_style;
	}

	/**
	 * Turn on printing of grunion.css stylesheet
	 *
	 * @see ::style()
	 * @internal
	 * @param bool $style
	 */
	static function _style_on() {
		return self::style( true );
	}

	/**
	 * The contact-form shortcode processor
	 *
	 * @param array       $attributes Key => Value pairs as parsed by shortcode_parse_atts()
	 * @param string|null $content The shortcode's inner content: [contact-form]$content[/contact-form]
	 * @return string HTML for the concat form.
	 */
	static function parse( $attributes, $content ) {
		if ( Settings::is_syncing() ) {
			return '';
		}
		// Create a new Grunion_Contact_Form object (this class)
		$form = new Grunion_Contact_Form( $attributes, $content );

		$id = $form->get_attribute( 'id' );

		if ( ! $id ) { // something terrible has happened
			return '[contact-form]';
		}

		if ( is_feed() ) {
			return '[contact-form]';
		}

		self::$last = $form;

		// Enqueue the grunion.css stylesheet if self::$style allows it
		if ( self::$style && ( empty( $_REQUEST['action'] ) || $_REQUEST['action'] != 'grunion_shortcode_to_json' ) ) {
			// Enqueue the style here instead of printing it, because if some other plugin has run the_post()+rewind_posts(),
			// (like VideoPress does), the style tag gets "printed" the first time and discarded, leaving the contact form unstyled.
			// when WordPress does the real loop.
			wp_enqueue_style( 'grunion.css' );
		}

		$r  = '';
		$r .= "<div id='contact-form-$id'>\n";

		if ( is_wp_error( $form->errors ) && $form->errors->get_error_codes() ) {
			// There are errors.  Display them
			$r .= "<div class='form-error'>\n<h3>" . __( 'Error!', 'jetpack' ) . "</h3>\n<ul class='form-errors'>\n";
			foreach ( $form->errors->get_error_messages() as $message ) {
				$r .= "\t<li class='form-error-message'>" . esc_html( $message ) . "</li>\n";
			}
			$r .= "</ul>\n</div>\n\n";
		}

		if ( isset( $_GET['contact-form-id'] )
		     && $_GET['contact-form-id'] == self::$last->get_attribute( 'id' )
		     && isset( $_GET['contact-form-sent'], $_GET['contact-form-hash'] )
		     && hash_equals( $form->hash, $_GET['contact-form-hash'] ) ) {
			// The contact form was submitted.  Show the success message/results
			$feedback_id = (int) $_GET['contact-form-sent'];

			$back_url = remove_query_arg( array( 'contact-form-id', 'contact-form-sent', '_wpnonce' ) );

			$r_success_message =
				'<h3>' . __( 'Message Sent', 'jetpack' ) .
				' (<a href="' . esc_url( $back_url ) . '">' . esc_html__( 'go back', 'jetpack' ) . '</a>)' .
				"</h3>\n\n";

			// Don't show the feedback details unless the nonce matches
			if ( $feedback_id && wp_verify_nonce( stripslashes( $_GET['_wpnonce'] ), "contact-form-sent-{$feedback_id}" ) ) {
				$r_success_message .= self::success_message( $feedback_id, $form );
			}

			/**
			 * Filter the message returned after a successful contact form submission.
			 *
			 * @module contact-form
			 *
			 * @since 1.3.1
			 *
			 * @param string $r_success_message Success message.
			 */
			$r .= apply_filters( 'grunion_contact_form_success_message', $r_success_message );
		} else {
			// Nothing special - show the normal contact form
			if ( $form->get_attribute( 'widget' ) ) {
				// Submit form to the current URL
				$url = remove_query_arg( array( 'contact-form-id', 'contact-form-sent', 'action', '_wpnonce' ) );
			} else {
				// Submit form to the post permalink
				$url = get_permalink();
			}

			// For SSL/TLS page. See RFC 3986 Section 4.2
			$url = set_url_scheme( $url );

			// May eventually want to send this to admin-post.php...
			/**
			 * Filter the contact form action URL.
			 *
			 * @module contact-form
			 *
			 * @since 1.3.1
			 *
			 * @param string $contact_form_id Contact form post URL.
			 * @param $post $GLOBALS['post'] Post global variable.
			 * @param int $id Contact Form ID.
			 */
			$url                     = apply_filters( 'grunion_contact_form_form_action', "{$url}#contact-form-{$id}", $GLOBALS['post'], $id );
			$has_submit_button_block = ! ( false === strpos( $content, 'wp-block-jetpack-button' ) );
			$form_classes            = 'contact-form commentsblock';

			if ( $has_submit_button_block ) {
				$form_classes .= ' wp-block-jetpack-contact-form';
			}

			$r .= "<form action='" . esc_url( $url ) . "' method='post' class='" . esc_attr( $form_classes ) . "'>\n";
			$r .= $form->body;

			// In new versions of the contact form block the button is an inner block
			// so the button does not need to be constructed server-side.
			if ( ! $has_submit_button_block ) {
				$r .= "\t<p class='contact-submit'>\n";

				$gutenberg_submit_button_classes = '';
				if ( ! empty( $attributes['submitButtonClasses'] ) ) {
					$gutenberg_submit_button_classes = ' ' . $attributes['submitButtonClasses'];
				}

				/**
				 * Filter the contact form submit button class attribute.
				 *
				 * @module contact-form
				 *
				 * @since 6.6.0
				 *
				 * @param string $class Additional CSS classes for button attribute.
				 */
				$submit_button_class = apply_filters( 'jetpack_contact_form_submit_button_class', 'pushbutton-wide' . $gutenberg_submit_button_classes );

				$submit_button_styles = '';
				if ( ! empty( $attributes['customBackgroundButtonColor'] ) ) {
					$submit_button_styles .= 'background-color: ' . $attributes['customBackgroundButtonColor'] . '; ';
				}
				if ( ! empty( $attributes['customTextButtonColor'] ) ) {
					$submit_button_styles .= 'color: ' . $attributes['customTextButtonColor'] . ';';
				}
				if ( ! empty( $attributes['submitButtonText'] ) ) {
					$submit_button_text = $attributes['submitButtonText'];
				} else {
					$submit_button_text = $form->get_attribute( 'submit_button_text' );
				}

				$r .= "\t\t<button type='submit' class='" . esc_attr( $submit_button_class ) . "'";
				if ( ! empty( $submit_button_styles ) ) {
					$r .= " style='" . esc_attr( $submit_button_styles ) . "'";
				}
				$r .= ">";
				$r .= wp_kses(
					      $submit_button_text,
					      self::$allowed_html_tags_for_submit_button
				      ) . "</button>";
			}

			if ( is_user_logged_in() ) {
				$r .= "\t\t" . wp_nonce_field( 'contact-form_' . $id, '_wpnonce', true, false ) . "\n"; // nonce and referer
			}

			if ( isset( $attributes['hasFormSettingsSet'] ) && $attributes['hasFormSettingsSet'] ) {
				$r .= "\t\t<input type='hidden' name='is_block' value='1' />\n";
			}
			$r .= "\t\t<input type='hidden' name='contact-form-id' value='$id' />\n";
			$r .= "\t\t<input type='hidden' name='action' value='grunion-contact-form' />\n";
			$r .= "\t\t<input type='hidden' name='contact-form-hash' value='" . esc_attr( $form->hash ) . "' />\n";

			if ( ! $has_submit_button_block ) {
				$r .= "\t</p>\n";
			}

			$r .= "</form>\n";
		}

		$r .= '</div>';

		return $r;
	}

	/**
	 * Returns a success message to be returned if the form is sent via AJAX.
	 *
	 * @param int                         $feedback_id
	 * @param object Grunion_Contact_Form $form
	 *
	 * @return string $message
	 */
	static function success_message( $feedback_id, $form ) {
		if ( 'message' === $form->get_attribute( 'customThankyou' ) ) {
			$message = wpautop( $form->get_attribute( 'customThankyouMessage' ) );
		} else {
			$message = '<blockquote class="contact-form-submission">'
			. '<p>' . join( '</p><p>', self::get_compiled_form( $feedback_id, $form ) ) . '</p>'
			. '</blockquote>';
		}

		return wp_kses(
			$message,
			array(
				'br'         => array(),
				'blockquote' => array( 'class' => array() ),
				'p'          => array(),
			)
		);
	}

	/**
	 * Returns a compiled form with labels and values in a form of  an array
	 * of lines.
	 *
	 * @param int                         $feedback_id
	 * @param object Grunion_Contact_Form $form
	 *
	 * @return array $lines
	 */
	static function get_compiled_form( $feedback_id, $form ) {
		$feedback       = get_post( $feedback_id );
		$field_ids      = $form->get_field_ids();
		$content_fields = Grunion_Contact_Form_Plugin::parse_fields_from_content( $feedback_id );

		// Maps field_ids to post_meta keys
		$field_value_map = array(
			'name'     => 'author',
			'email'    => 'author_email',
			'url'      => 'author_url',
			'subject'  => 'subject',
			'textarea' => false, // not a post_meta key.  This is stored in post_content
		);

		$compiled_form = array();

		// "Standard" field whitelist
		foreach ( $field_value_map as $type => $meta_key ) {
			if ( isset( $field_ids[ $type ] ) ) {
				$field = $form->fields[ $field_ids[ $type ] ];

				if ( $meta_key ) {
					if ( isset( $content_fields[ "_feedback_{$meta_key}" ] ) ) {
						$value = $content_fields[ "_feedback_{$meta_key}" ];
					}
				} else {
					// The feedback content is stored as the first "half" of post_content
					$value         = $feedback->post_content;
					list( $value ) = explode( '<!--more-->', $value );
					$value         = trim( $value );
				}

				$field_index                   = array_search( $field_ids[ $type ], $field_ids['all'] );
				$compiled_form[ $field_index ] = sprintf(
					'<b>%1$s:</b> %2$s<br /><br />',
					wp_kses( $field->get_attribute( 'label' ), array() ),
					self::escape_and_sanitize_field_value( $value )
				);
			}
		}

		// "Non-standard" fields
		if ( $field_ids['extra'] ) {
			// array indexed by field label (not field id)
			$extra_fields = get_post_meta( $feedback_id, '_feedback_extra_fields', true );

			/**
			 * Only get data for the compiled form if `$extra_fields` is a valid and non-empty array.
			 */
			if ( is_array( $extra_fields ) && ! empty( $extra_fields ) ) {

				$extra_field_keys = array_keys( $extra_fields );

				$i = 0;
				foreach ( $field_ids['extra'] as $field_id ) {
					$field       = $form->fields[ $field_id ];
					$field_index = array_search( $field_id, $field_ids['all'] );

					$label = $field->get_attribute( 'label' );

					$compiled_form[ $field_index ] = sprintf(
						'<b>%1$s:</b> %2$s<br /><br />',
						wp_kses( $label, array() ),
						self::escape_and_sanitize_field_value( $extra_fields[ $extra_field_keys[ $i ] ] )
					);

					$i++;
				}
			}
		}

		// Sorting lines by the field index
		ksort( $compiled_form );

		return $compiled_form;
	}

	static function escape_and_sanitize_field_value( $value ) {
        $value = str_replace( array( '[' , ']' ) ,  array( '&#91;' , '&#93;' ) , $value );
        return nl2br( wp_kses( $value, array() ) );
    }

	/**
	 * Only strip out empty string values and keep all the other values as they are.
     *
	 * @param $single_value
	 *
	 * @return bool
	 */
	static function remove_empty( $single_value ) {
		return ( $single_value !== '' );
	}

	/**
	 * The contact-field shortcode processor
	 * We use an object method here instead of a static Grunion_Contact_Form_Field class method to parse contact-field shortcodes so that we can tie them to the contact-form object.
	 *
	 * @param array       $attributes Key => Value pairs as parsed by shortcode_parse_atts()
	 * @param string|null $content The shortcode's inner content: [contact-field]$content[/contact-field]
	 * @return HTML for the contact form field
	 */
	static function parse_contact_field( $attributes, $content ) {
		// Don't try to parse contact form fields if not inside a contact form
		if ( ! Grunion_Contact_Form_Plugin::$using_contact_form_field ) {
			$att_strs = array();
			if ( ! isset( $attributes['label'] )  ) {
				$type = isset( $attributes['type'] ) ? $attributes['type'] : null;
				$attributes['label'] = self::get_default_label_from_type( $type );
			}
			foreach ( $attributes as $att => $val ) {
				if ( is_numeric( $att ) ) { // Is a valueless attribute
					$att_strs[] = esc_html( $val );
				} elseif ( isset( $val ) ) { // A regular attr - value pair
					if ( ( $att === 'options' || $att === 'values' ) && is_string( $val ) ) { // remove any empty strings
						$val = explode( ',', $val );
					}
 					if ( is_array( $val ) ) {
						$val =  array_filter( $val, array( __CLASS__, 'remove_empty' ) ); // removes any empty strings
						$att_strs[] = esc_html( $att ) . '="' . implode( ',', array_map( 'esc_html', $val ) ) . '"';
					} elseif ( is_bool( $val ) ) {
						$att_strs[] = esc_html( $att ) . '="' . esc_html( $val ? '1' : '' ) . '"';
					} else {
						$att_strs[] = esc_html( $att ) . '="' . esc_html( $val ) . '"';
					}
				}
			}

			$html = '[contact-field ' . implode( ' ', $att_strs );

			if ( isset( $content ) && ! empty( $content ) ) { // If there is content, let's add a closing tag
				$html .= ']' . esc_html( $content ) . '[/contact-field]';
			} else { // Otherwise let's add a closing slash in the first tag
				$html .= '/]';
			}

			return $html;
		}

		$form = Grunion_Contact_Form::$current_form;

		$field = new Grunion_Contact_Form_Field( $attributes, $content, $form );

		$field_id = $field->get_attribute( 'id' );
		if ( $field_id ) {
			$form->fields[ $field_id ] = $field;
		} else {
			$form->fields[] = $field;
		}

		if (
			isset( $_POST['action'] ) && 'grunion-contact-form' === $_POST['action']
			&&
			isset( $_POST['contact-form-id'] ) && $form->get_attribute( 'id' ) == $_POST['contact-form-id']
			&&
			isset( $_POST['contact-form-hash'] ) && hash_equals( $form->hash, $_POST['contact-form-hash'] )
		) {
			// If we're processing a POST submission for this contact form, validate the field value so we can show errors as necessary.
			$field->validate();
		}

		// Output HTML
		return $field->render();
	}

	static function get_default_label_from_type( $type ) {
		switch ( $type ) {
			case 'text':
				return __( 'Text', 'jetpack' );
			case 'name':
				return __( 'Name', 'jetpack' );
			case 'email':
				return __( 'Email', 'jetpack' );
			case 'url':
				return __( 'Website', 'jetpack' );
			case 'date':
				return __( 'Date', 'jetpack' );
			case 'telephone':
				return __( 'Phone', 'jetpack' );
			case 'textarea':
				return __( 'Message', 'jetpack' );
			case 'checkbox':
				return __( 'Checkbox', 'jetpack' );
			case 'checkbox-multiple':
				return __( 'Choose several', 'jetpack' );
			case 'radio':
				return __( 'Choose one', 'jetpack' );
			case 'select':
				return __( 'Select one', 'jetpack' );
			default:
				return null;
		}
	}

	/**
	 * Loops through $this->fields to generate a (structured) list of field IDs.
	 *
	 * Important: Currently the whitelisted fields are defined as follows:
	 *  `name`, `email`, `url`, `subject`, `textarea`
	 *
	 * If you need to add new fields to the Contact Form, please don't add them
	 * to the whitelisted fields and leave them as extra fields.
	 *
	 * The reasoning behind this is that both the admin Feedback view and the CSV
	 * export will not include any fields that are added to the list of
	 * whitelisted fields without taking proper care to add them to all the
	 * other places where they accessed/used/saved.
	 *
	 * The safest way to add new fields is to add them to the dropdown and the
	 * HTML list ( @see Grunion_Contact_Form_Field::render ) and don't add them
	 * to the list of whitelisted fields. This way they will become a part of the
	 * `extra fields` which are saved in the post meta and will be properly
	 * handled by the admin Feedback view and the CSV Export without any extra
	 * work.
	 *
	 * If there is need to add a field to the whitelisted fields, then please
	 * take proper care to add logic to handle the field in the following places:
	 *
	 *  - Below in the switch statement - so the field is recognized as whitelisted.
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
	 * @return array
	 */
	function get_field_ids() {
		$field_ids = array(
			'all'   => array(), // array of all field_ids
			'extra' => array(), // array of all non-whitelisted field IDs

			// Whitelisted "standard" field IDs:
			// 'email'    => field_id,
			// 'name'     => field_id,
			// 'url'      => field_id,
			// 'subject'  => field_id,
			// 'textarea' => field_id,
		);

		foreach ( $this->fields as $id => $field ) {
			$field_ids['all'][] = $id;

			$type = $field->get_attribute( 'type' );
			if ( isset( $field_ids[ $type ] ) ) {
				// This type of field is already present in our whitelist of "standard" fields for this form
				// Put it in extra
				$field_ids['extra'][] = $id;
				continue;
			}

			/**
			 * See method description before modifying the switch cases.
			 */
			switch ( $type ) {
				case 'email':
				case 'name':
				case 'url':
				case 'subject':
				case 'textarea':
					$field_ids[ $type ] = $id;
					break;
				default:
					// Put everything else in extra
					$field_ids['extra'][] = $id;
			}
		}

		return $field_ids;
	}

	/**
	 * Process the contact form's POST submission
	 * Stores feedback.  Sends email.
	 */
	function process_submission() {
		global $post;

		$plugin = Grunion_Contact_Form_Plugin::init();

		$id     = $this->get_attribute( 'id' );
		$to     = $this->get_attribute( 'to' );
		$widget = $this->get_attribute( 'widget' );

		$contact_form_subject = $this->get_attribute( 'subject' );

		$to     = str_replace( ' ', '', $to );
		$emails = explode( ',', $to );

		$valid_emails = array();

		foreach ( (array) $emails as $email ) {
			if ( ! is_email( $email ) ) {
				continue;
			}

			if ( function_exists( 'is_email_address_unsafe' ) && is_email_address_unsafe( $email ) ) {
				continue;
			}

			$valid_emails[] = $email;
		}

		// No one to send it to, which means none of the "to" attributes are valid emails.
		// Use default email instead.
		if ( ! $valid_emails ) {
			$valid_emails = $this->defaults['to'];
		}

		$to = $valid_emails;

		// Last ditch effort to set a recipient if somehow none have been set.
		if ( empty( $to ) ) {
			$to = get_option( 'admin_email' );
		}

		// Make sure we're processing the form we think we're processing... probably a redundant check.
		if ( $widget ) {
			if ( 'widget-' . $widget != $_POST['contact-form-id'] ) {
				return false;
			}
		} else {
			if ( $post->ID != $_POST['contact-form-id'] ) {
				return false;
			}
		}

		$field_ids = $this->get_field_ids();

		// Initialize all these "standard" fields to null
		$comment_author_email = $comment_author_email_label = // v
		$comment_author       = $comment_author_label       = // v
		$comment_author_url   = $comment_author_url_label   = // v
		$comment_content      = $comment_content_label = null;

		// For each of the "standard" fields, grab their field label and value.
		if ( isset( $field_ids['name'] ) ) {
			$field          = $this->fields[ $field_ids['name'] ];
			$comment_author = Grunion_Contact_Form_Plugin::strip_tags(
				stripslashes(
					/** This filter is already documented in core/wp-includes/comment-functions.php */
					apply_filters( 'pre_comment_author_name', addslashes( $field->value ) )
				)
			);
			$comment_author_label = Grunion_Contact_Form_Plugin::strip_tags( $field->get_attribute( 'label' ) );
		}

		if ( isset( $field_ids['email'] ) ) {
			$field                = $this->fields[ $field_ids['email'] ];
			$comment_author_email = Grunion_Contact_Form_Plugin::strip_tags(
				stripslashes(
					/** This filter is already documented in core/wp-includes/comment-functions.php */
					apply_filters( 'pre_comment_author_email', addslashes( $field->value ) )
				)
			);
			$comment_author_email_label = Grunion_Contact_Form_Plugin::strip_tags( $field->get_attribute( 'label' ) );
		}

		if ( isset( $field_ids['url'] ) ) {
			$field              = $this->fields[ $field_ids['url'] ];
			$comment_author_url = Grunion_Contact_Form_Plugin::strip_tags(
				stripslashes(
					/** This filter is already documented in core/wp-includes/comment-functions.php */
					apply_filters( 'pre_comment_author_url', addslashes( $field->value ) )
				)
			);
			if ( 'http://' == $comment_author_url ) {
				$comment_author_url = '';
			}
			$comment_author_url_label = Grunion_Contact_Form_Plugin::strip_tags( $field->get_attribute( 'label' ) );
		}

		if ( isset( $field_ids['textarea'] ) ) {
			$field                 = $this->fields[ $field_ids['textarea'] ];
			$comment_content       = trim( Grunion_Contact_Form_Plugin::strip_tags( $field->value ) );
			$comment_content_label = Grunion_Contact_Form_Plugin::strip_tags( $field->get_attribute( 'label' ) );
		}

		if ( isset( $field_ids['subject'] ) ) {
			$field = $this->fields[ $field_ids['subject'] ];
			if ( $field->value ) {
				$contact_form_subject = Grunion_Contact_Form_Plugin::strip_tags( $field->value );
			}
		}

		$all_values = $extra_values = array();
		$i          = 1; // Prefix counter for stored metadata

		// For all fields, grab label and value
		foreach ( $field_ids['all'] as $field_id ) {
			$field = $this->fields[ $field_id ];
			$label = $i . '_' . $field->get_attribute( 'label' );
			$value = $field->value;

			$all_values[ $label ] = $value;
			$i++; // Increment prefix counter for the next field
		}

		// For the "non-standard" fields, grab label and value
		// Extra fields have their prefix starting from count( $all_values ) + 1
		foreach ( $field_ids['extra'] as $field_id ) {
			$field = $this->fields[ $field_id ];
			$label = $i . '_' . $field->get_attribute( 'label' );
			$value = $field->value;

			if ( is_array( $value ) ) {
				$value = implode( ', ', $value );
			}

			$extra_values[ $label ] = $value;
			$i++; // Increment prefix counter for the next extra field
		}

		if ( isset( $_REQUEST['is_block'] ) && $_REQUEST['is_block'] ) {
			$extra_values['is_block'] = true;
		}

		$contact_form_subject = trim( $contact_form_subject );

		$comment_author_IP = Grunion_Contact_Form_Plugin::get_ip_address();

		$vars = array( 'comment_author', 'comment_author_email', 'comment_author_url', 'contact_form_subject', 'comment_author_IP' );
		foreach ( $vars as $var ) {
			$$var = str_replace( array( "\n", "\r" ), '', $$var );
		}

		// Ensure that Akismet gets all of the relevant information from the contact form,
		// not just the textarea field and predetermined subject.
		$akismet_vars                    = compact( $vars );
		$akismet_vars['comment_content'] = $comment_content;

		foreach ( array_merge( $field_ids['all'], $field_ids['extra'] ) as $field_id ) {
			$field = $this->fields[ $field_id ];

			// Skip any fields that are just a choice from a pre-defined list. They wouldn't have any value
			// from a spam-filtering point of view.
			if ( in_array( $field->get_attribute( 'type' ), array( 'select', 'checkbox', 'checkbox-multiple', 'radio' ) ) ) {
				continue;
			}

			// Normalize the label into a slug.
			$field_slug = trim( // Strip all leading/trailing dashes.
				preg_replace(   // Normalize everything to a-z0-9_-
					'/[^a-z0-9_]+/',
					'-',
					strtolower( $field->get_attribute( 'label' ) ) // Lowercase
				),
				'-'
			);

			$field_value = ( is_array( $field->value ) ) ? trim( implode( ', ', $field->value ) ) : trim( $field->value );

			// Skip any values that are already in the array we're sending.
			if ( $field_value && in_array( $field_value, $akismet_vars ) ) {
				continue;
			}

			$akismet_vars[ 'contact_form_field_' . $field_slug ] = $field_value;
		}

		$spam           = '';
		$akismet_values = $plugin->prepare_for_akismet( $akismet_vars );

		// Is it spam?
		/** This filter is already documented in modules/contact-form/admin.php */
		$is_spam = apply_filters( 'jetpack_contact_form_is_spam', false, $akismet_values );
		if ( is_wp_error( $is_spam ) ) { // WP_Error to abort
			return $is_spam; // abort
		} elseif ( $is_spam === true ) {  // TRUE to flag a spam
			$spam = '***SPAM*** ';
		}

		if ( ! $comment_author ) {
			$comment_author = $comment_author_email;
		}

		/**
		 * Filter the email where a submitted feedback is sent.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 *
		 * @param string|array $to Array of valid email addresses, or single email address.
		 */
		$to            = (array) apply_filters( 'contact_form_to', $to );
		$reply_to_addr = $to[0]; // get just the address part before the name part is added

		foreach ( $to as $to_key => $to_value ) {
			$to[ $to_key ] = Grunion_Contact_Form_Plugin::strip_tags( $to_value );
			$to[ $to_key ] = self::add_name_to_address( $to_value );
		}

		$blog_url        = wp_parse_url( site_url() );
		$from_email_addr = 'wordpress@' . $blog_url['host'];

		if ( ! empty( $comment_author_email ) ) {
			$reply_to_addr = $comment_author_email;
		}

		$headers = 'From: "' . $comment_author . '" <' . $from_email_addr . ">\r\n" .
		           'Reply-To: "' . $comment_author . '" <' . $reply_to_addr . ">\r\n";

		// Build feedback reference
		$feedback_time  = current_time( 'mysql' );
		$feedback_title = "{$comment_author} - {$feedback_time}";
		$feedback_id    = md5( $feedback_title );

		$entry_values = array(
			'entry_title'     => the_title_attribute( 'echo=0' ),
			'entry_permalink' => esc_url( get_permalink( get_the_ID() ) ),
			'feedback_id'     => $feedback_id,
		);

		$all_values = array_merge( $all_values, $entry_values );

		/** This filter is already documented in modules/contact-form/admin.php */
		$subject = apply_filters( 'contact_form_subject', $contact_form_subject, $all_values );
		$url     = $widget ? home_url( '/' ) : get_permalink( $post->ID );

		$date_time_format = _x( '%1$s \a\t %2$s', '{$date_format} \a\t {$time_format}', 'jetpack' );
		$date_time_format = sprintf( $date_time_format, get_option( 'date_format' ), get_option( 'time_format' ) );
		$time             = date_i18n( $date_time_format, current_time( 'timestamp' ) );

		// keep a copy of the feedback as a custom post type
		$feedback_status = $is_spam === true ? 'spam' : 'publish';

		foreach ( (array) $akismet_values as $av_key => $av_value ) {
			$akismet_values[ $av_key ] = Grunion_Contact_Form_Plugin::strip_tags( $av_value );
		}

		foreach ( (array) $all_values as $all_key => $all_value ) {
			$all_values[ $all_key ] = Grunion_Contact_Form_Plugin::strip_tags( $all_value );
		}

		foreach ( (array) $extra_values as $ev_key => $ev_value ) {
			$extra_values[ $ev_key ] = Grunion_Contact_Form_Plugin::strip_tags( $ev_value );
		}

		/*
		 We need to make sure that the post author is always zero for contact
		 * form submissions.  This prevents export/import from trying to create
		 * new users based on form submissions from people who were logged in
		 * at the time.
		 *
		 * Unfortunately wp_insert_post() tries very hard to make sure the post
		 * author gets the currently logged in user id.  That is how we ended up
		 * with this work around. */
		add_filter( 'wp_insert_post_data', array( $plugin, 'insert_feedback_filter' ), 10, 2 );

		$post_id = wp_insert_post(
			array(
				'post_date'    => addslashes( $feedback_time ),
				'post_type'    => 'feedback',
				'post_status'  => addslashes( $feedback_status ),
				'post_parent'  => (int) $post->ID,
				'post_title'   => addslashes( wp_kses( $feedback_title, array() ) ),
				'post_content' => addslashes( wp_kses( $comment_content . "\n<!--more-->\n" . "AUTHOR: {$comment_author}\nAUTHOR EMAIL: {$comment_author_email}\nAUTHOR URL: {$comment_author_url}\nSUBJECT: {$subject}\nIP: {$comment_author_IP}\n" . @print_r( $all_values, true ), array() ) ), // so that search will pick up this data
				'post_name'    => $feedback_id,
			)
		);

		// once insert has finished we don't need this filter any more
		remove_filter( 'wp_insert_post_data', array( $plugin, 'insert_feedback_filter' ), 10 );

		update_post_meta( $post_id, '_feedback_extra_fields', $this->addslashes_deep( $extra_values ) );

		if ( 'publish' == $feedback_status ) {
			// Increase count of unread feedback.
			$unread = get_option( 'feedback_unread_count', 0 ) + 1;
			update_option( 'feedback_unread_count', $unread );
		}

		if ( defined( 'AKISMET_VERSION' ) ) {
			update_post_meta( $post_id, '_feedback_akismet_values', $this->addslashes_deep( $akismet_values ) );
		}

		/**
		 * Fires after the feedback post for the contact form submission has been inserted.
		 *
		 * @module contact-form
		 *
		 * @since 8.6.0
		 *
		 * @param integer $post_id The post id that contains the contact form data.
		 * @param array   $this->fields An array containg the form's Grunion_Contact_Form_Field objects.
		 * @param boolean $is_spam Whether the form submission has been identified as spam.
		 * @param array   $entry_values The feedback entry values.
		 */
		do_action( 'grunion_after_feedback_post_inserted', $post_id, $this->fields, $is_spam, $entry_values );

		$message = self::get_compiled_form( $post_id, $this );

		array_push(
			$message,
			'<br />',
			'<hr />',
			__( 'Time:', 'jetpack' ) . ' ' . $time . '<br />',
			__( 'IP Address:', 'jetpack' ) . ' ' . $comment_author_IP . '<br />',
			__( 'Contact Form URL:', 'jetpack' ) . ' ' . $url . '<br />'
		);

		if ( is_user_logged_in() ) {
			array_push(
				$message,
				sprintf(
					'<p>' . __( 'Sent by a verified %s user.', 'jetpack' ) . '</p>',
					isset( $GLOBALS['current_site']->site_name ) && $GLOBALS['current_site']->site_name ?
						$GLOBALS['current_site']->site_name : '"' . get_option( 'blogname' ) . '"'
				)
			);
		} else {
			array_push( $message, '<p>' . __( 'Sent by an unverified visitor to your site.', 'jetpack' ) . '</p>' );
		}

		$message = join( '', $message );

		/**
		 * Filters the message sent via email after a successful form submission.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 *
		 * @param string $message Feedback email message.
		 */
		$message = apply_filters( 'contact_form_message', $message );

		// This is called after `contact_form_message`, in order to preserve back-compat
		$message = self::wrap_message_in_html_tags( $message );

		update_post_meta( $post_id, '_feedback_email', $this->addslashes_deep( compact( 'to', 'message' ) ) );

		/**
		 * Fires right before the contact form message is sent via email to
		 * the recipient specified in the contact form.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 *
		 * @param integer $post_id Post contact form lives on
		 * @param array $all_values Contact form fields
		 * @param array $extra_values Contact form fields not included in $all_values
		 */
		do_action( 'grunion_pre_message_sent', $post_id, $all_values, $extra_values );

		// schedule deletes of old spam feedbacks
		if ( ! wp_next_scheduled( 'grunion_scheduled_delete' ) ) {
			wp_schedule_event( time() + 250, 'daily', 'grunion_scheduled_delete' );
		}

		if (
			$is_spam !== true &&
			/**
			 * Filter to choose whether an email should be sent after each successful contact form submission.
			 *
			 * @module contact-form
			 *
			 * @since 2.6.0
			 *
			 * @param bool true Should an email be sent after a form submission. Default to true.
			 * @param int $post_id Post ID.
			 */
			true === apply_filters( 'grunion_should_send_email', true, $post_id )
		) {
			self::wp_mail( $to, "{$spam}{$subject}", $message, $headers );
		} elseif (
			true === $is_spam &&
			/**
			 * Choose whether an email should be sent for each spam contact form submission.
			 *
			 * @module contact-form
			 *
			 * @since 1.3.1
			 *
			 * @param bool false Should an email be sent after a spam form submission. Default to false.
			 */
			apply_filters( 'grunion_still_email_spam', false ) == true
		) { // don't send spam by default.  Filterable.
			self::wp_mail( $to, "{$spam}{$subject}", $message, $headers );
		}

		/**
		 * Fires an action hook right after the email(s) have been sent.
		 *
		 * @module contact-form
		 *
		 * @since 7.3.0
		 *
		 * @param int $post_id Post contact form lives on.
		 * @param string|array $to Array of valid email addresses, or single email address.
		 * @param string $subject Feedback email subject.
		 * @param string $message Feedback email message.
		 * @param string|array $headers Optional. Additional headers.
		 * @param array $all_values Contact form fields.
		 * @param array $extra_values Contact form fields not included in $all_values
		 */
		do_action( 'grunion_after_message_sent', $post_id, $to, $subject, $message, $headers, $all_values, $extra_values );

		if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
			return self::success_message( $post_id, $this );
		}

		$redirect = '';
		$custom_redirect = false;
		if ( 'redirect' === $this->get_attribute( 'customThankyou' ) ) {
			$custom_redirect = true;
			$redirect        = esc_url( $this->get_attribute( 'customThankyouRedirect' ) );
		}

		if ( ! $redirect ) {
			$custom_redirect = false;
			$redirect        = wp_get_referer();
		}

		if ( ! $redirect ) { // wp_get_referer() returns false if the referer is the same as the current page.
			$custom_redirect = false;
			$redirect        = $_SERVER['REQUEST_URI'];
		}

		if ( ! $custom_redirect ) {
			$redirect = add_query_arg(
				urlencode_deep(
					array(
						'contact-form-id'   => $id,
						'contact-form-sent' => $post_id,
						'contact-form-hash' => $this->hash,
						'_wpnonce'          => wp_create_nonce( "contact-form-sent-{$post_id}" ), // wp_nonce_url HTMLencodes :( .
					)
				),
				$redirect
			);
		}

		/**
		 * Filter the URL where the reader is redirected after submitting a form.
		 *
		 * @module contact-form
		 *
		 * @since 1.9.0
		 *
		 * @param string $redirect Post submission URL.
		 * @param int $id Contact Form ID.
		 * @param int $post_id Post ID.
		 */
		$redirect = apply_filters( 'grunion_contact_form_redirect_url', $redirect, $id, $post_id );

		// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- We intentially allow external redirects here.
		wp_redirect( $redirect );
		exit;
	}

	/**
	 * Wrapper for wp_mail() that enables HTML messages with text alternatives
	 *
	 * @param string|array $to          Array or comma-separated list of email addresses to send message.
	 * @param string       $subject     Email subject.
	 * @param string       $message     Message contents.
	 * @param string|array $headers     Optional. Additional headers.
	 * @param string|array $attachments Optional. Files to attach.
	 *
	 * @return bool Whether the email contents were sent successfully.
	 */
	public static function wp_mail( $to, $subject, $message, $headers = '', $attachments = array() ) {
		add_filter( 'wp_mail_content_type', __CLASS__ . '::get_mail_content_type' );
		add_action( 'phpmailer_init', __CLASS__ . '::add_plain_text_alternative' );

		$result = wp_mail( $to, $subject, $message, $headers, $attachments );

		remove_filter( 'wp_mail_content_type', __CLASS__ . '::get_mail_content_type' );
		remove_action( 'phpmailer_init', __CLASS__ . '::add_plain_text_alternative' );

		return $result;
	}

	/**
	 * Add a display name part to an email address
	 *
	 * SpamAssassin doesn't like addresses in HTML messages that are missing display names (e.g., `foo@bar.org`
	 * instead of `"Foo Bar" <foo@bar.org>`.
	 *
	 * @param string $address
	 *
	 * @return string
	 */
	function add_name_to_address( $address ) {
		// If it's just the address, without a display name
		if ( is_email( $address ) ) {
			$address_parts = explode( '@', $address );
			$address       = sprintf( '"%s" <%s>', $address_parts[0], $address );
		}

		return $address;
	}

	/**
	 * Get the content type that should be assigned to outbound emails
	 *
	 * @return string
	 */
	static function get_mail_content_type() {
		return 'text/html';
	}

	/**
	 * Wrap a message body with the appropriate in HTML tags
	 *
	 * This helps to ensure correct parsing by clients, and also helps avoid triggering spam filtering rules
	 *
	 * @param string $body
	 *
	 * @return string
	 */
	static function wrap_message_in_html_tags( $body ) {
		// Don't do anything if the message was already wrapped in HTML tags
		// That could have be done by a plugin via filters
		if ( false !== strpos( $body, '<html' ) ) {
			return $body;
		}

		$html_message = sprintf(
			// The tabs are just here so that the raw code is correctly formatted for developers
			// They're removed so that they don't affect the final message sent to users
			str_replace(
				"\t", '',
				'<!doctype html>
				<html xmlns="http://www.w3.org/1999/xhtml">
				<body>

				%s

				</body>
				</html>'
			),
			$body
		);

		return $html_message;
	}

	/**
	 * Add a plain-text alternative part to an outbound email
	 *
	 * This makes the message more accessible to mail clients that aren't HTML-aware, and decreases the likelihood
	 * that the message will be flagged as spam.
	 *
	 * @param PHPMailer $phpmailer
	 */
	static function add_plain_text_alternative( $phpmailer ) {
		// Add an extra break so that the extra space above the <p> is preserved after the <p> is stripped out
		$alt_body = str_replace( '<p>', '<p><br />', $phpmailer->Body );

		// Convert <br> to \n breaks, to preserve the space between lines that we want to keep
		$alt_body = str_replace( array( '<br>', '<br />' ), "\n", $alt_body );

		// Convert <hr> to an plain-text equivalent, to preserve the integrity of the message
		$alt_body = str_replace( array( '<hr>', '<hr />' ), "----\n", $alt_body );

		// Trim the plain text message to remove the \n breaks that were after <doctype>, <html>, and <body>
		$phpmailer->AltBody = trim( strip_tags( $alt_body ) );
	}

	function addslashes_deep( $value ) {
		if ( is_array( $value ) ) {
			return array_map( array( $this, 'addslashes_deep' ), $value );
		} elseif ( is_object( $value ) ) {
			$vars = get_object_vars( $value );
			foreach ( $vars as $key => $data ) {
				$value->{$key} = $this->addslashes_deep( $data );
			}
			return $value;
		}

		return addslashes( $value );
	}

} // end class Grunion_Contact_Form

/**
 * Class for the contact-field shortcode.
 * Parses shortcode to output the contact form field as HTML.
 * Validates input.
 */
class Grunion_Contact_Form_Field extends Crunion_Contact_Form_Shortcode {
	public $shortcode_name = 'contact-field';

	/**
	 * @var Grunion_Contact_Form parent form
	 */
	public $form;

	/**
	 * @var string default or POSTed value
	 */
	public $value;

	/**
	 * @var bool Is the input invalid?
	 */
	public $error = false;

	/**
	 * @param array                $attributes An associative array of shortcode attributes.  @see shortcode_atts()
	 * @param null|string          $content Null for selfclosing shortcodes.  The inner content otherwise.
	 * @param Grunion_Contact_Form $form The parent form
	 */
	function __construct( $attributes, $content = null, $form = null ) {
		$attributes = shortcode_atts(
			array(
				'label'       => null,
				'type'        => 'text',
				'required'    => false,
				'options'     => array(),
				'id'          => null,
				'default'     => null,
				'values'      => null,
				'placeholder' => null,
				'class'       => null,
				'width'       => null,
			), $attributes, 'contact-field'
		);

		// special default for subject field
		if ( 'subject' == $attributes['type'] && is_null( $attributes['default'] ) && ! is_null( $form ) ) {
			$attributes['default'] = $form->get_attribute( 'subject' );
		}

		// allow required=1 or required=true
		if ( '1' == $attributes['required'] || 'true' == strtolower( $attributes['required'] ) ) {
			$attributes['required'] = true;
		} else {
			$attributes['required'] = false;
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
					$i++;
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
	 * @param string $message The error message to display on the form.
	 */
	function add_error( $message ) {
		$this->is_error = true;

		if ( ! is_wp_error( $this->form->errors ) ) {
			$this->form->errors = new WP_Error;
		}

		$this->form->errors->add( $this->get_attribute( 'id' ), $message );
	}

	/**
	 * Is the field input invalid?
	 *
	 * @see $error
	 *
	 * @return bool
	 */
	function is_error() {
		return $this->error;
	}

	/**
	 * Validates the form input
	 */
	function validate() {
		// If it's not required, there's nothing to validate
		if ( ! $this->get_attribute( 'required' ) ) {
			return;
		}

		$field_id    = $this->get_attribute( 'id' );
		$field_type  = $this->get_attribute( 'type' );
		$field_label = $this->get_attribute( 'label' );

		if ( isset( $_POST[ $field_id ] ) ) {
			if ( is_array( $_POST[ $field_id ] ) ) {
				$field_value = array_map( 'stripslashes', $_POST[ $field_id ] );
			} else {
				$field_value = stripslashes( $_POST[ $field_id ] );
			}
		} else {
			$field_value = '';
		}

		switch ( $field_type ) {
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
	 * @param string value
	 * @param int index
	 * @param string default value
	 *
	 * @return string
	 */
	public function get_option_value( $value, $index, $options ) {
		if ( empty( $value[ $index ] ) ) {
			return $options;
		}
		return $value[ $index ];
	}

	/**
	 * Outputs the HTML for this form field
	 *
	 * @return string HTML
	 */
	function render() {
		global $current_user, $user_identity;

		$field_id          = $this->get_attribute( 'id' );
		$field_type        = $this->get_attribute( 'type' );
		$field_label       = $this->get_attribute( 'label' );
		$field_required    = $this->get_attribute( 'required' );
		$field_placeholder = $this->get_attribute( 'placeholder' );
		$field_width       = $this->get_attribute( 'width' );
		$class             = 'date' === $field_type ? 'jp-contact-form-date' : $this->get_attribute( 'class' );

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

		if ( isset( $_POST[ $field_id ] ) ) {
			if ( is_array( $_POST[ $field_id ] ) ) {
				$this->value = array_map( 'stripslashes', $_POST[ $field_id ] );
			} else {
				$this->value = stripslashes( (string) $_POST[ $field_id ] );
			}
		} elseif ( isset( $_GET[ $field_id ] ) ) {
			$this->value = stripslashes( (string) $_GET[ $field_id ] );
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
			switch ( $this->get_attribute( 'type' ) ) {
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

		$rendered_field = $this->render_field( $field_type, $field_id, $field_label, $field_value, $field_class, $field_placeholder, $field_required );

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

	function render_label( $type = '', $id, $label, $required, $required_field_text ) {

		$type_class = $type ? ' ' .$type : '';
		return
			"<label
				for='" . esc_attr( $id ) . "'
				class='grunion-field-label{$type_class}" . ( $this->is_error() ? ' form-error' : '' ) . "'
				>"
				. esc_html( $label )
				. ( $required ? '<span>' . $required_field_text . '</span>' : '' )
			. "</label>\n";

	}

	function render_input_field( $type, $id, $value, $class, $placeholder, $required ) {
		return "<input
					type='". esc_attr( $type ) ."'
					name='" . esc_attr( $id ) . "'
					id='" . esc_attr( $id ) . "'
					value='" . esc_attr( $value ) . "'
					" . $class . $placeholder . '
					' . ( $required ? "required aria-required='true'" : '' ) . "
				/>\n";
	}

	function render_email_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		$field = $this->render_label( 'email', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'email', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	function render_telephone_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		$field = $this->render_label( 'telephone', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'tel', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	function render_url_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		$field = $this->render_label( 'url', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'url', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	function render_textarea_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		$field = $this->render_label( 'textarea', 'contact-form-comment-' . $id, $label, $required, $required_field_text );
		$field .= "<textarea
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

	function render_radio_field( $id, $label, $value, $class, $required, $required_field_text ) {
		$field = $this->render_label( '', $id, $label, $required, $required_field_text );
		foreach ( (array) $this->get_attribute( 'options' ) as $optionIndex => $option ) {
			$option = Grunion_Contact_Form_Plugin::strip_tags( $option );
			if ( $option ) {
				$field .= "\t\t<label class='grunion-radio-label radio" . ( $this->is_error() ? ' form-error' : '' ) . "'>";
				$field .= "<input
									type='radio'
									name='" . esc_attr( $id ) . "'
									value='" . esc_attr( $this->get_option_value( $this->get_attribute( 'values' ), $optionIndex, $option ) ) . "' "
				                    . $class
				                    . checked( $option, $value, false ) . ' '
				                    . ( $required ? "required aria-required='true'" : '' )
				              . '/> ';
				$field .= esc_html( $option ) . "</label>\n";
				$field .= "\t\t<div class='clear-form'></div>\n";
			}
		}
		return $field;
	}

	function render_checkbox_field( $id, $label, $value, $class, $required, $required_field_text ) {
		$field = "<label class='grunion-field-label checkbox" . ( $this->is_error() ? ' form-error' : '' ) . "'>";
			$field .= "\t\t<input type='checkbox' name='" . esc_attr( $id ) . "' value='" . esc_attr__( 'Yes', 'jetpack' ) . "' " . $class . checked( (bool) $value, true, false ) . ' ' . ( $required ? "required aria-required='true'" : '' ) . "/> \n";
			$field .= "\t\t" . esc_html( $label ) . ( $required ? '<span>' . $required_field_text . '</span>' : '' );
		$field .=  "</label>\n";
		$field .= "<div class='clear-form'></div>\n";
		return $field;
	}

	function render_checkbox_multiple_field( $id, $label, $value, $class, $required, $required_field_text  ) {
		$field = $this->render_label( '', $id, $label, $required, $required_field_text );
		foreach ( (array) $this->get_attribute( 'options' ) as $optionIndex => $option ) {
			$option = Grunion_Contact_Form_Plugin::strip_tags( $option );
			if ( $option  ) {
				$field .= "\t\t<label class='grunion-checkbox-multiple-label checkbox-multiple" . ( $this->is_error() ? ' form-error' : '' ) . "'>";
				$field .= "<input type='checkbox' name='" . esc_attr( $id ) . "[]' value='" . esc_attr( $this->get_option_value( $this->get_attribute( 'values' ), $optionIndex, $option ) ) . "' " . $class . checked( in_array( $option, (array) $value ), true, false ) . ' /> ';
				$field .= esc_html( $option ) . "</label>\n";
				$field .= "\t\t<div class='clear-form'></div>\n";
			}
		}

		return $field;
	}

	function render_select_field( $id, $label, $value, $class, $required, $required_field_text ) {
		$field = $this->render_label( 'select', $id, $label, $required, $required_field_text );
		$field  .= "\t<select name='" . esc_attr( $id ) . "' id='" . esc_attr( $id ) . "' " . $class . ( $required ? "required aria-required='true'" : '' ) . ">\n";
		foreach ( (array) $this->get_attribute( 'options' ) as $optionIndex => $option ) {
			$option = Grunion_Contact_Form_Plugin::strip_tags( $option );
			if ( $option ) {
				$field .= "\t\t<option"
				               . selected( $option, $value, false )
				               . " value='" . esc_attr( $this->get_option_value( $this->get_attribute( 'values' ), $optionIndex, $option ) )
				               . "'>" . esc_html( $option )
				          . "</option>\n";
			}
		}
		$field  .= "\t</select>\n";
		return $field;
	}

	function render_date_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {

		$field = $this->render_label( 'date', $id, $label, $required, $required_field_text );
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
			array( 'jquery', 'jquery-ui-datepicker' )
		);
		wp_enqueue_style( 'jp-jquery-ui-datepicker', plugins_url( 'css/jquery-ui-datepicker.css', __FILE__ ), array( 'dashicons' ), '1.0' );

		// Using Core's built-in datepicker localization routine
		wp_localize_jquery_ui_datepicker();
		return $field;
	}

	function render_default_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $type ) {
		$field = $this->render_label( $type, $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'text', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	function render_field( $type, $id, $label, $value, $class, $placeholder, $required ) {

		$field_placeholder = ( ! empty( $placeholder ) ) ? "placeholder='" . esc_attr( $placeholder ) . "'" : '';
		$field_class       = "class='" . trim( esc_attr( $type ) . ' ' . esc_attr( $class ) ) . "' ";
		$wrap_classes = empty( $class ) ? '' : implode( '-wrap ', array_filter( explode( ' ', $class ) ) ) . '-wrap'; // this adds

		$shell_field_class = "class='grunion-field-wrap grunion-field-" . trim( esc_attr( $type ) . '-wrap ' . esc_attr( $wrap_classes ) ) . "' ";
		/**
		/**
		 * Filter the Contact Form required field text
		 *
		 * @module contact-form
		 *
		 * @since 3.8.0
		 *
		 * @param string $var Required field text. Default is "(required)".
		 */
		$required_field_text = esc_html( apply_filters( 'jetpack_required_field_text', __( '(required)', 'jetpack' ) ) );

		$field = "\n<div {$shell_field_class} >\n"; // new in Jetpack 6.8.0
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
				$field .= $this->render_radio_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
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
			default: // text field
				$field .= $this->render_default_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $type );
				break;
		}
		$field .= "\t</div>\n";
		return $field;
	}
}

add_action( 'init', array( 'Grunion_Contact_Form_Plugin', 'init' ), 9 );

add_action( 'grunion_scheduled_delete', 'grunion_delete_old_spam' );

/**
 * Deletes old spam feedbacks to keep the posts table size under control
 */
function grunion_delete_old_spam() {
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
	", $now_gmt, $grunion_delete_limit
	);
	$post_ids = $wpdb->get_col( $sql );

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
	if ( count( $post_ids ) >= $grunion_delete_limit ) {
		wp_schedule_single_event( time() + 700, 'grunion_scheduled_delete' );
	}
}

/**
 * Send an event to Tracks on form submission.
 *
 * @param int   $post_id - the post_id for the CPT that is created.
 * @param array $all_values - fields from the default contact form.
 * @param array $extra_values - extra fields added to from the contact form.
 *
 * @return null|void
 */
function jetpack_tracks_record_grunion_pre_message_sent( $post_id, $all_values, $extra_values ) {
	// Do not do anything if the submission is not from a block.
	if (
		! isset( $extra_values['is_block'] )
		|| ! $extra_values['is_block']
	) {
		return;
	}

	/*
	 * Event details.
	 */
	$event_user  = wp_get_current_user();
	$event_name  = 'contact_form_block_message_sent';
	$event_props = array(
		'entry_permalink' => esc_url( $all_values['entry_permalink'] ),
		'feedback_id'     => esc_attr( $all_values['feedback_id'] ),
	);

	/*
	 * Record event.
	 * We use different libs on wpcom and Jetpack.
	 */
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$event_name             = 'wpcom_' . $event_name;
		$event_props['blog_id'] = get_current_blog_id();
		// If the form was sent by a logged out visitor, record event with blog owner.
		if ( empty( $event_user->ID ) ) {
			$event_user_id = wpcom_get_blog_owner( $event_props['blog_id'] );
			$event_user    = get_userdata( $event_user_id );
		}

		jetpack_require_lib( 'tracks/client' );
		tracks_record_event( $event_user, $event_name, $event_props );
	} else {
		// If the form was sent by a logged out visitor, record event with Jetpack master user.
		if ( empty( $event_user->ID ) ) {
			$master_user_id = Jetpack_Options::get_option( 'master_user' );
			if ( ! empty( $master_user_id ) ) {
				$event_user = get_userdata( $master_user_id );
			}
		}

		$tracking = new Automattic\Jetpack\Tracking();
		$tracking->record_user_event( $event_name, $event_props, $event_user );
	}
}
add_action( 'grunion_pre_message_sent', 'jetpack_tracks_record_grunion_pre_message_sent', 12, 3 );

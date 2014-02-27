<?php

/*
Plugin Name: Grunion Contact Form
Description: Add a contact form to any post, page or text widget.  Emails will be sent to the post's author by default, or any email address you choose.  As seen on WordPress.com.
Plugin URI: http://automattic.com/#
AUthor: Automattic, Inc.
Author URI: http://automattic.com/
Version: 2.4
License: GPLv2 or later
*/

define( 'GRUNION_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'GRUNION_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

if ( is_admin() )
	require_once GRUNION_PLUGIN_DIR . '/admin.php';

/**
 * Sets up various actions, filters, post types, post statuses, shortcodes.
 */
class Grunion_Contact_Form_Plugin {
	/**
	 * @var string The Widget ID of the widget currently being processed.  Used to build the unique contact-form ID for forms embedded in widgets.
	 */
	var $current_widget_id;

	static function init() {
		static $instance = false;

		if ( !$instance ) {
			$instance = new Grunion_Contact_Form_Plugin;
		}

		return $instance;
	}

	/**
	 * Strips HTML tags from input.  Output is NOT HTML safe.
	 *
	 * @param string $string
	 * @return string
	 */
	static function strip_tags( $string ) {
		$string = wp_kses( $string, array() );
		return str_replace( '&amp;', '&', $string ); // undo damage done by wp_kses_normalize_entities()
	}

	function __construct() {
		$this->add_shortcode();

		// While generating the output of a text widget with a contact-form shortcode, we need to know its widget ID.
		add_action( 'dynamic_sidebar', array( $this, 'track_current_widget' ) );

		// Add a "widget" shortcode attribute to all contact-form shortcodes embedded in widgets
		add_filter( 'widget_text', array( $this, 'widget_atts' ), 0 );

		// If Text Widgets don't get shortcode processed, hack ours into place.
		if ( !has_filter( 'widget_text', 'do_shortcode' ) )
			add_filter( 'widget_text', array( $this, 'widget_shortcode_hack' ), 5 );

		// Akismet to the rescue
		if ( function_exists( 'akismet_http_post' ) ) {
			add_filter( 'contact_form_is_spam', array( $this, 'is_spam_akismet' ), 10 );
			add_action( 'contact_form_akismet', array( $this, 'akismet_submit' ), 10, 2 );
		}

		add_action( 'loop_start', array( 'Grunion_Contact_Form', '_style_on' ) );

		add_action( 'wp_ajax_grunion-contact-form', array( $this, 'ajax_request' ) );
		add_action( 'wp_ajax_nopriv_grunion-contact-form', array( $this, 'ajax_request' ) );

		// Export to CSV feature
		if ( is_admin() ) {
			add_action( 'admin_init',            array( $this, 'download_feedback_as_csv' ) );
			add_action( 'admin_footer-edit.php', array( $this, 'export_form' ) );
		}

		// custom post type we'll use to keep copies of the feedback items
		register_post_type( 'feedback', array(
			'labels'            => array(
				'name'               => __( 'Feedback', 'jetpack' ),
				'singular_name'      => __( 'Feedback', 'jetpack' ),
				'search_items'       => __( 'Search Feedback', 'jetpack' ),
				'not_found'          => __( 'No feedback found', 'jetpack' ),
				'not_found_in_trash' => __( 'No feedback found', 'jetpack' )
			),
			'menu_icon'         => GRUNION_PLUGIN_URL . '/images/grunion-menu.png',
			'show_ui'           => TRUE,
			'show_in_admin_bar' => FALSE,
			'public'            => FALSE,
			'rewrite'           => FALSE,
			'query_var'         => FALSE,
			'capability_type'   => 'page'
		) );

		// Add "spam" as a post status
		register_post_status( 'spam', array(
			'label'                  => 'Spam',
			'public'                 => FALSE,
			'exclude_from_search'    => TRUE,
			'show_in_admin_all_list' => FALSE,
			'label_count'            => _n_noop( 'Spam <span class="count">(%s)</span>', 'Spam <span class="count">(%s)</span>', 'jetpack' ),
			'protected'              => TRUE,
			'_builtin'               => FALSE
		) );

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

		/* Can be dequeued by placing the following in wp-content/themes/yourtheme/functions.php
		 *
		 * 	function remove_grunion_style() {
		 *		wp_deregister_style('grunion.css');
		 *	}
		 *	add_action('wp_print_styles', 'remove_grunion_style');
		 */

		wp_register_style( 'grunion.css', GRUNION_PLUGIN_URL . 'css/grunion.css', array(), JETPACK__VERSION );
	}

	/**
	 * Handles all contact-form POST submissions
	 *
	 * Conditionally attached to `template_redirect`
	 */
	function process_form_submission() {
		$id = stripslashes( $_POST['contact-form-id'] );

		if ( is_user_logged_in() ) {
			check_admin_referer( "contact-form_{$id}" );
		}

		$is_widget = 0 === strpos( $id, 'widget-' );

		$form = false;

		if ( $is_widget ) {
			// It's a form embedded in a text widget

			$this->current_widget_id = substr( $id, 7 ); // remove "widget-"
			$widget_type = implode( '-', array_slice( explode( '-', $this->current_widget_id ), 0, -1 ) ); // Remove trailing -#

			// Is the widget active?
			$sidebar = is_active_widget( false, $this->current_widget_id, $widget_type );

			// This is lame - no core API for getting a widget by ID
			$widget = isset( $GLOBALS['wp_registered_widgets'][$this->current_widget_id] ) ? $GLOBALS['wp_registered_widgets'][$this->current_widget_id] : false;

			if ( $sidebar && $widget && isset( $widget['callback'] ) ) {
				// This is lamer - no API for outputting a given widget by ID
				ob_start();
				// Process the widget to populate Grunion_Contact_Form::$last
				call_user_func( $widget['callback'], array(), $widget['params'][0] );
				ob_end_clean();
			}
		} else {
			// It's a form embedded in a post

			$post = get_post( $id );

			// Process the content to populate Grunion_Contact_Form::$last
			apply_filters( 'the_content', $post->post_content );
		}
		
		$form = Grunion_Contact_Form::$last;
		
		// No form may mean user is using do_shortcode, grab the form using the stored post meta
		if ( !$form ) {
			
			// Get short code from post meta
			$shortcode = get_post_meta( $_POST['contact-form-id'], '_g_feedback_shortcode', true );
	
			// Format it
			if ( $shortcode != '' ) {
				$shortcode = '[contact-form]' . $shortcode . '[/contact-form]';
				do_shortcode( $shortcode );
				
				// Recreate form
				$form = Grunion_Contact_Form::$last;
			} 
			
			if ( ! $form ) {
				return false;
			}
		}

		if ( is_wp_error( $form->errors ) && $form->errors->get_error_codes() )
			return $form->errors;

		// Process the form
		return $form->process_submission();
	}

	function ajax_request() {
		$submission_result = self::process_form_submission();

		if ( ! $submission_result ) {
			header( "HTTP/1.1 500 Server Error", 500, true );
			echo '<div class="form-error"><ul class="form-errors"><li class="form-error-message">';
			esc_html_e( 'An error occurred. Please try again later.', 'jetpack' );
			echo '</li></ul></div>';
		} elseif ( is_wp_error( $submission_result ) ) {
			header( "HTTP/1.1 400 Bad Request", 403, true );
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
	 * The "child" contact-field shortcode is added as needed by the contact-form shortcode handler
	 */
	function add_shortcode() {
		add_shortcode( 'contact-form', array( 'Grunion_Contact_Form', 'parse' ) );
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
		if ( !preg_match( '/\[contact-form([^a-zA-Z_-])/', $text ) ) {
			return $text;
		}

		$old = $GLOBALS['shortcode_tags'];
		remove_all_shortcodes();
		$this->add_shortcode();

		$text = do_shortcode( $text );

		$GLOBALS['shortcode_tags'] = $old;

		return $text;
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
		$form['user_ip']      = preg_replace( '/[^0-9., ]/', '', $_SERVER['REMOTE_ADDR'] );
		$form['user_agent']   = $_SERVER['HTTP_USER_AGENT'];
		$form['referrer']     = $_SERVER['HTTP_REFERER'];
		$form['blog']         = get_option( 'home' );

		$ignore = array( 'HTTP_COOKIE' );

		foreach ( $_SERVER as $k => $value )
			if ( !in_array( $k, $ignore ) && is_string( $value ) )
				$form["$k"] = $value;

		return $form;
	}

	/**
	 * Submit contact-form data to Akismet to check for spam.
	 * If you're accepting a new item via $_POST, run it Grunion_Contact_Form_Plugin::prepare_for_akismet() first
	 * Attached to `contact_form_is_spam`
	 *
	 * @param array $form
	 * @return bool|WP_Error TRUE => spam, FALSE => not spam, WP_Error => stop processing entirely
	 */
	function is_spam_akismet( $form ) {
		global $akismet_api_host, $akismet_api_port;

		if ( !function_exists( 'akismet_http_post' ) )
			return false;

		$query_string = http_build_query( $form );

		$response = akismet_http_post( $query_string, $akismet_api_host, '/1.1/comment-check', $akismet_api_port );
		$result = false;
		if ( isset( $response[1] ) && 'true' == trim( $response[1] ) ) // 'true' is spam
			$result = true;
		return apply_filters( 'contact_form_is_spam_akismet', $result, $form );
	}

	/**
	 * Submit a feedback as either spam or ham
	 *
	 * @param string $as Either 'spam' or 'ham'.
	 * @param array $form the contact-form data
	 */
	function akismet_submit( $as, $form ) {
		global $akismet_api_host, $akismet_api_port;

		if ( !in_array( $as, array( 'ham', 'spam' ) ) )
			return false;

		$query_string = http_build_query( $form );

		$response = akismet_http_post( $query_string, $akismet_api_host, "/1.1/submit-{$as}", $akismet_api_port );
		return trim( $response[1] );
	}

	/**
	 * Prints the menu
	 */
	function export_form() {
		if ( get_current_screen()->id != 'edit-feedback' )
			return;

		// if there aren't any feedbacks, bail out
		if ( ! (int) wp_count_posts( 'feedback' )->publish )
			return;
		?>

		<div id="feedback-export" style="display:none">
			<h2><?php _e( 'Export feedback as CSV', 'jetpack' ) ?></h2>
			<div class="clear"></div>
			<form action="<?php echo admin_url( 'admin-post.php' ); ?>" method="post" class="form">
				<?php wp_nonce_field( 'feedback_export','feedback_export_nonce' ); ?>

				<input name="action" value="feedback_export" type="hidden">
				<label for="post"><?php _e( 'Select feedback to download', 'jetpack' ) ?></label>
				<select name="post">
					<option value="all"><?php esc_html_e( 'All posts', 'jetpack' ) ?></option>
					<?php echo $this->get_feedbacks_as_options() ?>
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
		wrapper.appendChild(menu);
		menu.style.display = 'block';
		</script>
		<?php
	}

	/**
	 * download as a csv a contact form or all of them in a csv file
	 */
	function download_feedback_as_csv() {
		if ( empty( $_POST['feedback_export_nonce'] ) )
			return;

		check_admin_referer( 'feedback_export', 'feedback_export_nonce' );

		$args = array(
			'posts_per_page'   => -1,
			'post_type'        => 'feedback',
			'post_status'      => 'publish',
			'meta_key'         => '_feedback_subject',
			'orderby'          => 'meta_value',
			'fields'           => 'ids',
			'suppress_filters' => false,
		);

		$filename = date( "Y-m-d" ) . '-feedback-export.csv';

		// Check if we want to download all the feedbacks or just a certain contact form
		if ( ! empty( $_POST['post'] ) && $_POST['post'] !== 'all' ) {
			$args['post_parent'] = (int) $_POST['post'];
			$filename            = date( "Y-m-d" ) . '-' . str_replace( '&nbsp;', '-', get_the_title( (int) $_POST['post'] ) ) . '.csv';
		}

		$feedbacks = get_posts( $args );
		$filename  = sanitize_file_name( $filename );
		$fields    = $this->get_field_names( $feedbacks );
		array_unshift( $fields, __( 'Contact Form', 'jetpack' ) );

		if ( empty( $feedbacks ) )
			return;

		// Forces the download of the CSV instead of echoing
		header( 'Content-Disposition: attachment; filename=' . $filename );
		header( 'Pragma: no-cache' );
		header( 'Expires: 0' );
		header( 'Content-Type: text/csv; charset=utf-8' );

		$output = fopen( 'php://output', 'w' );

		// Prints the header
		fputcsv( $output, $fields );

		// Create the csv string from the array of post ids
		foreach ( $feedbacks as $feedback ) {
			fputcsv( $output, self::make_csv_row_from_feedback( $feedback, $fields ) );
		}

		fclose( $output );
	}

	/**
	 * Returns a string of HTML <option> items from an array of posts
	 *
	 * @return string a string of HTML <option> items
	 */
	protected function get_feedbacks_as_options() {
		$options = '';

		// Get the feedbacks' parents' post IDs
		$feedbacks = get_posts( array(
			'fields'           => 'id=>parent',
			'posts_per_page'   => 100000,
			'post_type'        => 'feedback',
			'post_status'      => 'publish',
			'suppress_filters' => false,
		) );
		$parents = array_unique( array_values( $feedbacks ) );

		$posts = get_posts( array(
			'orderby'          => 'ID',
			'posts_per_page'   => 1000,
			'post_type'        => 'any',
			'post__in'         => array_values( $parents ),
			'suppress_filters' => false,
		) );

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
	 * @return array     the array of fields
	 */
	protected function get_field_names( $posts ) {
		$posts = (array) $posts;
		$all_fields = array();

		foreach ( $posts as $post ){
			$extra_fields = array_keys( get_post_meta( $post, '_feedback_all_fields', true ) );
			$all_fields = array_merge( $all_fields, $extra_fields );
		}

		$all_fields = array_unique( $all_fields );
		return $all_fields;
	}

	/**
	 * Creates a valid csv row from a post id
	 *
	 * @param  int    $post_id The id of the post
	 * @param  array  $fields  An array containing the names of all the fields of the csv
	 * @return String The csv row
	 */
	protected static function make_csv_row_from_feedback( $post_id, $fields ) {
		$all_fields = get_post_meta( $post_id, '_feedback_all_fields', true );

		// The first element in all of the exports will be the subject
		$row_items[] = get_post_meta( $post_id, '_feedback_subject', true );

		// Loop the fields array in order to fill the $row_items array correctly
		foreach ( $fields as $field ) {
			if ( $field === __( 'Contact Form', 'jetpack' ) ) // the first field will ever be the contact form, so we can continue
				continue;
			elseif ( array_key_exists( $field, $all_fields ) )
				$row_items[] = $all_fields[$field];
			else
				$row_items[] = '';
		}

		return $row_items;
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
	var $shortcode_name;

	/**
	 * @var array key => value pairs for the shortcode's attributes: [$shortcode_name key="value" ... /]
	 */
	var $attributes;

	/**
	 * @var array key => value pair for attribute defaults
	 */
	var $defaults = array();

	/**
	 * @var null|string Null for selfclosing shortcodes.  Hhe inner content of otherwise: [$shortcode_name]$content[/$shortcode_name]
	 */
	var $content;

	/**
	 * @var array Associative array of inner "child" shortcodes equivalent to the $content: [$shortcode_name][child 1/][child 2/][/$shortcode_name]
	 */
	var $fields;

	/**
	 * @var null|string The HTML of the parsed inner "child" shortcodes".  Null for selfclosing shortcodes.
	 */
	var $body;

	/**
	 * @param array $attributes An associative array of shortcode attributes.  @see shortcode_atts()
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
		
		$this->parse_content( $content );
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
		return isset( $this->attributes[$key] ) ? $this->attributes[$key] : null;
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
		$value = strtr( $value, array( '%' => '%25', '&' => '%26' ) );

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
		$value = strtr( $value, array( '%26' => '&', '%25' => '%' ) );
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
			if ( !$value ) {
				continue;
			}

			if ( isset( $this->defaults[$key] ) && $this->defaults[$key] == $value ) {
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
	var $shortcode_name = 'contact-form';

	/**
	 * @var WP_Error stores form submission errors
	 */
	var $errors;

	/**
	 * @var Grunion_Contact_Form The most recent (inclusive) contact-form shortcode processed
	 */
	static $last;

	/**
	 * @var bool Whether to print the grunion.css style when processing the contact-form shortcode
	 */
	static $style = false;

	function __construct( $attributes, $content = null ) {
		global $post;

		// Set up the default subject and recipient for this form
		$default_to = get_option( 'admin_email' );
		$default_subject = "[" . get_option( 'blogname' ) . "]";

		if ( !empty( $attributes['widget'] ) && $attributes['widget'] ) {
			$attributes['id'] = 'widget-' . $attributes['widget'];

			$default_subject = sprintf( _x( '%1$s Sidebar', '%1$s = blog name', 'jetpack' ), $default_subject );
		} else if ( $post ) {
			$attributes['id'] = $post->ID;
			$default_subject = sprintf( _x( '%1$s %2$s', '%1$s = blog name, %2$s = post title', 'jetpack' ), $default_subject, Grunion_Contact_Form_Plugin::strip_tags( $post->post_title ) );
			$post_author = get_userdata( $post->post_author );
			$default_to = $post_author->user_email;
		}

		$this->defaults = array(
			'to'                 => $default_to,
			'subject'            => $default_subject,
			'show_subject'       => 'no', // only used in back-compat mode
			'widget'             => 0,    // Not exposed to the user. Works with Grunion_Contact_Form_Plugin::widget_atts()
			'id'                 => null, // Not exposed to the user. Set above.
			'submit_button_text' => __( 'Submit &#187;', 'jetpack' ),
		);

		$attributes = shortcode_atts( $this->defaults, $attributes );

		// We only add the contact-field shortcode temporarily while processing the contact-form shortcode
		add_shortcode( 'contact-field', array( $this, 'parse_contact_field' ) );

		parent::__construct( $attributes, $content );

		// There were no fields in the contact form. The form was probably just [contact-form /]. Build a default form.
		if ( empty( $this->fields ) ) {
			// same as the original Grunion v1 form
			$default_form = '
				[contact-field label="' . __( 'Name', 'jetpack' )    . '" type="name"  required="true" /]
				[contact-field label="' . __( 'Email', 'jetpack' )   . '" type="email" required="true" /]
				[contact-field label="' . __( 'Website', 'jetpack' ) . '" type="url" /]';

			if ( 'yes' == strtolower( $this->get_attribute( 'show_subject' ) ) ) {
				$default_form .= '
					[contact-field label="' . __( 'Subject', 'jetpack' ) . '" type="subject" /]';
			}

			$default_form .= '
				[contact-field label="' . __( 'Message', 'jetpack' ) . '" type="textarea" /]';

			$this->parse_content( $default_form );
			
			// Store the shortcode
			$this->store_shortcode( $default_form, $attributes );
		} else {
		
			// Store the shortcode
			$this->store_shortcode( $content, $attributes );
		}

		// $this->body and $this->fields have been setup.  We no longer need the contact-field shortcode.
		remove_shortcode( 'contact-field' );
	}

	/**
	 * Store shortcode content for recall later 
	 *	- used to receate shortcode when user uses do_shortcode
	 *
	 * @param string $content
	 */
	static function store_shortcode( $content = null, $attributes = null ) {
		
		if ( $content != null and isset ( $attributes['id'] ) ) {
		
			$shortcode_meta = get_post_meta( $attributes['id'], '_g_feedback_shortcode', true );
			
			if ( $shortcode_meta != '' or $shortcode_meta != $content ) {
				update_post_meta( $attributes['id'], '_g_feedback_shortcode', $content );
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
		self::$style = (bool) $style;
		return $previous_style;
	}

	/**
	 * Turn on printing of grunion.css stylesheet
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
	 * @param array $attributes Key => Value pairs as parsed by shortcode_parse_atts()
	 * @param string|null $content The shortcode's inner content: [contact-form]$content[/contact-form]
	 * @return string HTML for the concat form.
	 */
	static function parse( $attributes, $content ) {
		// Create a new Grunion_Contact_Form object (this class)
		$form = new Grunion_Contact_Form( $attributes, $content );

		$id = $form->get_attribute( 'id' );

		if ( !$id ) { // something terrible has happened
			return '[contact-form]';
		}

		if ( apply_filters( 'jetpack_bail_on_shortcode', false, 'contact-form' ) || is_feed() ) {
			return '[contact-form]';
		}

		// Only allow one contact form per post/widget
		if ( self::$last && $id == self::$last->get_attribute( 'id' ) ) {
			// We're processing the same post

			if ( self::$last->attributes != $form->attributes || self::$last->content != $form->content ) {
				// And we're processing a different shortcode;
				return '';
			} // else, we're processing the same shortcode - probably a separate run of do_shortcode() - let it through

		} else {
			self::$last = $form;
		}

		// Enqueue the grunion.css stylesheet if self::$style allows it
		if ( self::$style && ( empty( $_REQUEST['action'] ) || $_REQUEST['action'] != 'grunion_shortcode_to_json' ) ) {
			// Enqueue the style here instead of printing it, because if some other plugin has run the_post()+rewind_posts(),
			// (like VideoPress does), the style tag gets "printed" the first time and discarded, leaving the contact form unstyled.
			// when WordPress does the real loop.
			wp_enqueue_style( 'grunion.css' );
		}

		$r = '';
		$r .= "<div id='contact-form-$id'>\n";

		if ( is_wp_error( $form->errors ) && $form->errors->get_error_codes() ) {
			// There are errors.  Display them
			$r .= "<div class='form-error'>\n<h3>" . __( 'Error!', 'jetpack' ) . "</h3>\n<ul class='form-errors'>\n";
			foreach ( $form->errors->get_error_messages() as $message )
				$r .= "\t<li class='form-error-message'>" . esc_html( $message ) . "</li>\n";
			$r .= "</ul>\n</div>\n\n";
		}

		if ( isset( $_GET['contact-form-id'] ) && $_GET['contact-form-id'] == self::$last->get_attribute( 'id' ) && isset( $_GET['contact-form-sent'] ) ) {
			// The contact form was submitted.  Show the success message/results

			$feedback_id = (int) $_GET['contact-form-sent'];

			$back_url = remove_query_arg( array( 'contact-form-id', 'contact-form-sent', '_wpnonce' ) );

			$r_success_message =
				"<h3>" . __( 'Message Sent', 'jetpack' ) .
				' (<a href="' . esc_url( $back_url ) . '">' . esc_html__( 'go back', 'jetpack' ) . '</a>)' .
				"</h3>\n\n";

			// Don't show the feedback details unless the nonce matches
			if ( $feedback_id && wp_verify_nonce( stripslashes( $_GET['_wpnonce'] ), "contact-form-sent-{$feedback_id}" ) ) {
				$r_success_message .= self::success_message( $feedback_id, $form );
			}

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

			// May eventually want to send this to admin-post.php...
			$url = apply_filters( 'grunion_contact_form_form_action', "{$url}#contact-form-{$id}", $GLOBALS['post'], $id );

			$r .= "<form action='" . esc_url( $url ) . "' method='post' class='contact-form commentsblock'>\n";
			$r .= $form->body;
			$r .= "\t<p class='contact-submit'>\n";
			$r .= "\t\t<input type='submit' value='" . esc_attr( $form->get_attribute( 'submit_button_text' ) ) . "' class='pushbutton-wide'/>\n";
			if ( is_user_logged_in() ) {
				$r .= "\t\t" . wp_nonce_field( 'contact-form_' . $id, '_wpnonce', true, false ) . "\n"; // nonce and referer
			}
			$r .= "\t\t<input type='hidden' name='contact-form-id' value='$id' />\n";
			$r .= "\t\t<input type='hidden' name='action' value='grunion-contact-form' />\n";
			$r .= "\t</p>\n";
			$r .= "</form>\n";
		}

		$r .= "</div>";

		return $r;
	}

	static function success_message( $feedback_id, $form ) {
		$r_success_message = '';

		$feedback = get_post( $feedback_id );

		$field_ids = $form->get_field_ids();

		// Maps field_ids to post_meta keys
		$field_value_map = array(
			'name'     => 'author',
			'email'    => 'author_email',
			'url'      => 'author_url',
			'subject'  => 'subject',
			'textarea' => false, // not a post_meta key.  This is stored in post_content
		);

		$contact_form_message = "<blockquote>\n";

		// "Standard" field whitelist
		foreach ( $field_value_map as $type => $meta_key ) {
			if ( isset( $field_ids[$type] ) ) {
				$field = $form->fields[$field_ids[$type]];

				if ( $meta_key ) {
					$value = get_post_meta( $feedback_id, "_feedback_{$meta_key}", true );
				} else {
					// The feedback content is stored as the first "half" of post_content
					$value = $feedback->post_content;
					list( $value ) = explode( '<!--more-->', $value );
					$value = trim( $value );
				}

				$contact_form_message .= sprintf(
					_x( '%1$s: %2$s', '%1$s = form field label, %2$s = form field value', 'jetpack' ),
					wp_kses( $field->get_attribute( 'label' ), array() ),
					wp_kses( $value, array() )
				) . '<br />';
			}
		}

		// "Non-standard" fields
		if ( $field_ids['extra'] ) {
			// array indexed by field label (not field id)
			$extra_fields = get_post_meta( $feedback_id, '_feedback_extra_fields', true );

			foreach ( $field_ids['extra'] as $field_id ) {
				$field = $form->fields[$field_id];
				$label = $field->get_attribute( 'label' );
				$contact_form_message .= sprintf(
					_x( '%1$s: %2$s', '%1$s = form field label, %2$s = form field value', 'jetpack' ),
					wp_kses( $label, array() ),
					wp_kses( $extra_fields[$label], array() )
				) . '<br />';
			}
		}

		$contact_form_message .= "</blockquote><br /><br />";

		$r_success_message .= wp_kses( $contact_form_message, array( 'br' => array(), 'blockquote' => array() ) );

		return $r_success_message;
	}

	/**
	 * The contact-field shortcode processor
	 * We use an object method here instead of a static Grunion_Contact_Form_Field class method to parse contact-field shortcodes so that we can tie them to the contact-form object.
	 *
	 * @param array $attributes Key => Value pairs as parsed by shortcode_parse_atts()
	 * @param string|null $content The shortcode's inner content: [contact-field]$content[/contact-field]
	 * @return HTML for the contact form field
	 */
	function parse_contact_field( $attributes, $content ) {
		$field = new Grunion_Contact_Form_Field( $attributes, $content, $this );

		$field_id = $field->get_attribute( 'id' );
		if ( $field_id ) {
			$this->fields[$field_id] = $field;
		} else {
			$this->fields[] = $field;
		}

		if (
			isset( $_POST['action'] ) && 'grunion-contact-form' === $_POST['action']
		&&
			isset( $_POST['contact-form-id'] ) && $this->get_attribute( 'id' ) == $_POST['contact-form-id']
		) {
			// If we're processing a POST submission for this contact form, validate the field value so we can show errors as necessary.
			$field->validate();
		}

		// Output HTML
		return $field->render();
	}

	/**
	 * Loops through $this->fields to generate a (structured) list of field IDs
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
			if ( isset( $field_ids[$type] ) ) {
				// This type of field is already present in our whitelist of "standard" fields for this form
				// Put it in extra
				$field_ids['extra'][] = $id;
				continue;
			}

			switch ( $type ) {
			case 'email' :
			case 'name' :
			case 'url' :
			case 'subject' :
			case 'textarea' :
				$field_ids[$type] = $id;
				break;
			default :
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

		$to = str_replace( ' ', '', $to );
		$emails = explode( ',', $to );

		$valid_emails = array();

		foreach ( (array) $emails as $email ) {
			if ( !is_email( $email ) ) {
				continue;
			}

			if ( function_exists( 'is_email_address_unsafe' ) && is_email_address_unsafe( $email ) ) {
				continue;
			}

			$valid_emails[] = $email;
		}

		// No one to send it to :(
		if ( !$valid_emails ) {
			return false;
		}

		$to = $valid_emails;

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
		$comment_content      = $comment_content_label      = null;

		// For each of the "standard" fields, grab their field label and value.

		if ( isset( $field_ids['name'] ) ) {
			$field = $this->fields[$field_ids['name']];
			$comment_author = Grunion_Contact_Form_Plugin::strip_tags( stripslashes( apply_filters( 'pre_comment_author_name', addslashes( $field->value ) ) ) );
			$comment_author_label = Grunion_Contact_Form_Plugin::strip_tags( $field->get_attribute( 'label' ) );
		}

		if ( isset( $field_ids['email'] ) ) {
			$field = $this->fields[$field_ids['email']];
			$comment_author_email = Grunion_Contact_Form_Plugin::strip_tags( stripslashes( apply_filters( 'pre_comment_author_email', addslashes( $field->value ) ) ) );
			$comment_author_email_label = Grunion_Contact_Form_Plugin::strip_tags( $field->get_attribute( 'label' ) );
		}

		if ( isset( $field_ids['url'] ) ) {
			$field = $this->fields[$field_ids['url']];
			$comment_author_url = Grunion_Contact_Form_Plugin::strip_tags( stripslashes( apply_filters( 'pre_comment_author_url', addslashes( $field->value ) ) ) );
			if ( 'http://' == $comment_author_url ) {
				$comment_author_url = '';
			}
			$comment_author_url_label = Grunion_Contact_Form_Plugin::strip_tags( $field->get_attribute( 'label' ) );
		}

		if ( isset( $field_ids['textarea'] ) ) {
			$field = $this->fields[$field_ids['textarea']];
			$comment_content = trim( Grunion_Contact_Form_Plugin::strip_tags( $field->value ) );
			$comment_content_label = Grunion_Contact_Form_Plugin::strip_tags( $field->get_attribute( 'label' ) );
		}

		if ( isset( $field_ids['subject'] ) ) {
			$field = $this->fields[$field_ids['subject']];
			if ( $field->value ) {
				$contact_form_subject = Grunion_Contact_Form_Plugin::strip_tags( $field->value );
			}
		}

		$all_values = $extra_values = array();

		// For all fields, grab label and value
		foreach ( $field_ids['all'] as $field_id ) {
			$field = $this->fields[$field_id];
			$label = $field->get_attribute( 'label' );
			$value = $field->value;
			$all_values[$label] = $value;
		}

		// For the "non-standard" fields, grab label and value
		foreach ( $field_ids['extra'] as $field_id ) {
			$field = $this->fields[$field_id];
			$label = $field->get_attribute( 'label' );
			$value = $field->value;
			$extra_values[$label] = $value;
		}


		$message_fields = array();

		foreach ( $field_ids['all'] as $field_id ) {

			switch( $field_id ){
				case "name":
					$message_fields[$comment_author_label] = $comment_author;
					break;
				case "email":
					$message_fields[$comment_author_email_label] = $comment_author_email;
					break;
				case "url":
					$message_fields[$comment_author_url_label] = $comment_author_url;
					break;
				case "textarea":
					$message_fields[$comment_content_label] = $comment_content;
					break;
				case "subject":
					$field = $this->fields[$field_id];
					$label = $field->get_attribute( 'label' );
					$message_fields[$label] = $contact_form_subject;
					break;
				default:
					$field = $this->fields[$field_id];
					$label = $field->get_attribute( 'label' );
					$value = $field->value;
					$message_fields[$label] = $value;
			}

		}

		$contact_form_subject = trim( $contact_form_subject );

		$comment_author_IP = Grunion_Contact_Form_Plugin::strip_tags( $_SERVER['REMOTE_ADDR'] );

		$vars = array( 'comment_author', 'comment_author_email', 'comment_author_url', 'contact_form_subject', 'comment_author_IP' );
		foreach ( $vars as $var )
			$$var = str_replace( array( "\n", "\r" ), '', $$var );
		$vars[] = 'comment_content';

		$spam = '';
		$akismet_values = $plugin->prepare_for_akismet( compact( $vars ) );

		// Is it spam?
		$is_spam = apply_filters( 'contact_form_is_spam', $akismet_values );
		if ( is_wp_error( $is_spam ) ) // WP_Error to abort
			return $is_spam; // abort
		else if ( $is_spam === TRUE )  // TRUE to flag a spam
			$spam = '***SPAM*** ';

		if ( !$comment_author )
			$comment_author = $comment_author_email;

		$to = (array) apply_filters( 'contact_form_to', $to );
		foreach ( $to as $to_key => $to_value ) {
			$to[$to_key] = Grunion_Contact_Form_Plugin::strip_tags( $to_value );
		}

		$blog_url = parse_url( site_url() );
		$from_email_addr = 'wordpress@' . $blog_url['host'];

		$reply_to_addr = $to[0];
		if ( ! empty( $comment_author_email ) ) {
			$reply_to_addr = $comment_author_email;
		}

		$headers = 	'From: ' . $comment_author  .' <' . $from_email_addr  . ">\r\n" .
					'Reply-To: ' . $comment_author . ' <' . $reply_to_addr  . ">\r\n" .
					"Content-Type: text/plain; charset=\"" . get_option('blog_charset') . "\"";

		$subject = apply_filters( 'contact_form_subject', $contact_form_subject );

		$date_time_format = _x( '%1$s \a\t %2$s', '{$date_format} \a\t {$time_format}', 'jetpack' );
		$date_time_format = sprintf( $date_time_format, get_option( 'date_format' ), get_option( 'time_format' ) );
		$time = date_i18n( $date_time_format, current_time( 'timestamp' ) );

		$message = '';

		foreach ( $message_fields as $label => $value ) {
			$message .= $label . ': ' . trim( $value ) . "\n";
		}

		$message .= __( 'Time:', 'jetpack' ) . ' ' . $time . "\n";
		$message .= __( 'IP Address:', 'jetpack' ) . ' ' . $comment_author_IP . "\n";

		if ( $widget ) {
			$url = home_url( '/' );
		} else {
			$url = get_permalink( $post->ID );
		}

		$message .= __( 'Contact Form URL:', 'jetpack' ) . " $url\n";

		if ( is_user_logged_in() ) {
			$message .= "\n";
			$message .= sprintf(
				__( 'Sent by a verified %s user.', 'jetpack' ),
				isset( $GLOBALS['current_site']->site_name ) && $GLOBALS['current_site']->site_name ? $GLOBALS['current_site']->site_name : '"' . get_option( 'blogname' ) . '"'
			);
		} else {
			$message .= __( 'Sent by an unverified visitor to your site.', 'jetpack' );
		}

		$message = apply_filters( 'contact_form_message', $message );
		$message = Grunion_Contact_Form_Plugin::strip_tags( $message );

		// keep a copy of the feedback as a custom post type
		$feedback_mysql_time = current_time( 'mysql' );
		$feedback_title = "{$comment_author} - {$feedback_mysql_time}";
		$feedback_status = 'publish';
		if ( $is_spam === TRUE )
			$feedback_status = 'spam';

		foreach ( (array) $akismet_values as $av_key => $av_value ) {
			$akismet_values[$av_key] = Grunion_Contact_Form_Plugin::strip_tags( $av_value );
		}

		foreach ( (array) $all_values as $all_key => $all_value ) {
			$all_values[$all_key] = Grunion_Contact_Form_Plugin::strip_tags( $all_value );
		}

		foreach ( (array) $extra_values as $ev_key => $ev_value ) {
			$extra_values[$ev_key] = Grunion_Contact_Form_Plugin::strip_tags( $ev_value );
		}

		/* We need to make sure that the post author is always zero for contact
		 * form submissions.  This prevents export/import from trying to create
		 * new users based on form submissions from people who were logged in
		 * at the time.
		 *
		 * Unfortunately wp_insert_post() tries very hard to make sure the post
		 * author gets the currently logged in user id.  That is how we ended up
		 * with this work around. */
		add_filter( 'wp_insert_post_data', array( $plugin, 'insert_feedback_filter' ), 10, 2 );

		$post_id = wp_insert_post( array(
			'post_date'    => addslashes( $feedback_mysql_time ),
			'post_type'    => 'feedback',
			'post_status'  => addslashes( $feedback_status ),
			'post_parent'  => (int) $post->ID,
			'post_title'   => addslashes( wp_kses( $feedback_title, array() ) ),
			'post_content' => addslashes( wp_kses( $comment_content . "\n<!--more-->\n" . "AUTHOR: {$comment_author}\nAUTHOR EMAIL: {$comment_author_email}\nAUTHOR URL: {$comment_author_url}\nSUBJECT: {$contact_form_subject}\nIP: {$comment_author_IP}\n" . print_r( $all_values, TRUE ), array() ) ), // so that search will pick up this data
			'post_name'    => md5( $feedback_title ),
		) );

		// once insert has finished we don't need this filter any more
		remove_filter( 'wp_insert_post_data', array( $plugin, 'insert_feedback_filter' ), 10, 2 );

		update_post_meta( $post_id, '_feedback_author', addslashes( $comment_author ) );
		update_post_meta( $post_id, '_feedback_author_email', addslashes( $comment_author_email ) );
		update_post_meta( $post_id, '_feedback_author_url', addslashes( $comment_author_url ) );
		update_post_meta( $post_id, '_feedback_subject', addslashes( $contact_form_subject ) );
		update_post_meta( $post_id, '_feedback_ip', addslashes( $comment_author_IP ) );
		update_post_meta( $post_id, '_feedback_contact_form_url', addslashes( get_permalink( $post->ID ) ) );
		update_post_meta( $post_id, '_feedback_all_fields', $this->addslashes_deep( $all_values ) );
		update_post_meta( $post_id, '_feedback_extra_fields', $this->addslashes_deep( $extra_values ) );
		update_post_meta( $post_id, '_feedback_akismet_values', $this->addslashes_deep( $akismet_values ) );
		update_post_meta( $post_id, '_feedback_email', $this->addslashes_deep( array( 'to' => $to, 'subject' => $subject, 'message' => $message, 'headers' => $headers ) ) );

		do_action( 'grunion_pre_message_sent', $post_id, $all_values, $extra_values );

		// schedule deletes of old spam feedbacks
		if ( !wp_next_scheduled( 'grunion_scheduled_delete' ) ) {
			wp_schedule_event( time() + 250, 'daily', 'grunion_scheduled_delete' );
		}

		if ( $is_spam !== TRUE && true === apply_filters( 'grunion_should_send_email', true, $post_id ) ) {
			wp_mail( $to, "{$spam}{$subject}", $message, $headers );
		} elseif ( true === $is_spam && apply_filters( 'grunion_still_email_spam', FALSE ) == TRUE ) { // don't send spam by default.  Filterable.
			wp_mail( $to, "{$spam}{$subject}", $message, $headers );
		}

		if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
			return self::success_message( $post_id, $this );
		}

		$redirect = wp_get_referer();
		if ( !$redirect ) { // wp_get_referer() returns false if the referer is the same as the current page
			$redirect = $_SERVER['REQUEST_URI'];
		}

		$redirect = add_query_arg( urlencode_deep( array(
			'contact-form-id'   => $id,
			'contact-form-sent' => $post_id,
			'_wpnonce'          => wp_create_nonce( "contact-form-sent-{$post_id}" ), // wp_nonce_url HTMLencodes :(
		) ), $redirect );

		$redirect = apply_filters( 'grunion_contact_form_redirect_url', $redirect, $id, $post_id );

		wp_safe_redirect( $redirect );
		exit;
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
}

/**
 * Class for the contact-field shortcode.
 * Parses shortcode to output the contact form field as HTML.
 * Validates input.
 */
class Grunion_Contact_Form_Field extends Crunion_Contact_Form_Shortcode {
	var $shortcode_name = 'contact-field';

	/**
	 * @var Grunion_Contact_Form parent form
	 */
	var $form;

	/**
	 * @var string default or POSTed value
	 */
	var $value;

	/**
	 * @var bool Is the input invalid?
	 */
	var $error = false;

	/**
	 * @param array $attributes An associative array of shortcode attributes.  @see shortcode_atts()
	 * @param null|string $content Null for selfclosing shortcodes.  The inner content otherwise.
	 * @param Grunion_Contact_Form $form The parent form
	 */
	function __construct( $attributes, $content = null, $form = null ) {
		$attributes = shortcode_atts( array(
			'label'       => null,
			'type'        => 'text',
			'required'    => false,
			'options'     => array(),
			'id'          => null,
			'default'     => null,
			'placeholder' => null,
		), $attributes );

		// special default for subject field
		if ( 'subject' == $attributes['type'] && is_null( $attributes['default'] ) && !is_null( $form ) ) {
			$attributes['default'] = $form->get_attribute( 'subject' );
		}

		// allow required=1 or required=true
		if ( '1' == $attributes['required'] || 'true' == strtolower( $attributes['required'] ) )
			$attributes['required'] = true;
		else
			$attributes['required'] = false;

		// parse out comma-separated options list (for selects and radios)
		if ( !empty( $attributes['options'] ) && is_string( $attributes['options'] ) ) {
			$attributes['options'] = array_map( 'trim', explode( ',', $attributes['options'] ) );
		}

		if ( $form ) {
			// make a unique field ID based on the label, with an incrementing number if needed to avoid clashes
			$form_id = $form->get_attribute( 'id' );
			$id = isset( $attributes['id'] ) ? $attributes['id'] : false;

			$unescaped_label = $this->unesc_attr( $attributes['label'] );
			$unescaped_label = str_replace( '%', '-', $unescaped_label ); // jQuery doesn't like % in IDs?
			$unescaped_label = preg_replace( '/[^a-zA-Z0-9.-_:]/', '', $unescaped_label );

			if ( empty( $id ) ) {
				$id = sanitize_title_with_dashes( 'g' . $form_id . '-' . $unescaped_label );
				$i = 0;
				$max_tries = 24;
				while ( isset( $form->fields[$id] ) ) {
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

		if ( !is_wp_error( $this->form->errors ) ) {
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
		if ( !$this->get_attribute( 'required' ) ) {
			return;
		}

		$field_id    = $this->get_attribute( 'id' );
		$field_type  = $this->get_attribute( 'type' );
		$field_label = $this->get_attribute( 'label' );

		$field_value = isset( $_POST[$field_id] ) ? stripslashes( $_POST[$field_id] ) : '';

		switch ( $field_type ) {
		case 'email' :
			// Make sure the email address is valid
			if ( !is_email( $field_value ) ) {
				$this->add_error( sprintf( __( '%s requires a valid email address', 'jetpack' ), $field_label ) );
			}
			break;
		default :
			// Just check for presence of any text
			if ( !strlen( trim( $field_value ) ) ) {
				$this->add_error( sprintf( __( '%s is required', 'jetpack' ), $field_label ) );
			}
		}
	}

	/**
	 * Outputs the HTML for this form field
	 *
	 * @return string HTML
	 */
	function render() {
		global $current_user, $user_identity;

		$r = '';

		$field_id          = $this->get_attribute( 'id' );
		$field_type        = $this->get_attribute( 'type' );
		$field_label       = $this->get_attribute( 'label' );
		$field_required    = $this->get_attribute( 'required' );
		$placeholder       = $this->get_attribute( 'placeholder' );
		$field_placeholder = ( ! empty( $placeholder ) ) ? "placeholder='" . esc_attr( $placeholder ) . "'" : '';

		if ( isset( $_POST[$field_id] ) ) {
			$this->value = stripslashes( (string) $_POST[$field_id] );
		} elseif ( is_user_logged_in() ) {
			// Special defaults for logged-in users
			switch ( $this->get_attribute( 'type' ) ) {
			case 'email';
				$this->value = $current_user->data->user_email;
				break;
			case 'name' :
				$this->value = $user_identity;
				break;
			case 'url' :
				$this->value = $current_user->data->user_url;
				break;
			default :
				$this->value = $this->get_attribute( 'default' );
			}
		} else {
			$this->value = $this->get_attribute( 'default' );
		}

		$field_value = Grunion_Contact_Form_Plugin::strip_tags( $this->value );
		$field_label = Grunion_Contact_Form_Plugin::strip_tags( $field_label );

		switch ( $field_type ) {
		case 'email' :
			$r .= "\n<div>\n";
			$r .= "\t\t<label for='" . esc_attr( $field_id ) . "' class='grunion-field-label email" . ( $this->is_error() ? ' form-error' : '' ) . "'>" . esc_html( $field_label ) . ( $field_required ? '<span>' . __( "(required)", 'jetpack' ) . '</span>' : '' ) . "</label>\n";
			$r .= "\t\t<input type='email' name='" . esc_attr( $field_id ) . "' id='" . esc_attr( $field_id ) . "' value='" . esc_attr( $field_value ) . "' class='email' " . $field_placeholder . "/>\n";
			$r .= "\t</div>\n";
			break;
		case 'textarea' :
			$r .= "\n<div>\n";
			$r .= "\t\t<label for='contact-form-comment-" . esc_attr( $field_id ) . "' class='grunion-field-label textarea" . ( $this->is_error() ? ' form-error' : '' ) . "'>" . esc_html( $field_label ) . ( $field_required ? '<span>' . __( "(required)", 'jetpack' ) . '</span>' : '' ) . "</label>\n";
			$r .= "\t\t<textarea name='" . esc_attr( $field_id ) . "' id='contact-form-comment-" . esc_attr( $field_id ) . "' rows='20'>" . esc_textarea( $field_value ) . "</textarea>\n";
			$r .= "\t</div>\n";
			break;
		case 'radio' :
			$r .= "\t<div><label class='grunion-field-label" . ( $this->is_error() ? ' form-error' : '' ) . "'>" . esc_html( $field_label ) . ( $field_required ? '<span>' . __( "(required)", 'jetpack' ) . '</span>' : '' ) . "</label>\n";
			foreach ( $this->get_attribute( 'options' ) as $option ) {
				$option = Grunion_Contact_Form_Plugin::strip_tags( $option );
				$r .= "\t\t<label class='grunion-radio-label radio" . ( $this->is_error() ? ' form-error' : '' ) . "'>";
				$r .= "<input type='radio' name='" . esc_attr( $field_id ) . "' value='" . esc_attr( $option ) . "' class='radio' " . checked( $option, $field_value, false ) . " /> ";
				$r .= esc_html( $option ) . "</label>\n";
				$r .= "\t\t<div class='clear-form'></div>\n";
			}
			$r .= "\t\t</div>\n";
			break;
		case 'checkbox' :
			$r .= "\t<div>\n";
			$r .= "\t\t<label class='grunion-field-label checkbox" . ( $this->is_error() ? ' form-error' : '' ) . "'>\n";
			$r .= "\t\t<input type='checkbox' name='" . esc_attr( $field_id ) . "' value='" . esc_attr__( 'Yes', 'jetpack' ) . "' class='checkbox' " . checked( (bool) $field_value, true, false ) . " /> \n";
			$r .= "\t\t" . esc_html( $field_label ) . ( $field_required ? '<span>'. __( "(required)", 'jetpack' ) . '</span>' : '' ) . "</label>\n";
			$r .= "\t\t<div class='clear-form'></div>\n";
			$r .= "\t</div>\n";
			break;
		case 'select' :
			$r .= "\n<div>\n";
			$r .= "\t\t<label for='" . esc_attr( $field_id ) . "' class='grunion-field-label select" . ( $this->is_error() ? ' form-error' : '' ) . "'>" . esc_html( $field_label ) . ( $field_required ? '<span>'. __( "(required)", 'jetpack' ) . '</span>' : '' ) . "</label>\n";
			$r .= "\t<select name='" . esc_attr( $field_id ) . "' id='" . esc_attr( $field_id ) . "' class='select' >\n";
			foreach ( $this->get_attribute( 'options' ) as $option ) {
				$option = Grunion_Contact_Form_Plugin::strip_tags( $option );
				$r .= "\t\t<option" . selected( $option, $field_value, false ) . ">" . esc_html( $option ) . "</option>\n";
			}
			$r .= "\t</select>\n";
			$r .= "\t</div>\n";
			break;
		case 'date' :
			$r .= "\n<div>\n";
			$r .= "\t\t<label for='" . esc_attr( $field_id ) . "' class='grunion-field-label " . esc_attr( $field_type ) . ( $this->is_error() ? ' form-error' : '' ) . "'>" . esc_html( $field_label ) . ( $field_required ? '<span>' . __( "(required)", 'jetpack' ) . '</span>' : '' ) . "</label>\n";
			$r .= "\t\t<input type='date' name='" . esc_attr( $field_id ) . "' id='" . esc_attr( $field_id ) . "' value='" . esc_attr( $field_value ) . "' class='" . esc_attr( $field_type ) . "'/>\n";
			$r .= "\t</div>\n";

			wp_enqueue_script( 'grunion-frontend', plugins_url( 'js/grunion-frontend.js', __FILE__ ), array( 'jquery', 'jquery-ui-datepicker' ) );
			break;
		default : // text field
			// note that any unknown types will produce a text input, so we can use arbitrary type names to handle
			// input fields like name, email, url that require special validation or handling at POST
			$r .= "\n<div>\n";
			$r .= "\t\t<label for='" . esc_attr( $field_id ) . "' class='grunion-field-label " . esc_attr( $field_type ) . ( $this->is_error() ? ' form-error' : '' ) . "'>" . esc_html( $field_label ) . ( $field_required ? '<span>' . __( "(required)", 'jetpack' ) . '</span>' : '' ) . "</label>\n";
			$r .= "\t\t<input type='text' name='" . esc_attr( $field_id ) . "' id='" . esc_attr( $field_id ) . "' value='" . esc_attr( $field_value ) . "' class='" . esc_attr( $field_type ) . "' " . $field_placeholder . "/>\n";
			$r .= "\t</div>\n";
		}

		return apply_filters( 'grunion_contact_form_field_html', $r, $field_label, ( in_the_loop() ? get_the_ID() : null ) );
	}
}

add_action( 'init', array( 'Grunion_Contact_Form_Plugin', 'init' ) );

add_action( 'grunion_scheduled_delete', 'grunion_delete_old_spam' );

/**
 * Deletes old spam feedbacks to keep the posts table size under control
 */
function grunion_delete_old_spam() {
	global $wpdb;

	$grunion_delete_limit = 100;

	$now_gmt = current_time( 'mysql', 1 );
	$sql = $wpdb->prepare( "
		SELECT `ID`
		FROM $wpdb->posts
		WHERE DATE_SUB( %s, INTERVAL 15 DAY ) > `post_date_gmt`
			AND `post_type` = 'feedback'
			AND `post_status` = 'spam'
		LIMIT %d
	", $now_gmt, $grunion_delete_limit );
	$post_ids = $wpdb->get_col( $sql );

	foreach ( (array) $post_ids as $post_id ) {
		# force a full delete, skip the trash
		wp_delete_post( $post_id, TRUE );
	}

	# Arbitrary check points for running OPTIMIZE
	# nothing special about 5000 or 11
	# just trying to periodically recover deleted rows
	$random_num = mt_rand( 1, 5000 );
	if ( apply_filters( 'grunion_optimize_table', ( $random_num == 11 ) ) ) {
		$wpdb->query( "OPTIMIZE TABLE $wpdb->posts" );
	}

	# if we hit the max then schedule another run
	if ( count( $post_ids ) >= $grunion_delete_limit ) {
		wp_schedule_single_event( time() + 700, 'grunion_scheduled_delete' );
	}
}

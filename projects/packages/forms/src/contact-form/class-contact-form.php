<?php
/**
 * Contact_Form class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Forms\Dashboard\Dashboard as Forms_Dashboard;
use Automattic\Jetpack\JWT;
use Automattic\Jetpack\Sync\Settings;
use Jetpack_Tracks_Event;
use PHPMailer\PHPMailer\PHPMailer;
use WP_Block;
use WP_Error;
use WP_Post;

// Load the Form_Submission_Error class.
require_once __DIR__ . '/class-form-submission-error.php';

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class for the contact-form shortcode.
 * Parses shortcode to output the contact form as HTML
 * Sends email and stores the contact form response (a.k.a. "feedback")
 */
class Contact_Form extends Contact_Form_Shortcode {

	/**
	 * The shortcode name.
	 *
	 * @var string
	 */
	public $shortcode_name = 'contact-form';

	/**
	 *
	 * Stores form submission errors.
	 *
	 * @var WP_Error
	 */
	public $errors;

	/**
	 * The SHA1 hash of the attributes that comprise the form.
	 *
	 * @var string
	 */
	public $hash;

	/**
	 * The most recent (inclusive) contact-form shortcode processed.
	 *
	 * @var Contact_Form|null
	 */
	public static $last;

	/**
	 * Form we are currently looking at. If processed, will become $last
	 *
	 * @var Contact_Form|null
	 */
	public static $current_form;

	/**
	 * All found forms, indexed by hash.
	 *
	 * @var array
	 */
	public static $forms = array();

	/**
	 * The context for the forms, indexed by context.
	 * This is used to keep track of how many forms are in a specific context.
	 *
	 * @var array
	 */
	public static $forms_context = array();

	/**
	 * Array of WP_Error objects that are keyed by form id.
	 *
	 * @var array
	 */
	public static $static_errors = array();

	/**
	 * Whether to print the grunion.css style when processing the contact-form shortcode
	 *
	 * @var bool
	 */
	public static $style = false;

	/**
	 * When printing the submit button, what tags are allowed
	 *
	 * @var array
	 */
	public static $allowed_html_tags_for_submit_button = array( 'br' => array() );

	/**
	 * Whether to enable response without reloading the page.
	 *
	 * @var bool
	 */
	public $is_response_without_reload_enabled = true;

	/**
	 * The current post object for this form.
	 *
	 * @var WP_Post|null
	 */
	public $current_post;

	/**
	 * Whether the form has a verified JWT token.
	 *
	 * @var bool
	 */
	public $has_verified_jwt = false;

	/**
	 * The source of the feedback entry.
	 *
	 * @var Feedback_Source
	 */
	private $source;

	/**
	 * Construction function.
	 *
	 * @param array  $attributes - the attributes.
	 * @param string $content - the content.
	 * @param bool   $set_id - whether to set the ID for the form.
	 */
	public function __construct( $attributes, $content = null, $set_id = true ) {
		global $post, $page;

		// AJAX requests don't have a post object, so we need to get the post object from the $_POST['contact-form-id']
		$this->current_post = $post;

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verification happens in process_form_submission() for logged-in users
		if ( ! $this->current_post && isset( $_POST['contact-form-id'] ) ) {
			$contact_form_id    = sanitize_text_field( wp_unslash( $_POST['contact-form-id'] ) );
			$this->current_post = get_post( $contact_form_id );
		}
		// phpcs:enable

		$this->is_response_without_reload_enabled = apply_filters( 'jetpack_forms_enable_ajax_submission', true );

		// Initialize the source before setting defaults
		if ( ! $this->source ) {
			$attributes   = is_array( $attributes ) ? $attributes : array();
			$this->source = Feedback_Source::get_current( $attributes );
		}

		// Set up the default subject and recipient for this form.
		$post_author_id  = self::get_post_property( $this->current_post, 'post_author' );
		$default_to      = self::get_default_to( $post_author_id, $this->source );
		$default_subject = self::get_default_subject( $attributes, $this->current_post );

		if ( ! isset( $attributes ) || ! is_array( $attributes ) ) {
			$attributes = array();
		}

		if ( $set_id ) {
			$attributes['id'] = self::compute_id( $attributes, $this->current_post, $page );
		}
		$this->hash = sha1( wp_json_encode( $attributes ) );

		if ( $set_id ) {
			self::$forms[ $this->hash ] = $this; // This increments the form count.
			self::increment_form_context_count( $attributes, $this->current_post );
		}

		// Keep reference to $this for parsing form fields.
		self::$current_form = $this;

		$this->defaults = array(
			'to'                     => $default_to,
			'subject'                => $default_subject,
			'show_subject'           => 'no', // only used in back-compat mode
			'widget'                 => 0,    // Not exposed to the user. Works with Contact_Form_Plugin::widget_atts()
			'block_template'         => null, // Not exposed to the user. Works with template_loader
			'block_template_part'    => null, // Not exposed to the user. Works with Contact_Form::parse()
			'id'                     => null, // Not exposed to the user. Set above.
			'submit_button_text'     => __( 'Submit', 'jetpack-forms' ),
			// These attributes come from the block editor, so use camel case instead of snake case.
			'customThankyou'         => '', // Whether to show a custom thankyou response after submitting a form. '' for no, 'noSummary' to disable the summary, 'message' for a custom message, 'redirect' to redirect to a new URL. Deprecated.
			'customThankyouHeading'  => __( 'Your message has been sent', 'jetpack-forms' ), // The text to show above customThankyouMessage.
			'customThankyouMessage'  => '', // The message to show when customThankyou is set to 'message'.
			'customThankyouRedirect' => '', // The URL to redirect to when confirmationType is set to 'redirect'.
			'confirmationType'       => null, // The type of confirmation to show after submitting a form. 'text' for a text message, 'redirect' for a redirect link.
			'jetpackCRM'             => true, // Whether Jetpack CRM should store the form submission.
			'mailpoet'               => null,
			'hostingerReach'         => null,
			'className'              => null,
			'postToUrl'              => null,
			'salesforceData'         => null,
			'hiddenFields'           => null,
			'stepTransition'         => 'fade-slide', // The transition style for multi-step forms. Options: none, fade, slide, fade-slide
			'saveResponses'          => 'yes',
			'emailNotifications'     => 'yes',
			'notificationRecipients' => array(), // Array of user IDs who should receive form response notifications.
			'disableGoBack'          => $attributes['disableGoBack'] ?? false,
			'disableSummary'         => $attributes['disableSummary'] ?? false,
		);

		$attributes = shortcode_atts( $this->defaults, $attributes, 'contact-form' );

		// Transform boolean saveResponses to string for backend compatibility
		if ( isset( $attributes['saveResponses'] ) && is_bool( $attributes['saveResponses'] ) ) {
			$attributes['saveResponses'] = $attributes['saveResponses'] ? 'yes' : 'no';
		}

		// Transform boolean emailNotifications to string for backend compatibility
		if ( isset( $attributes['emailNotifications'] ) && is_bool( $attributes['emailNotifications'] ) ) {
			$attributes['emailNotifications'] = $attributes['emailNotifications'] ? 'yes' : 'no';
		}

		// We only enable the contact-field shortcode temporarily while processing the contact-form shortcode.
		Contact_Form_Plugin::$using_contact_form_field = true;

		parent::__construct( $attributes, $content );

		// There were no fields in the contact form. The form was probably just [contact-form /]. Build a default form.
		if ( empty( $this->fields ) ) {
			// same as the original Grunion v1 form.
			$default_form = '
				[contact-field label="' . __( 'Name', 'jetpack-forms' ) . '" type="name"  required="true" /]
				[contact-field label="' . __( 'Email', 'jetpack-forms' ) . '" type="email" required="true" /]
				[contact-field label="' . __( 'Website', 'jetpack-forms' ) . '" type="url" /]';

			if ( 'yes' === strtolower( $this->get_attribute( 'show_subject' ) ) ) {
				$default_form .= '
					[contact-field label="' . __( 'Subject', 'jetpack-forms' ) . '" type="subject" /]';
			}

			$default_form .= '
				[contact-field label="' . __( 'Message', 'jetpack-forms' ) . '" type="textarea" /]';

			$this->parse_content( $default_form );
		}

		// $this->body and $this->fields have been setup.  We no longer need the contact-field shortcode.
		Contact_Form_Plugin::$using_contact_form_field = false;
	}
	/**
	 * Get the instance of the contact form from a JWT token.
	 *
	 * @param string $jwt_token The JWT token.
	 * @param bool   $throw_exception Whether to throw an exception if the JWT token is invalid or cannot be decoded.
	 *
	 * @return Contact_Form|null The contact form instance, or null if decoding fails and $throw_exception is false.
	 * @throws \Exception If the JWT token is invalid or cannot be decoded and $throw_exception is true.
	 */
	public static function get_instance_from_jwt( $jwt_token, $throw_exception = false ) {
		$secret = self::get_secret();

		try {
			$data = JWT::decode( $jwt_token, $secret, array( 'HS256' ), true );
		} catch ( \Exception $e ) {
			// Re-throw with more context about the failure.
			if ( $throw_exception ) {
				throw new \Exception(
					sprintf(
						/* translators: %s is the original exception message */
						__( 'Failed to decode JWT token: %s', 'jetpack-forms' ),
						$e->getMessage()
					),
					0,
					$e
				);
			}

			return null;
		}

		$source = $data['source'] ?? array();

		if ( empty( $source ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- check done by caller process_form_submission()
			$source_post_id = ! empty( $_POST['contact-form-id'] ) && is_numeric( $_POST['contact-form-id'] ) ? absint( wp_unslash( $_POST['contact-form-id'] ) ) : 0;
			$post           = get_post( $source_post_id );

			if ( $post !== null && $source_post_id > 0 ) {
				// create a fallback source
				$source = array(
					'source_id'   => $post->ID,
					'entry_title' => $post->post_title,
					'entry_page'  => 1,
					'source_type' => 'single',
					'request_url' => get_permalink( $post ),
				);
			}
		}

		$form                   = new self( $data['attributes'], $data['content'], empty( $data['attributes']['id'] ) );
		$form->source           = Feedback_Source::from_serialized( $source );
		$form->hash             = $data['hash'];
		$form->has_verified_jwt = true;

		return $form;
	}

	/**
	 * Get the context for the contact form based on the attributes and post.
	 *
	 * @param array        $attributes The attributes of the contact form.
	 * @param WP_Post|null $post The post object, if available.
	 *
	 * @return string The context for the contact form.
	 */
	public static function get_context( $attributes, $post = null ) {
		$context = 'jp-form';
		if ( ! empty( $attributes['widget'] ) && $attributes['widget'] ) {
			$context = 'widget-' . $attributes['widget'];
		} elseif ( ! empty( $attributes['block_template'] ) && $attributes['block_template'] ) {
			$context = 'block-template-' . $attributes['block_template'];
		} elseif ( ! empty( $attributes['block_template_part'] ) && $attributes['block_template_part'] ) {
			$context = 'block-template-part-' . $attributes['block_template_part'];
		} elseif ( $post instanceof WP_Post ) {
			$context = (string) $post->ID;
		}

		return $context;
	}

	/**
	 * Increment the count of forms for a specific context.
	 *
	 * @param array        $attributes The attributes of the contact form.
	 * @param WP_Post|null $post The post object, if available.
	 *
	 * @return void
	 */
	public static function increment_form_context_count( $attributes, $post ) {
		$context = self::get_context( $attributes, $post );
		if ( ! isset( self::$forms_context[ $context ] ) ) {
			self::$forms_context[ $context ] = 1;
			return;
		}
		self::$forms_context[ $context ] = self::get_forms_context_count( $context ) + 1;
	}

	/**
	 * Get the count of forms.
	 *
	 * @return int The count of forms.
	 */
	public static function get_forms_count() {
		return count( self::$forms );
	}

	/**
	 * Compute the ID for the contact form based on the attributes and post.
	 *
	 * @param array        $attributes The attributes of the contact form.
	 * @param WP_Post|null $post The post object, if available.
	 * @param int          $page_number The page number, if available.
	 *
	 * @return string The ID for the contact form.
	 */
	public static function compute_id( $attributes, $post = null, $page_number = 1 ) {

		$context = self::get_context( $attributes, $post );
		$id_part = array( $context );

		if ( self::get_forms_context_count( $context ) > 0 ) {
			$id_part[] = self::get_forms_context_count( $context );
		}

		$page_num = max( 1, intval( $page_number ) );
		if ( $page_num > 1 ) {
			$id_part[] = $page_num;
		}

		return implode( '-', $id_part );
	}

	/**
	 * Helper function to get the secret from the Tokens class.
	 *
	 * @return string The secret from the Tokens class, or a default secret if not available.
	 */
	private static function get_secret() {

		/**
		 * Filter the secret used for signing contact form JWT tokens.
		 *
		 * @param string $secret Passes a empty string by default so that we can fall back to other methods if the filter is not used.
		 *
		 * @return string The secret used for signing contact form JWT tokens.
		 */
		$secret = apply_filters( 'jetpack_forms_secret_jwt', '' );
		if ( is_string( $secret ) && ! empty( $secret ) ) {
			return $secret;
		}

		$token = ( new Tokens() )->get_access_token();

		if ( ! empty( $token->secret ) ) {
			return $token->secret;
		}

		$secret = get_option( 'jetpack_forms_secret_key', false );
		if ( empty( $secret ) ) {
			// Generate a fallback secret if we don't have one from Tokens.
			$secret = wp_generate_password( 64, true, true );
			update_option( 'jetpack_forms_secret_key', $secret );
		}

		return $secret;
	}

	/**
	 * Helper function to get the attributes of the contact form.
	 *
	 * @return array The attributes of the contact form.
	 */
	public function get_attributes() {
		return $this->attributes;
	}

	/**
	 * Get the JWT token for the contact form instance.
	 *
	 * @return string The JWT token.
	 */
	public function get_jwt() {
		$attributes   = $this->attributes;
		$this->source = Feedback_Source::get_current( $attributes );
		return JWT::encode(
			array(
				'attributes' => $attributes,
				'content'    => $this->content,
				'hash'       => $this->hash,
				'source'     => $this->source->serialize(),
			),
			self::get_secret()
		);
	}

	/**
	 * Get the current source obejct. That is relevent to the form and there current request.
	 *
	 * @return Feedback_Source Return the current feedback source object.
	 */
	public function get_source() {
		if ( ! $this->source ) {
			$attributes   = $this->attributes;
			$this->source = Feedback_Source::get_current( $attributes );
		}
		return $this->source;
	}

	/**
	 * Get the count of forms.
	 *
	 * @param string $context The context for which to get the count of forms.
	 *
	 * @return int The count of forms.
	 */
	public static function get_forms_context_count( $context ) {
		if ( ! isset( self::$forms_context[ $context ] ) ) {
			self::$forms_context[ $context ] = 0;
			return 0;
		}

		return self::$forms_context[ $context ];
	}

	/**
	 * Get the default recipient email address for the contact form.
	 *
	 * @param int|null             $post_author_id The ID of the post author. If provided, will return the author's email.
	 * @param Feedback_Source|null $source The source of the feedback entry. Optional, not used currently.
	 *
	 * @return string The default recipient email address.
	 */
	public static function get_default_to( $post_author_id = null, $source = null ) {
		// Get the default recipient email address.
		$default_to = get_option( 'admin_email' );
		// Check that the user has edit permissions for this blog and has an email address
		if ( ! $post_author_id ) {
			return $default_to;
		}

		// Check that source is of type Feedback_Source
		if ( ! $source instanceof Feedback_Source ) {
			return $default_to;
		}

		if ( absint( $source->get_id() ) === 0 ) {
			return $default_to;
		}

		$post = get_post( $source->get_id() );
		if ( ! $post ) {
			return $default_to;
		}

		return self::get_default_to_for_editor( $post );
	}

	/**
	 * Get the default recipient email address for the contact form based on post data.
	 *
	 * This is used when we load the post or page in the editor, and we don't have the post author ID directly.
	 *
	 * @param mixed|null $post Optional post data (object or array).
	 *
	 * @return string The default recipient email address.
	 */
	public static function get_default_to_for_editor( $post = null ) {
		$default_to = get_option( 'admin_email' );

		if ( empty( $post ) ) {
			return $default_to;
		}

		$post_author_id = self::get_post_property( $post, 'post_author' );
		$post_id        = self::get_post_property( $post, 'ID' );
		$post_author    = get_user( $post_author_id );

		// Check that the user has edit permissions for this blog and has an email address
		if ( empty( $post_author ) || empty( $post_author->user_email ) ) {
			return $default_to;
		}

		// Check that the user is still a member of the blog.
		if ( ! is_user_member_of_blog( $post_author_id ) ) {
			return $default_to;
		}

		// Check that the author can still edit the post or page.
		if ( user_can( $post_author_id, 'edit_post', $post_id ) ) {
			return $post_author->user_email;
		}

		return $default_to;
	}

	/**
	 * Safely get a property from post data (object or array).
	 *
	 * @param mixed  $post_data Post data (object or array).
	 * @param string $property  Property name to get.
	 *
	 * @return mixed|null The property value or null if not found.
	 */
	public static function get_post_property( $post_data, $property ) {
		if ( ! $post_data ) {
			return null;
		}

		if ( is_object( $post_data ) && isset( $post_data->$property ) ) {
			return $post_data->$property;
		} elseif ( is_array( $post_data ) && isset( $post_data[ $property ] ) ) {
			return $post_data[ $property ];
		}

		return null;
	}

	/**
	 * Get the default subject for the contact form.
	 *
	 * @param array $attributes The attributes of the contact form.
	 * @param mixed $post_data Optional post data (object or array).
	 *
	 * @return string The default subject for the contact form.
	 */
	public static function get_default_subject( $attributes, $post_data = null ) {
		global $post;
		// Get the default subject for the contact form.
		$default_subject = '[' . get_option( 'blogname' ) . ']';

		// Get post title safely
		$post_title = self::get_post_property( $post_data, 'post_title' );

		if ( ! $post_title && $post ) {
			$post_title = self::get_post_property( $post, 'post_title' );
		}

		if ( $post_title ) {
			$default_subject = sprintf(
				// translators: the blog name and post title.
				_x( '%1$s %2$s', '%1$s = blog name, %2$s = post title', 'jetpack-forms' ),
				$default_subject,
				Contact_Form_Plugin::strip_tags( $post_title )
			);
		}

		if ( ! empty( $attributes['widget'] ) && $attributes['widget'] ) {
			// translators: '%1$s the blog name
			$default_subject = sprintf( _x( '%1$s Sidebar', '%1$s = blog name', 'jetpack-forms' ), $default_subject );
		}

		return $default_subject;
	}

	/**
	 * Store shortcode content for recall later
	 *  - used to receate shortcode when user uses do_shortcode
	 *
	 * @deprecated 5.0.0
	 */
	public static function store_shortcode() {
		_deprecated_function( __METHOD__, '5.0.0', 'Contact_Form_Plugin::store_shortcode()' );
	}

	/**
	 * Toggle for printing the grunion.css stylesheet
	 *
	 * @param bool $style - the CSS style.
	 *
	 * @return bool
	 */
	public static function style( $style ) {
		$previous_style = self::$style;
		self::$style    = (bool) $style;
		return $previous_style;
	}

	/**
	 * Turn on printing of grunion.css stylesheet
	 *
	 * @see ::style()
	 *
	 * @return bool
	 */
	public static function style_on() {
		return self::style( true );
	}
	/**
	 * Adds a quick link to the admin bar for the contact form entries.
	 *
	 * @param \WP_Admin_Bar $admin_bar The admin bar object.
	 */
	public static function add_quick_link_to_admin_bar( \WP_Admin_Bar $admin_bar ) {

		if ( ! current_user_can( 'edit_pages' ) ) {
			return;
		}

		$url = Forms_Dashboard::get_forms_admin_url();

		$admin_bar->add_menu(
			array(
				'id'     => 'jetpack-forms',
				'parent' => null,
				'group'  => null,
				'title'  => '<span class="dashicons dashicons-feedback ab-icon" style="top: 2px;"></span><span class="ab-label">' . esc_html__( 'Form Responses', 'jetpack-forms' ) . '</span>',
				'href'   => $url,
			)
		);
	}

	/**
	 * The contact-form shortcode processor
	 *
	 * @param array       $attributes Key => Value pairs as parsed by shortcode_parse_atts().
	 * @param string|null $content The shortcode's inner content: [contact-form]$content[/contact-form].
	 * @param array       $context An array of context data for the form.
	 *
	 * @return string HTML for the concat form.
	 */
	public static function parse( $attributes, $content, $context = array() ) {
		global $post, $page, $multipage; // $page is used in the contact-form submission redirect
		if ( Settings::is_syncing() ) {
			return '';
		}
		if ( isset( $GLOBALS['grunion_block_template_part_id'] ) ) {
			self::style_on();
			if ( is_array( $attributes ) ) {
				$attributes['block_template_part'] = $GLOBALS['grunion_block_template_part_id'];
			}
		}

		if ( is_singular() ) {
			add_action( 'admin_bar_menu', array( __CLASS__, 'add_quick_link_to_admin_bar' ), 100 ); // We use priority 100 so that the link that is added gets added after the "Edit Page" link.
		}
		$plugin               = Contact_Form_Plugin::init();
		$attributes['widget'] = $plugin->get_current_widget_context();
		// Create a new Contact_Form object (this class)
		$form = new Contact_Form( $attributes, $content );
		Contact_Form_Plugin::reset_step();

		$id = $form->get_attribute( 'id' );

		if ( ! $id ) { // something terrible has happened
			return '[contact-form]';
		}

		if ( is_feed() ) {
			return '[contact-form]';
		}

		self::$last = $form;

		// Enqueue the grunion.css stylesheet if self::$style allows it
		if ( self::$style && ( empty( $_REQUEST['action'] ) || $_REQUEST['action'] !== 'grunion_shortcode_to_json' ) ) {
			// Enqueue the style here instead of printing it, because if some other plugin has run the_post()+rewind_posts(),
			// (like VideoPress does), the style tag gets "printed" the first time and discarded, leaving the contact form unstyled.
			// when WordPress does the real loop.
			wp_enqueue_style( 'grunion.css' );
			wp_enqueue_script( 'accessible-form' );
		}

		$version = \JETPACK__VERSION;

		// Extra cache busting strategy for view.js, seems they are left out of cache clearing on deploys
		$asset_file = plugin_dir_path( __FILE__ ) . 'dist/modules/form/view.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : null;

		if ( $asset && isset( $asset['version'] ) ) {
			$version = $asset['version'];
		}

		$config = array(
			'error_types'    => array(
				'is_required'        => __( 'This field is required.', 'jetpack-forms' ),
				'invalid_form_empty' => __( 'The form you are trying to submit is empty.', 'jetpack-forms' ),
				'invalid_form'       => __( 'Please fill out the form correctly.', 'jetpack-forms' ),
				'network_error'      => __( 'Connection issue while submitting the form. Check that you are connected to the Internet and try again.', 'jetpack-forms' ),
			),
			'admin_ajax_url' => admin_url( 'admin-ajax.php' ),
		);
		wp_interactivity_config( 'jetpack/form', $config );
		\wp_enqueue_script_module(
			'jp-forms-view',
			plugins_url( 'dist/modules/form/view.js', dirname( __DIR__ ) ),
			array( '@wordpress/interactivity' ),
			$version
		);

		$is_single_input_form = is_array( $form->fields ) && count( $form->fields ) === 1;

		$container_classes = array( 'wp-block-jetpack-contact-form-container' );

		if ( $is_single_input_form ) {
			$container_classes[] = 'is-single-input-form';
		}

		$container_classes[]      = self::get_block_alignment_class( $attributes );
		$container_classes_string = implode( ' ', $container_classes );

		$is_reload_after_success = isset( $_GET['contact-form-id'] )
		&& (int) $_GET['contact-form-id'] === (int) self::$last->get_attribute( 'id' )
		&& isset( $_GET['contact-form-sent'] )
		&& isset( $_GET['contact-form-hash'] )
		&& is_string( $_GET['contact-form-hash'] )
		&& hash_equals( $form->hash, wp_unslash( $_GET['contact-form-hash'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$feedback_id           = 0;
		$is_reload_nonce_valid = false;

		if ( $is_reload_after_success ) {
			$feedback_id           = (int) $_GET['contact-form-sent'];
			$is_reload_nonce_valid = isset( $_GET['_wpnonce'] )
				&& wp_verify_nonce( sanitize_key( wp_unslash( $_GET['_wpnonce'] ) ), "contact-form-sent-{$feedback_id}" );
		}

		$max_steps = 0;
		if ( preg_match_all( '/data-wp-context=[\'"]?{"step":(\d+)}[\'"]?/', $content, $matches ) ) {
			if ( ! empty( $matches[1] ) ) {
				$max_steps = max( array_map( 'intval', $matches[1] ) );
			}
		}

		$is_multistep = $max_steps > 0;
		$element_id   = 'jp-form-' . esc_attr( $form->hash );

		// Initial data used to render the success message when the page is reloaded after a successful submission
		// Don't show the feedback details unless the nonce matches
		$submission_data = null;

		if ( $is_reload_after_success && $is_reload_nonce_valid ) {
			$response = Feedback::get( (int) $_GET['contact-form-sent'] );

			if ( $response ) {
				$submission_data = $response->get_compiled_fields( 'web', 'label|value' );
			}
		}

		$formatted_submission_data = $submission_data ? self::format_submission_data( $submission_data ) : array();
		$submission_success        = $form->is_response_without_reload_enabled && $is_reload_after_success;
		$has_custom_redirect       = $form->has_custom_redirect();

		$default_context = array(
			'formId'                  => $id,
			'formHash'                => $form->hash,
			'showErrors'              => $form->has_errors(), // We toggle this to true when we want to show the user errors right away.
			'errors'                  => array(), // This should be a associative array.
			'fields'                  => array(),
			'isMultiStep'             => $is_multistep, // Whether the form is a multistep form.
			'useAjax'                 => $form->is_response_without_reload_enabled && ! $has_custom_redirect,
			'submissionData'          => $submission_data,
			'formattedSubmissionData' => $formatted_submission_data,
			'submissionSuccess'       => $submission_success,
			'submissionError'         => null,
			'elementId'               => $element_id,
		);

		if ( $is_multistep ) {
			$multistep_context = array(
				'currentStep' => isset( $_GET[ $id . '-step' ] ) ? absint( $_GET[ $id . '-step' ] ) : 1, // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				'maxSteps'    => $max_steps,
				'direction'   => 'forward', // Default direction for animations
				'transition'  => $form->get_attribute( 'stepTransition' ) ? $form->get_attribute( 'stepTransition' ) : 'fade-slide', // Transition style for step animations
			);

			if ( ! is_array( $context ) ) {
				$context = array();
			}
			$context = array_merge( $context, $multistep_context );
		}

		$context = is_array( $context ) ? array_merge( $default_context, $context ) : $default_context;

		$r  = '';
		$r .= "<div data-test='contact-form'
			id='contact-form-$id'
			class='{$container_classes_string}'
			data-wp-interactive='jetpack/form' " . wp_interactivity_data_wp_context( $context ) . "
			data-wp-watch--scroll-to-wrapper=\"callbacks.scrollToWrapper\"
		>\n";

		if ( $form->is_response_without_reload_enabled ) {
			$r .= self::render_ajax_success_wrapper( $form, $submission_success, $formatted_submission_data );
		}

		if ( $form->has_errors() ) {
			// There are errors.  Display them
			$r .= "<div class='form-error'>\n<h3>" . __( 'Error!', 'jetpack-forms' ) . "</h3>\n<ul class='form-errors'>\n";
			foreach ( $form->get_error_messages() as $message ) {
				$r .= "\t<li class='form-error-message'>" . esc_html( $message ) . "</li>\n";
			}
			$r .= "</ul>\n</div>\n\n";
		}

		if ( $is_reload_after_success && $form->is_response_without_reload_enabled ) {
			$r .= '<noscript>';
			$r .= self::render_noscript_success_message( $is_reload_nonce_valid, $feedback_id, $form );
			$r .= '</noscript>';
		}

		if ( $is_reload_after_success && ! $form->is_response_without_reload_enabled ) {
			// The contact form was submitted.  Show the success message/results.
			$r .= self::render_noscript_success_message( $is_reload_nonce_valid, $feedback_id, $form );
		} else {
			// Nothing special - show the normal contact form
			if ( $form->get_attribute( 'widget' )
				|| $form->get_attribute( 'block_template' )
				|| $form->get_attribute( 'block_template_part' ) ) {
				// Submit form to the current URL
				$url = remove_query_arg( array( 'contact-form-id', 'contact-form-sent', 'action', '_wpnonce' ) );
			} else {
				// Submit form to the post permalink
				$url = get_permalink();
				if ( $multipage && $page ) {
					$url = add_query_arg( 'page', $page, $url );
				}
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
			$url                     = apply_filters( 'grunion_contact_form_form_action', $url, $GLOBALS['post'], $id, $page );
			$has_submit_button_block = str_contains( $content, 'wp-block-jetpack-button' );
			$form_classes            = 'contact-form commentsblock';
			if ( $submission_success ) {
				$form_classes .= ' submission-success';
			}
			$post_title           = $post->post_title ?? '';
			$form_accessible_name = ! empty( $attributes['formTitle'] ) ? $attributes['formTitle'] : $post_title;
			$form_aria_label      = isset( $form_accessible_name ) && ! empty( $form_accessible_name ) ? 'aria-label="' . esc_attr( $form_accessible_name ) . '"' : '';

			if ( $has_submit_button_block ) {
				$form_classes .= ' wp-block-jetpack-contact-form';
			}

			$r .= "<form action='" . esc_url( $url ) . "'
				id='" . $element_id . "'
				method='post'
				class='" . esc_attr( $form_classes ) . "' $form_aria_label
				data-wp-on--submit=\"actions.onFormSubmit\"
				data-wp-on--reset=\"actions.onFormReset\"
				data-wp-class--submission-success=\"context.submissionSuccess\"
				data-wp-class--is-first-step=\"state.isFirstStep\"
				data-wp-class--is-last-step=\"state.isLastStep\"
				data-wp-class--is-ajax-form=\"context.useAjax\"
				novalidate >\n";

			if ( $is_multistep ) { // This makes the "enter" key work in multi-step forms as expected.
				$r .= '<input type="submit" style="display: none;" />';
			}
			$r .= "<input type='hidden' name='jetpack_contact_form_jwt' value='" . esc_attr( $form->get_jwt() ) . "' />\n";
			$r .= $form->body;

			if ( $is_multistep ) {
				$r = preg_replace( '/<div class="wp-block-jetpack-form-step-navigation__wrapper/', self::render_error_wrapper() . ' <div class="wp-block-jetpack-form-step-navigation__wrapper', $r, 1 );
			} elseif ( $has_submit_button_block && ! $is_single_input_form ) {
				// Place the error wrapper before the FIRST button block only to avoid duplicates (e.g., navigation buttons in multistep forms).
				// Replace only the first occurrence.
				$r = preg_replace( '/<div class="wp-block-jetpack-button/', self::render_error_wrapper() . ' <div class="wp-block-jetpack-button', $r, 1 );
			}

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

				$r .= self::render_error_wrapper();
				$r .= "\t\t<button type='submit' class='" . esc_attr( $submit_button_class ) . "'";
				if ( ! empty( $submit_button_styles ) ) {
					$r .= " style='" . esc_attr( $submit_button_styles ) . "'";
				}
				$r .= '>';
				$r .= wp_kses(
					$submit_button_text,
					self::$allowed_html_tags_for_submit_button
				) . '</button>';
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

		/**
		 * Filter the contact form, allowing plugins to modify the HTML.
		 *
		 * @module contact-form
		 *
		 * @since 10.2.0
		 *
		 * @param string $r The contact form HTML.
		 */
		return apply_filters( 'jetpack_contact_form_html', $r );
	}

	/**
	 * Renders the success message for the contact form when js is disabled or not desired.
	 *
	 * @param bool         $is_reload_nonce_valid - whether the nonce is valid.
	 * @param int          $feedback_id - the feedback ID.
	 * @param Contact_Form $form - the contact form.
	 *
	 * @return string HTML string for the success message.
	 */
	private static function render_noscript_success_message( $is_reload_nonce_valid, $feedback_id, $form ) {
		$back_url        = remove_query_arg( array( 'contact-form-id', 'contact-form-sent', '_wpnonce', 'contact-form-hash' ) );
		$contact_form_id = sanitize_text_field( wp_unslash( $_GET['contact-form-id'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$disable_go_back = $form->get_attribute( 'disableGoBack' );

		$message = '';

		$message .= '<style>
			.contact-form-ajax-submission {
				display: none;
			}

			#contact-form-' . $contact_form_id . ' form.contact-form {
				display: none;
			}
		</style>';

		$message        .= '<div class="contact-form-submission">';
		$success_message = '';

		if ( ! $disable_go_back ) {
			$success_message = '<p class="go-back-message"> <a class="link" href="' . esc_url( $back_url ) . '">' . esc_html__( 'Go back', 'jetpack-forms' ) . '</a> </p>';
		}

		$success_message .= '<h4 id="contact-form-success-header">' . esc_html( $form->get_attribute( 'customThankyouHeading' ) ) . "</h4>\n\n";

		// Don't show the feedback details unless the nonce matches
		if ( $is_reload_nonce_valid ) {
			$success_message .= self::success_message( $feedback_id, $form );
		}

		/**
		 * Filter the message returned after a successful contact form submission.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 *
		 * @param string $message Success message.
		 */
		$message .= apply_filters( 'grunion_contact_form_success_message', $success_message );
		$message .= '</div>';

		return $message;
	}

	/**
	 * Helper function to format the submission data for the success message.
	 *
	 * @param array $data The submission data.
	 *
	 * @return array The formatted submission data.
	 */
	private static function format_submission_data( $data ) {
		$formatted_submission_data = array();

		foreach ( $data as $field_data ) {
			$formatted_submission_data[] = array(
				'label'  => self::maybe_add_colon_to_label( $field_data['label'] ),
				'value'  => self::maybe_transform_value( $field_data['value'] ),
				'images' => self::get_images( $field_data['value'] ),
			);
		}

		return $formatted_submission_data;
	}

	/**
	 * Helper function that display the error wrapper.
	 *
	 * @return string HTML string for the error wrapper.
	 */
	private static function render_error_wrapper() {
		$html  = '<div class="contact-form__error" data-wp-class--show-errors="state.showFormErrors">';
		$html .= '<span class="contact-form__warning-icon"><span class="visually-hidden">' . __( 'Warning.', 'jetpack-forms' ) . '</span><i aria-hidden="true"></i></span>
				<span data-wp-text="state.getFormErrorMessage"></span>
				<ul>
				<template data-wp-each="state.getErrorList" data-wp-key="context.item.id">
					<li><a data-wp-bind--href="context.item.anchor" data-wp-on--click="actions.scrollIntoView" data-wp-text="context.item.label"></a></li>
				</template>
				</ul>';
		$html .= '</div>';

		$html .= '<div class="contact-form__error" data-wp-class--show-errors="state.showSubmissionError" data-wp-text="context.submissionError"></div>';
		return $html;
	}

	/**
	 * Renders the success wrapper after a form is submitted without reloading the page.
	 *
	 * @param Contact_Form $form - the contact form.
	 * @param bool         $submission_success - whether the form has already been submitted.
	 * @param array        $formatted_submission_data - the formatted submission data.
	 *
	 * @return string HTML string for the success wrapper.
	 */
	private static function render_ajax_success_wrapper( $form, $submission_success = false, $formatted_submission_data = array() ) {
		$classes = 'contact-form-submission contact-form-ajax-submission';

		if ( $submission_success ) {
			$classes .= ' submission-success';
		}

		$back_url          = remove_query_arg( array( 'contact-form-id', 'contact-form-sent', '_wpnonce', 'contact-form-hash' ) );
		$disable_go_back   = $form->get_attribute( 'disableGoBack' );
		$disable_summary   = $form->get_disable_summary();
		$confirmation_type = $form->get_confirmation_type();

		if ( $confirmation_type === 'redirect' ) {
			return '';
		}

		$html = '<div class="' . esc_attr( $classes ) . '" data-wp-class--submission-success="context.submissionSuccess">';

		if ( ! $disable_go_back ) {
			$html .= '<p class="go-back-message">';
			$html .= '<a class="link" role="button" tabindex="0" data-wp-on--click="actions.goBack" href="' . esc_url( $back_url ) . '">' . esc_html__( 'Go back', 'jetpack-forms' ) . '</a>';
			$html .= '</p>';
		}

		$html .=
			'<h4 id="contact-form-success-header">' . esc_html( $form->get_attribute( 'customThankyouHeading' ) ) .
			"</h4>\n\n";

		if ( 'text' === $confirmation_type ) {
			$raw_message = $form->get_attribute( 'customThankyouMessage' );

			if ( $raw_message !== '' ) {
				// Add more allowed HTML elements for file download links
				$allowed_html = array(
					'br'         => array(),
					'blockquote' => array( 'class' => array() ),
					'p'          => array(),
					'div'        => array(
						'class' => array(),
						'style' => array(),
					),
					'span'       => array(
						'class' => array(),
						'style' => array(),
					),
				);

				$message = wp_kses( $raw_message, $allowed_html );
				$message = '<div class="jetpack_forms_contact-form-custom-success-message">' . $message . '</div>';

				$html .= $message;
			}

			if ( ! $disable_summary ) {
				$html .= '<template data-wp-each--submission="context.formattedSubmissionData">
					<div class="jetpack_forms_contact-form-success-summary">
						<div class="field-name" data-wp-text="context.submission.label" data-wp-bind--hidden="!context.submission.label"></div>
						<div class="field-value" data-wp-text="context.submission.value"></div>
						<div class="field-images" data-wp-bind--hidden="!context.submission.images">
							<template data-wp-each--image="context.submission.images">
								<figure class="field-image" data-wp-class--is-empty="!context.image">
									<img data-wp-bind--src="context.image" data-wp-bind--hidden="!context.image" />
									<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" data-wp-bind--hidden="context.image" />
								</figure>
							</template>
						</div>
					</div>
				</template>';

				// For each entry in the submission data array, render a div with the label and value.
				foreach ( $formatted_submission_data as $submission ) {
					$html .= '<div data-wp-each-child class="jetpack_forms_contact-form-success-summary">
						<div class="field-name" data-wp-text="context.submission.label" data-wp-bind--hidden="!context.submission.label">' . $submission['label'] . '</div>
						<div class="field-value" data-wp-text="context.submission.value">' . $submission['value'] . '</div>
						<div class="field-images" data-wp-bind--hidden="!context.submission.images">';

					if ( ! empty( $submission['images'] ) ) {
						foreach ( $submission['images'] as $image ) {
							$html .= '<figure data-wp-each-child class="field-image ' . ( empty( $image ) ? 'is-empty' : '' ) . '" data-wp-class--is-empty="!context.image">';
							$html .= '<img data-wp-bind--src="context.image" src="' . $image . '" data-wp-bind--hidden="!context.image"' . ( empty( $image ) ? 'hidden' : '' ) . '/>';
							$html .= '<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" data-wp-bind--hidden="context.image"' . ( empty( $image ) ? '' : 'hidden' ) . '/>';
							$html .= '</figure>';
						}
					} else {
						$html .= '<template data-wp-each--image="context.submission.images"></template>';
					}

					$html .= '</div></div>';
				}
			}
		}

		$html .= '</div>';
		return $html;
	}

	/**
	 * Returns a success message to be returned if the form is sent via AJAX.
	 *
	 * @param int          $feedback_id - the feedback ID.
	 * @param Contact_Form $form - the contact form.
	 *
	 * @return string $message
	 */
	public static function success_message( $feedback_id, $form ) {
		$message           = '';
		$disable_summary   = $form->get_disable_summary();
		$confirmation_type = $form->get_confirmation_type();

		if ( 'text' === $confirmation_type ) {
			$raw_message = $form->get_attribute( 'customThankyouMessage' );

			if ( $raw_message !== '' ) {
				// Add more allowed HTML elements for file download links
				$allowed_html = array(
					'br'         => array(),
					'blockquote' => array( 'class' => array() ),
					'p'          => array(),
					'div'        => array(
						'class' => array(),
						'style' => array(),
					),
					'span'       => array(
						'class' => array(),
						'style' => array(),
					),
				);

				$message = wp_kses( $raw_message, $allowed_html );
				$message = '<div class="jetpack_forms_contact-form-custom-success-message">' . $message . '</div>';
			}

			if ( ! $disable_summary ) {
				$compiled_form = self::get_compiled_form( $feedback_id );

				$message .= '<div class="jetpack_forms_contact-form-success-summary"><p>' . implode( '</p><p>', $compiled_form ) . '</p></div>';
			}
		}

		return $message;
	}

	/**
	 * Returns a compiled form with labels and values in a form of  an array
	 * of lines.
	 *
	 * @param int          $feedback_id - the feedback ID.
	 * @param Contact_Form $form - the form. This parameter is deprecated and will be removed in the next version.
	 *
	 * @return array $lines
	 */
	public static function get_compiled_form( $feedback_id, $form = null ) {

		if ( $form ) {
			_deprecated_argument( __METHOD__, '5.1.0', '$form is deprecated' );
		}
		$compiled_form = self::get_raw_compiled_form_data( $feedback_id );

		foreach ( $compiled_form as $field_index => $data ) {
			$safe_display_value = self::escape_and_sanitize_field_value( $data['value'] );

			if ( '' === $safe_display_value ) {
				$safe_display_value = '-';
			}

			if ( ! empty( $data['label'] ) ) {
				$safe_display_label            = self::escape_and_sanitize_field_label( $data['label'] );
				$compiled_form[ $field_index ] = sprintf(
					'<div class="field-name">%1$s</div> <div class="field-value">%2$s</div>',
					self::maybe_add_colon_to_label( $safe_display_label ),
					$safe_display_value
				);
			} else {
				// If there is no label, only output the field value, wrapped in its div.
				$compiled_form[ $field_index ] = sprintf(
					'<div class="field-value">%s</div>',
					$safe_display_value
				);
			}
		}

		return $compiled_form;
	}

	/**
	 * Returns the JSON data for the form submission.
	 *
	 * @param int          $feedback_id - the feedback ID.
	 * @param Contact_Form $form - the form. This parameter is deprecated and will be removed in the next version.
	 *
	 * @deprecated 5.1.0
	 *
	 * @return array $json_data
	 */
	public static function get_json_data( $feedback_id, $form = null ) {
		_deprecated_function( __METHOD__, '5.1.0', 'Feedback::get( $feedback_id )->get_compiled_fields(\'ajax\', \'label|value\' )' );

		if ( $form ) {
			_deprecated_argument( __METHOD__, '5.1.0', '$form is deprecated' );
		}

		$response = Feedback::get( $feedback_id );
		if ( ! $response ) {
			return array();
		}

		return $response->get_compiled_fields( 'ajax', 'label|value' );
	}

	/**
	 * Retrieves raw compiled form data.
	 *
	 * @param int          $feedback_id - the feedback ID.
	 * @param Contact_Form $form - the form. This parameter is deprecated and will be removed in the next version.
	 *
	 * @return array $raw_data Associative array where keys are field_index and values are arrays with 'label' and 'value'.
	 */
	private static function get_raw_compiled_form_data( $feedback_id, $form = null ) {

		if ( $form ) {
			_deprecated_argument( __METHOD__, '5.1.0', '$form is deprecated' );
		}

		$response = Feedback::get( $feedback_id );
		if ( $response instanceof Feedback ) {
			// If the response is an instance of Feedback, we can use its method to get compiled fields.
			return $response->get_compiled_fields( 'web', 'all' );
		}

		return array();
	}

	/**
	 * Returns a compiled form with labels and values formatted for the email response
	 * in a form of an array of lines.
	 *
	 * @param int          $feedback_id - the feedback ID.
	 * @param Contact_Form $form - the form.
	 *
	 * @return array $lines
	 */
	public static function get_compiled_form_for_email( $feedback_id, $form ) {
		$compiled_form = array();
		$response      = Feedback::get( $feedback_id );

		if ( $response instanceof Feedback ) {
			// If the response is an instance of Feedback, we can use its method to get compiled fields.
			$compiled_form = $response->get_compiled_fields( 'email', 'all' );
		}

		/**
		 * This filter allows a site owner to customize the response to be emailed, by adding their own HTML around it for example.
		 *
		 * @module contact-form
		 *
		 * @since 0.18.0
		 *
		 * @param array $compiled_form the form response to be filtered
		 * @param int $feedback_id the ID of the feedback form
		 * @param Contact_Form $form a copy of this object
		 */
		$updated_compiled_form = apply_filters( 'jetpack_forms_response_email', $compiled_form, $feedback_id, $form );
		if ( $updated_compiled_form !== $compiled_form ) {
			$compiled_form = $updated_compiled_form;
		} else {
			// add styling to the array
			foreach ( $compiled_form as $key => $value ) {
				$safe_display_label = self::escape_and_sanitize_field_label( $value['label'] );
				$safe_display_value = self::escape_and_sanitize_field_value( $value['value'] );

				if ( ! empty( $safe_display_label ) ) {
					$compiled_form[ $key ] = sprintf(
						'<p><strong>%1$s</strong><br /><span>%2$s</span></p>',
						self::maybe_add_colon_to_label( $safe_display_label ),
						$safe_display_value
					);
				} else {
					$compiled_form[ $key ] = sprintf(
						'<p><span>%s</span></p>',
						$safe_display_value
					);
				}
			}
		}

		return $compiled_form;
	}

	/**
	 * Escape and sanitize a field value.
	 *
	 * @param mixed $value - the value to sanitize.
	 *
	 * @return mixed|string
	 */
	public static function escape_and_sanitize_field_value( $value ) {
		if ( empty( $value ) ) {
			return '';
		}

		// Handle file upload field (new structure with field_id and files array)
		if ( self::is_file_upload_field( $value ) ) {
			$files = $value['files'];
			if ( empty( $files ) ) {
				return '';
			}

			$file_links = array();
			foreach ( $files as $file ) {
				if ( ! empty( $file['file_id'] ) ) {
					$file_name = isset( $file['name'] ) ? $file['name'] : __( 'Attached file', 'jetpack-forms' );
					$file_size = isset( $file['size'] ) ? size_format( $file['size'] ) : '';

					$html = esc_html( $file_name );
					if ( ! empty( $file_size ) ) {
						$html .= sprintf( ' <span class="jetpack-forms-file-size">(%s)</span>', esc_html( $file_size ) );
					}

					$file_links[] = $html;
				}
			}

			return implode( '<br>', $file_links );
		}

		if ( is_array( $value ) ) {
			return implode( ', ', array_map( array( __CLASS__, 'escape_and_sanitize_field_value' ), $value ) );
		}

		$value = str_replace( array( '[', ']' ), array( '&#91;', '&#93;' ), $value );
		return nl2br( wp_kses( $value, array() ) );
	}

	/**
	 * Only strip out empty string values and keep all the other values as they are.
	 *
	 * @param string $single_value - the single value.
	 *
	 * @return bool
	 */
	public static function remove_empty( $single_value ) {
		return ( $single_value !== '' );
	}

	/**
	 * Get file upload fields
	 *
	 * @param int $post_id The feedback post ID.
	 * @return array Array of file attachments or empty array.
	 */
	public static function get_file_upload_fields( $post_id ) {
		$content_fields     = Contact_Form_Plugin::parse_fields_from_content( $post_id );
		$file_upload_fields = array();
		if ( isset( $content_fields['_feedback_all_fields'] ) ) {
			foreach ( $content_fields['_feedback_all_fields'] as $field_value ) {
				if ( self::is_file_upload_field( $field_value ) ) {
					$file_upload_fields[] = $field_value;
				}
			}
		}

		return $file_upload_fields;
	}

	/**
	 * Delete files
	 *
	 * @param int $post_id The post ID being deleted.
	 * @return void
	 */
	public static function delete_feedback_files( $post_id ) {
		if ( get_post_type( $post_id ) !== 'feedback' ) {
			return;
		}
		// $file_upload_fields = self::get_file_upload_fields( $post_id );
		// TODO: Implement delete_feedback_files() method.
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
	 * @param string|array $val Value to escape.
	 * @return string
	 */
	public static function esc_shortcode_val( $val ) {
		// Sometimes we provide attributes in the form of a collection, hence making the value an array.
		// The above case triggers a warning about array to string conversion on formatting.php:1096.
		// This chunk will try to get the value from the usual label|value structure. Otherwise, it will try
		// recursively to get the first value from the array.
		if ( is_array( $val ) ) {
			if ( isset( $val['value'] ) ) {
				$val = $val['value'];
			} else {
				return self::esc_shortcode_val( array_shift( $val ) );
			}
		}

		return strtr(
			esc_html( $val ),
			array(
				// Brackets in attribute values break the shortcode parser.
				'['  => '&#091;',
				']'  => '&#093;',
				// Shortcode parser screws up backslashes too, thanks to calls to `stripcslashes`.
				'\\' => '&#092;',
				// The existing code here represents arrays as comma-separated strings.
				// Rather than trying to change representations now, just escape the commas in values.
				','  => '&#044;',
			)
		);
	}

	/**
	 * The contact-field shortcode processor.
	 * We use an object method here instead of a static Contact_Form_Field class method to parse contact-field shortcodes so that we can tie them to the contact-form object.
	 *
	 * @param array         $attributes Key => Value pairs as parsed by shortcode_parse_atts().
	 * @param string|null   $content The shortcode's inner content: [contact-field]$content[/contact-field].
	 * @param WP_Block|null $block The field block object.
	 * @return string HTML for the contact form field
	 */
	public static function parse_contact_field( $attributes, $content, $block = null ) {
		if ( $block ) {
			$type = null;
		}

		// Don't try to parse contact form fields if not inside a contact form (????)
		if ( ! Contact_Form_Plugin::$using_contact_form_field ) {
			$type = isset( $attributes['type'] ) ? $attributes['type'] : null;

			if ( $type === 'checkbox-multiple' || $type === 'radio' ) {
				preg_match_all( '/' . get_shortcode_regex() . '/s', $content, $matches );

				if ( ! empty( $matches[0] ) ) {
					$options = array();
					foreach ( $matches[0] as $shortcode ) {
						$attr = shortcode_parse_atts( $shortcode );
						if ( ! empty( $attr['label'] ) ) {
							$options[] = $attr['label'];
						}
					}

					$attributes['options'] = $options;
				}
			}

			if ( ! isset( $attributes['label'] ) ) {
				$attributes['label'] = self::get_default_label_from_type( $type );
			}

			$att_strs = array();
			foreach ( $attributes as $att => $val ) {
				if ( is_numeric( $att ) ) { // Is a valueless attribute
					$att_strs[] = self::esc_shortcode_val( $val );
				} elseif ( isset( $val ) ) { // A regular attr - value pair
					if ( ( $att === 'options' || $att === 'values' ) && is_string( $val ) ) { // remove any empty strings
						$val = explode( ',', $val );
					}
					if ( is_array( $val ) ) {
						$val        = array_filter( $val, array( __CLASS__, 'remove_empty' ) ); // removes any empty strings
						$att_strs[] = esc_html( $att ) . '="' . implode( ',', array_map( array( __CLASS__, 'esc_shortcode_val' ), $val ) ) . '"';
					} elseif ( is_bool( $val ) ) {
						$att_strs[] = esc_html( $att ) . '="' . ( $val ? '1' : '' ) . '"';
					} else {
						// Allow CSS in known style attributes byut sanitize with safecss_filter_attr.
						$allowed_style_keys = array( 'labelstyles', 'inputstyles', 'optionstyles', 'optionsstyles', 'stylevariationstyles' );
						if ( in_array( $att, $allowed_style_keys, true ) ) {
							$sanitized  = safecss_filter_attr( (string) $val );
							$att_strs[] = esc_attr( $att ) . '="' . esc_html( $sanitized ) . '"';
						} else {
							$att_strs[] = esc_attr( $att ) . '="' . self::esc_shortcode_val( $val ) . '"';
						}
					}
				}
			}

			$shortcode_type = 'contact-field';
			if ( $type === 'field-option' ) {
				$shortcode_type = 'contact-field-option';
			}

			$html            = '[' . $shortcode_type . ' ' . implode( ' ', $att_strs );
			$trimmed_content = isset( $content ) ? trim( $content ) : '';

			if ( ! empty( $trimmed_content ) ) { // If there is content, let's add a closing tag
				$html .= ']' . esc_html( $trimmed_content ) . '[/contact-field]';
			} else { // Otherwise let's add a closing slash in the first tag
				$html .= '/]';
			}

			return $html;
		}

		// What does this actually means? What is the case where this is used?
		$form = self::$current_form;

		$field = new Contact_Form_Field( $attributes, $content, $form );

		$field_id = $field->get_attribute( 'id' );
		if ( $field_id ) {
			$form->fields[ $field_id ] = $field;
		} else {
			$form->fields[] = $field;
		}

		if ( // phpcs:disable WordPress.Security.NonceVerification.Missing
			! isset( $_POST['jetpack_contact_form_jwt'] )
			&&
			isset( $_POST['action'] ) && 'grunion-contact-form' === $_POST['action']
			&&
			isset( $_POST['contact-form-id'] ) && (string) $form->get_attribute( 'id' ) === $_POST['contact-form-id']
			&&
			isset( $_POST['contact-form-hash'] ) && is_string( $_POST['contact-form-hash'] ) && hash_equals( $form->hash, wp_unslash( $_POST['contact-form-hash'] ) )
		) { // phpcs:enable
			// If we're processing a POST submission for this contact form, validate the field value so we can show errors as necessary.
			$field->validate();
		}

		// Output HTML
		return $field->render();
	}

	/**
	 * Check if the field is a file upload field.
	 *
	 * @param array $field The field to check.
	 * @return bool True if the field is a file upload field, false otherwise.
	 */
	public static function is_file_upload_field( $field ) {
		return ( is_array( $field ) &&
				! empty( $field ) &&
				isset( $field['field_id'] ) &&
				isset( $field['files'] ) &&
				is_array( $field['files'] ) );
	}

	/**
	 * Get the default label from type.
	 *
	 * @param string $type - the type of label.
	 *
	 * @return string
	 */
	public static function get_default_label_from_type( $type ) {
		switch ( $type ) {
			case 'text':
				$str = __( 'Text', 'jetpack-forms' );
				break;
			case 'name':
				$str = __( 'Name', 'jetpack-forms' );
				break;
			case 'number':
				$str = __( 'Number', 'jetpack-forms' );
				break;
			case 'email':
				$str = __( 'Email', 'jetpack-forms' );
				break;
			case 'url':
				$str = __( 'Website', 'jetpack-forms' );
				break;
			case 'date':
				$str = __( 'Date', 'jetpack-forms' );
				break;
			case 'telephone':
				$str = __( 'Phone', 'jetpack-forms' );
				break;
			case 'textarea':
				$str = __( 'Message', 'jetpack-forms' );
				break;
			case 'checkbox-multiple':
				$str = __( 'Choose several options', 'jetpack-forms' );
				break;
			case 'radio':
				$str = __( 'Choose one option', 'jetpack-forms' );
				break;
			case 'select':
				$str = __( 'Select one', 'jetpack-forms' );
				break;
			case 'consent':
				$str = __( 'Consent', 'jetpack-forms' );
				break;
			case 'file':
				$str = __( 'Upload a file', 'jetpack-forms' );
				break;
			case 'time':
				$str = __( 'Time', 'jetpack-forms' );
				break;
			case 'image-select':
				$str = __( 'Select an image', 'jetpack-forms' );
				break;
			default:
				$str = null;
		}
		return $str;
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
	 * HTML list ( @see Contact_Form_Field::render ) and don't add them
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
	 *  - Contact_Form::process_submission - validation and logic.
	 *
	 *  - Contact_Form::process_submission - add the field as an additional
	 *      field in the `post_content` when saving the feedback content.
	 *
	 *  - Contact_Form_Plugin::parse_fields_from_content - add mapping
	 *      for the field, defined in the above method.
	 *
	 *  - Contact_Form_Plugin::map_parsed_field_contents_of_post_to_field_names -
	 *      add mapping of the field for the CSV Export. Otherwise it will be missing
	 *      from the exported data.
	 *
	 *  - admin.php / grunion_manage_post_columns - add the field to the render logic.
	 *      Otherwise it will be missing from the admin Feedback view.
	 *
	 * @return array
	 */
	public function get_field_ids() {
		$field_ids = array(
			'all'   => array(), // array of all field_ids.
			'extra' => array(), // array of all non-allowed field IDs.

			// Allowed "standard" field IDs:
			// 'email'    => field_id,
			// 'name'     => field_id,
			// 'url'      => field_id,
			// 'subject'  => field_id,
			// 'textarea' => field_id,
		);

		// Initialize marketing consent
		$field_ids['email_marketing_consent']       = null;
		$field_ids['email_marketing_consent_field'] = null;

		foreach ( $this->fields as $id => $field ) {
			$type = $field->get_attribute( 'type' );

			// If the field is not renderable, skip it.
			if ( ! $field->is_field_renderable( $type ) ) {
				continue;
			}

			$field_ids['all'][] = $id;

			if ( isset( $field_ids[ $type ] ) ) {
				// This type of field is already present in our allowed list of "standard" fields for this form
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
				case 'consent':
					// Set email marketing consent for the first Consent type field
					if ( null === $field_ids['email_marketing_consent'] ) {
						$field_ids['email_marketing_consent_field'] = $id;
						if ( $field->value ) {
							$field_ids['email_marketing_consent'] = true;
						} else {
							$field_ids['email_marketing_consent'] = false;
						}
					}
					$field_ids['extra'][] = $id;
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
	public function process_submission() {

		$response = Feedback::from_submission( $_POST, $this ); // phpcs:Ignore WordPress.Security.NonceVerification.Missing
		$response->set_source( $this->get_source() );
		$plugin = Contact_Form_Plugin::init();

		$id                  = $this->get_attribute( 'id' );
		$to                  = $this->get_attribute( 'to' );
		$widget              = $this->get_attribute( 'widget' );
		$block_template      = $this->get_attribute( 'block_template' );
		$block_template_part = $this->get_attribute( 'block_template_part' );

		$contact_form_subject = $this->get_attribute( 'subject' );

		$to     = str_replace( ' ', '', $to );
		$emails = explode( ',', $to );

		$valid_emails = array();

		foreach ( $emails as $email ) {
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

		if ( ! $this->has_verified_jwt ) {
			// Make sure we're processing the form we think we're processing... probably a redundant check.
			if ( $widget ) {
				if ( isset( $_POST['contact-form-id'] ) && 'widget-' . $widget !== $_POST['contact-form-id'] ) { // phpcs:Ignore WordPress.Security.NonceVerification.Missing -- check done by caller process_form_submission()
					return Form_Submission_Error::system_error( 'form_id_mismatch_widget', __( 'Form ID mismatch.', 'jetpack-forms' ) );
				}
			} elseif ( $block_template ) {
				if ( isset( $_POST['contact-form-id'] ) && 'block-template-' . $block_template !== $_POST['contact-form-id'] ) { // phpcs:Ignore WordPress.Security.NonceVerification.Missing -- check done by caller process_form_submission()
					return Form_Submission_Error::system_error( 'form_id_mismatch_block_template', __( 'Form ID mismatch.', 'jetpack-forms' ) );
				}
			} elseif ( $block_template_part ) {
				if ( isset( $_POST['contact-form-id'] ) && 'block-template-part-' . $block_template_part !== $_POST['contact-form-id'] ) { // phpcs:Ignore WordPress.Security.NonceVerification.Missing -- check done by caller process_form_submission()
						return Form_Submission_Error::system_error( 'form_id_mismatch_block_template_part', __( 'Form ID mismatch.', 'jetpack-forms' ) );
				}
			} elseif ( isset( $_POST['contact-form-id'] ) && ( empty( $this->current_post ) || self::get_post_property( $this->current_post, 'ID' ) !== (int) sanitize_text_field( wp_unslash( $_POST['contact-form-id'] ) ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- check done by caller process_form_submission()
				return Form_Submission_Error::system_error( 'form_id_mismatch_post', __( 'Form ID mismatch.', 'jetpack-forms' ) );
			}
		}

		// Initialize all these "standard" fields to null
		$comment_author_email = $response->get_author_email();
		$comment_author       = $response->get_author();

		$contact_form_subject = $response->get_subject();

		// Set marketing consent
		$email_marketing_consent = $response->has_consent();

		if ( null === $email_marketing_consent ) {
			$email_marketing_consent = false;
		}

		$all_values   = $response->get_all_values( 'submit' );
		$extra_values = $response->get_legacy_extra_values( 'submit' );

		if ( ! empty( $_REQUEST['is_block'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- not changing the site.
			$extra_values['is_block'] = true;
		}

		$contact_form_subject = trim( $contact_form_subject );

		$comment_author_ip = Contact_Form_Plugin::get_ip_address();

		// Ensure that Akismet gets all of the relevant information from the contact form,
		// not just the textarea field and predetermined subject.
		$akismet_vars = $response->get_akismet_vars();

		$spam           = '';
		$akismet_values = $plugin->prepare_for_akismet( $akismet_vars );

		// Is it spam?
		/** This filter is already documented in \Automattic\Jetpack\Forms\ContactForm\Admin */
		$is_spam = apply_filters( 'jetpack_contact_form_is_spam', false, $akismet_values );
		if ( is_wp_error( $is_spam ) ) { // WP_Error to abort
			return $is_spam; // abort
		} elseif ( $is_spam === true ) {  // TRUE to flag a spam
			$spam = '***SPAM*** ';
		}

		/**
		 * Filter whether a submitted contact form is in the comment disallowed list.
		 *
		 * @module contact-form
		 *
		 * @since 8.9.0
		 *
		 * @param bool  $result         Is the submitted feedback in the disallowed list.
		 * @param array $akismet_values Feedack values returned by the Akismet plugin.
		 */
		$in_comment_disallowed_list = apply_filters( 'jetpack_contact_form_in_comment_disallowed_list', false, $akismet_values );

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
		 * @param array $all_values Contact form fields
		 */
		$to            = (array) apply_filters( 'contact_form_to', $to, $all_values );
		$reply_to_addr = $to[0]; // get just the address part before the name part is added

		foreach ( $to as $to_key => $to_value ) {
			$to[ $to_key ] = Contact_Form_Plugin::strip_tags( $to_value );
			$to[ $to_key ] = self::add_name_to_address( $to_value );
		}

		// Get the site domain and get rid of www.
		$sitename        = wp_parse_url( site_url(), PHP_URL_HOST );
		$from_email_addr = 'wordpress@';

		if ( null !== $sitename ) {
			if ( str_starts_with( $sitename, 'www.' ) ) {
				$sitename = substr( $sitename, 4 );
			}

			$from_email_addr .= $sitename;
		}

		if ( ! empty( $comment_author_email ) ) {
			$reply_to_addr = $comment_author_email;
		}

		/*
		 * The email headers here are formatted in a format
		 * that is the most likely to be accepted by wp_mail(),
		 * without escaping.
		 * More info: https://github.com/Automattic/jetpack/pull/19727
		 */
		$headers = 'From: ' . $comment_author . ' <' . $from_email_addr . ">\r\n" .
			'Reply-To: ' . $comment_author . ' <' . $reply_to_addr . ">\r\n";

		/**
		 * Allow customizing the email headers.
		 *
		 * Warning: DO NOT add headers or header data from the form submission without proper
		 * escaping and validation, or you're liable to allow abusers to use your site to send spam.
		 *
		 * Especially DO NOT take email addresses from the form data to add as CC or BCC headers
		 * without strictly validating each address against a list of allowed addresses.
		 *
		 * @module contact-form
		 *
		 * @since 10.2.0
		 *
		 * @param string|array $headers        Email headers.
		 * @param string       $comment_author Name of the author of the submitted feedback, if provided in form.
		 * @param string       $reply_to_addr  Email of the author of the submitted feedback, if provided in form.
		 * @param string|array $to             Array of valid email addresses, or single email address, where the form is sent.
		 */
		$headers = apply_filters(
			'jetpack_contact_form_email_headers',
			$headers,
			$comment_author,
			$reply_to_addr,
			$to
		);

		$all_values['email_marketing_consent'] = $email_marketing_consent;

		$entry_values = $response->get_entry_values();

		/** This filter is already documented in \Automattic\Jetpack\Forms\ContactForm\Admin */
		$subject = apply_filters( 'contact_form_subject', $contact_form_subject, $all_values );

		/*
		 * Links to the feedback and the post.
		 */
		if ( $block_template || $block_template_part || $widget ) {
			$url = home_url( '/' );
		} else {
			$url = self::get_permalink( $this->current_post ? self::get_post_property( $this->current_post, 'ID' ) : 0 );
		}

		// translators: the time of the form submission.
		$date_time_format = _x( '%1$s \a\t %2$s', '{$date_format} \a\t {$time_format}', 'jetpack-forms' );
		$date_time_format = sprintf( $date_time_format, get_option( 'date_format' ), get_option( 'time_format' ) );
		$time             = wp_date( $date_time_format );

		// Keep a copy of the feedback as a custom post type.
		if ( $in_comment_disallowed_list ) {
			$feedback_status = 'trash';
		} elseif ( $is_spam ) {
			$feedback_status = 'spam';
		} elseif ( 'no' === $this->get_attribute( 'saveResponses' ) ) {
			$feedback_status = 'jp-temp-feedback';
		} else {
			$feedback_status = 'publish';
		}
		$response->set_status( $feedback_status );

		foreach ( (array) $akismet_values as $av_key => $av_value ) {
			$akismet_values[ $av_key ] = Contact_Form_Plugin::strip_tags( $av_value );
		}

		foreach ( $all_values as $all_key => $all_value ) {
			$all_values[ $all_key ] = Contact_Form_Plugin::strip_tags( $all_value );
		}

		foreach ( $extra_values as $ev_key => $ev_value ) {
			$extra_values[ $ev_key ] = Contact_Form_Plugin::strip_tags( $ev_value );
		}

		/*
		 * We need to make sure that the post author is always zero for contact
		 * form submissions.  This prevents export/import from trying to create
		 * new users based on form submissions from people who were logged in
		 * at the time.
		 *
		 * Unfortunately wp_insert_post() tries very hard to make sure the post
		 * author gets the currently logged in user id.  That is how we ended up
		 * with this work around.
		 */
		add_filter( 'wp_insert_post_data', array( $plugin, 'insert_feedback_filter' ), 10, 2 );

		/**
		 * Allows site owners to not include IP addresses in the saved form response.
		 *
		 * The IP address is still used as part of spam filtering, if enabled, but it is removed when this filter
		 * is set to true before saving to the database and e-mailing the form recipients.

		 * @module contact-form
		 *
		 * @param bool $remove_ip_address Should the IP address be removed. Default false.
		 * @param string $ip_address IP address of the form submission.
		 *
		 * @since 0.33.0
		 */
		if ( apply_filters( 'jetpack_contact_form_forget_ip_address', false, $comment_author_ip ) ) {
			$comment_author_ip = null;
		}

		$post_id       = 0;
		$feedback_post = $response->save();
		if ( $feedback_post instanceof WP_Post ) {
			$post_id = $feedback_post->ID;
		}

		// once insert has finished we don't need this filter any more
		remove_filter( 'wp_insert_post_data', array( $plugin, 'insert_feedback_filter' ), 10 );

		update_post_meta( $post_id, '_feedback_extra_fields', $this->addslashes_deep( $extra_values ) );

		if ( 'publish' === $feedback_status ) {
			Contact_Form_Plugin::recalculate_unread_count();
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
		 * @param array   $this->fields An array containg the form's Contact_Form_Field objects.
		 * @param boolean $is_spam Whether the form submission has been identified as spam.
		 * @param array   $entry_values The feedback entry values.
		 */
		do_action( 'grunion_after_feedback_post_inserted', $post_id, $this->fields, $is_spam, $entry_values );

		/**
		 * Filter the title used in the response email.
		 *
		 * @module contact-form
		 *
		 * @since 0.18.0
		 *
		 * @param string the title of the email
		 */
		$title   = (string) apply_filters( 'jetpack_forms_response_email_title', '' );
		$message = self::get_compiled_form_for_email( $post_id, $this );

		if ( is_user_logged_in() ) {
			$sent_by_text = sprintf(
				// translators: the name of the site.
				'<br />' . esc_html__( 'Sent by a verified %s user.', 'jetpack-forms' ) . '<br />',
				isset( $GLOBALS['current_site']->site_name ) && $GLOBALS['current_site']->site_name ? $GLOBALS['current_site']->site_name : '"' . get_option( 'blogname' ) . '"'
			);
		} else {
			$sent_by_text = '<br />' . esc_html__( 'Sent by an unverified visitor to your site.', 'jetpack-forms' ) . '<br />';
		}

		$footer_time = sprintf(
			/* translators: Placeholder is the date and time when a form was submitted. */
			esc_html__( 'Time: %1$s', 'jetpack-forms' ),
			$time
		);
		$footer_ip = null;
		if ( $comment_author_ip ) {
			$comment_author_ip_with_flag = $comment_author_ip . ( $response->get_country_flag() ? ' ' . $response->get_country_flag() : '' );
			$footer_ip                   = sprintf(
				/* translators: Placeholder is the IP address of the person who submitted a form. */
				esc_html__( 'IP Address: %1$s', 'jetpack-forms' ),
				$comment_author_ip_with_flag
			) . '<br />';
		}

		$footer_url = sprintf(
			/* translators: Placeholder is the URL of the page where a form was submitted. */
			__( 'Source URL: %1$s', 'jetpack-forms' ),
			esc_url( $url )
		);

		// Get the status of the feedback
		$status = $is_spam ? 'spam' : 'inbox';

		// Build the dashboard URL with the status and the feedback's post id if we have a post id
		$dashboard_url           = '';
		$footer_mark_as_spam_url = '';
		if ( $feedback_status !== 'jp-temp-feedback' ) {
			$dashboard_url           = Forms_Dashboard::get_forms_admin_url( $status ) . '&r=' . $post_id;
			$mark_as_spam_url        = $dashboard_url . '&mark_as_spam';
			$footer_mark_as_spam_url = sprintf(
				'<a href="%1$s">%2$s</a>',
				esc_url( $mark_as_spam_url ),
				__( 'Mark as spam', 'jetpack-forms' )
			);
		}

		$footer = implode(
			'',
			/**
			 * Filter the footer used in the response email.
			 *
			 * @module contact-form
			 *
			 * @since 0.18.0
			 *
			 * @param array the lines of the footer, one line per array element.
			 */
			apply_filters(
				'jetpack_forms_response_email_footer',
				array_filter(
					array(
						'<span style="font-size: 12px">',
						$footer_time . '<br />',
						$footer_ip ? $footer_ip . '<br />' : null,
						$footer_url . '<br /><br />',
						$footer_mark_as_spam_url ? $footer_mark_as_spam_url . '<br />' : null,
						$sent_by_text,
						'</span>',
					)
				)
			)
		);

		// Build the actions url if we have a dashboard url
		$actions = '';
		if ( $dashboard_url ) {
			$actions = sprintf(
				'<table class="button_block" border="0" cellpadding="0" cellspacing="0" role="presentation">
					<tr>
						<td class="pad" align="center">
							<a rel="noopener" target="_blank" href="%1$s" data-tracks-link-desc="">
								<!--[if mso]>
								<i style="mso-text-raise: 30pt;">&nbsp;</i>
								<![endif]-->
								<span>%2$s</span>
								<!--[if mso]>
								<i>&nbsp;</i>
								<![endif]-->
							</a>
						</td>
					</tr>
				</table>',
				esc_url( $dashboard_url ),
				__( 'View in dashboard', 'jetpack-forms' )
			);
		}

		/**
		 * Filters the message sent via email after a successful form submission.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 *
		 * @param string $message Feedback email message.
		 * @param string $message Feedback email message as an array
		 */
		$message = apply_filters( 'contact_form_message', implode( '', $message ), $message );

		// This is called after `contact_form_message`, in order to preserve back-compat
		$message = self::wrap_message_in_html_tags( $title, $message, $footer, $actions );

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

		// schedule deletes of old temp feedbacks
		if ( ! wp_next_scheduled( 'grunion_scheduled_delete_temp' ) ) {
			wp_schedule_event( time() + 250, 'daily', 'grunion_scheduled_delete_temp' );
		}

		/**
		 * Filter to choose whether an email should be sent after each successful contact form submission.
		 * This filter takes precedence over the emailNotifications attribute.
		 *
		 * @module contact-form
		 *
		 * @since 2.6.0
		 *
		 * @param bool|null $should_send Should an email be sent after a form submission.
		 *                              - true: Send email regardless of emailNotifications setting
		 *                              - false: Don't send email regardless of emailNotifications setting
		 *                              - null: Use emailNotifications attribute to determine (default behavior)
		 * @param int $post_id Post ID.
		 */
		$should_send_email = apply_filters( 'grunion_should_send_email', null, $post_id );

		// Determine if email should be sent based on filter precedence
		if ( $should_send_email === true ) {
			// Filter explicitly says to send email
			$send_email = true;
		} elseif ( $should_send_email === false ) {
			// Filter explicitly says not to send email
			$send_email = false;
		} else {
			// Filter is null (default), use emailNotifications attribute
			$send_email = ( $this->get_attribute( 'emailNotifications' ) !== 'no' );
		}

		if (
			$is_spam !== true &&
			$send_email
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
			apply_filters( 'grunion_still_email_spam', false )
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

		$refresh_args = array(
			'contact-form-id'   => $id,
			'contact-form-sent' => $post_id,
			'contact-form-hash' => $this->hash,
			'_wpnonce'          => wp_create_nonce( "contact-form-sent-{$post_id}" ), // wp_nonce_url HTMLencodes :( .
		);

		// If the request accepts JSON, return a JSON response instead of redirecting
		$accepts_json = isset( $_SERVER['HTTP_ACCEPT'] ) && false !== strpos( strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_ACCEPT'] ) ) ), 'application/json' );

		if ( $this->is_response_without_reload_enabled && $accepts_json ) {
			$data = array();
			if ( $response instanceof Feedback ) {
				$data = $response->get_compiled_fields( 'ajax', 'label|value' );
			}
			wp_send_json(
				array(
					'success'     => true,
					'data'        => $data,
					'refreshArgs' => $refresh_args,
				)
			);
		}

		if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
			return self::success_message( $post_id, $this );
		}

		$redirect = $this->get_redirect_url( $refresh_args, $id, $post_id );

		// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- We intentially allow external redirects here.
		wp_redirect( $redirect );
		exit( 0 );
	}

	/**
	 * Check if the contact form has a custom redirect.
	 *
	 * @return bool True if the contact form has a custom redirect, false otherwise.
	 */
	public function has_custom_redirect() {
		$confirmation_type = $this->get_confirmation_type();

		if ( ! empty( $this->get_attribute( 'customThankyouRedirect' ) ) && 'redirect' === $confirmation_type ) {
			return true;
		}
		/**
		 * Filter to check if the contact form has a redirect filter.
		 *
		 * @module contact-form
		 *
		 * @since 1.9.0
		 *
		 * @param bool $has_redirect True if the contact form has a redirect filter, false otherwise.
		 */
		return (bool) has_filter( 'grunion_contact_form_redirect_url' );
	}

	/**
	 * Get the URL where the reader is redirected after submitting a form.
	 *
	 * @param array $refresh_args The arguments to be added to the redirect URL.
	 * @param int   $id           Contact Form ID.
	 * @param int   $post_id      Post ID.
	 *
	 * @return string The redirect URL.
	 */
	public function get_redirect_url( $refresh_args, $id, $post_id ) {
		$confirmation_type = $this->get_confirmation_type();
		$redirect          = '';
		$custom_redirect   = false;

		if ( 'redirect' === $confirmation_type ) {
			$custom_redirect = true;
			$redirect        = esc_url_raw( $this->get_attribute( 'customThankyouRedirect' ) );
		}

		if ( ! $redirect ) {
			$custom_redirect = false;
			$redirect        = wp_get_referer();
		}

		if ( ! $redirect ) { // wp_get_referer() returns false if the referer is the same as the current page.
			$custom_redirect = false;
			$redirect        = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		}

		if ( ! $custom_redirect ) {
			$redirect = add_query_arg(
				urlencode_deep( $refresh_args ),
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
		return apply_filters( 'grunion_contact_form_redirect_url', $redirect, $id, $post_id );
	}

	/**
	 * Get the permalink for the post ID that include the page query parameter if it was set.
	 *
	 * @param int $post_id The post ID.
	 *
	 * return string The permalink for the post ID.
	 */
	public static function get_permalink( $post_id ) {
		$url  = get_permalink( $post_id );
		$page = isset( $_POST['page'] ) ? absint( wp_unslash( $_POST['page'] ) ) : null; // phpcs:Ignore WordPress.Security.NonceVerification.Missing
		if ( $page ) {
			return add_query_arg( 'page', $page, $url );
		}
		return $url;
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
	 * instead of `Foo Bar <foo@bar.org>`.
	 *
	 * @param string $address - the email address.
	 *
	 * @return string
	 */
	public function add_name_to_address( $address ) {
		// If it's just the address, without a display name
		if ( is_email( $address ) ) {
			$address_parts = explode( '@', $address );

			/*
			 * The email address format here is formatted in a format
			 * that is the most likely to be accepted by wp_mail(),
			 * without escaping.
			 * More info: https://github.com/Automattic/jetpack/pull/19727
			 */
			$address = sprintf( '%s <%s>', $address_parts[0], $address );
		}

		return $address;
	}

	/**
	 * Get the content type that should be assigned to outbound emails
	 *
	 * @return string
	 */
	public static function get_mail_content_type() {
		return 'text/html';
	}

	/**
	 * Wrap a message body with the appropriate in HTML tags
	 *
	 * This helps to ensure correct parsing by clients, and also helps avoid triggering spam filtering rules
	 *
	 * @param string $title - title of the email.
	 * @param string $body - the message body.
	 * @param string $footer - the footer containing meta information.
	 * @param string $actions - HTML for actions displayed in the email.
	 *
	 * @return string
	 */
	public static function wrap_message_in_html_tags( $title, $body, $footer, $actions = '' ) {
		// Don't do anything if the message was already wrapped in HTML tags
		// That could have be done by a plugin via filters
		if ( str_contains( $body, '<html' ) ) {
			return $body;
		}

		$template = '';
		$style    = '';

		// The hash is just used to anonymize the admin email and have a unique identifier for the event.
		// The secret key used could have been a random string, but it's better to use the version number to make it easier to track.
		$event = new Jetpack_Tracks_Event(
			(object) array(
				'_en' => 'jetpack_forms_email_open',
				'_ui' => hash_hmac( 'md5', get_option( 'admin_email' ), JETPACK__VERSION ),
				'_ut' => 'anon',
			)
		);

		$tracking_pixel = '<img src="' . $event->build_pixel_url() . '" alt="" width="1" height="1" />';

		/**
		 * Filter the filename of the template HTML surrounding the response email. The PHP file will return the template in a variable called $template.
		 *
		 * @module contact-form
		 *
		 * @since 0.18.0
		 *
		 * @param string the filename of the HTML template used for response emails to the form owner.
		 */
		require apply_filters( 'jetpack_forms_response_email_template', __DIR__ . '/templates/email-response.php' );
		$html_message = sprintf(
			// The tabs are just here so that the raw code is correctly formatted for developers
			// They're removed so that they don't affect the final message sent to users
			str_replace(
				"\t",
				'',
				$template
			),
			( $title !== '' ? '<h1>' . $title . '</h1>' : '' ),
			$body,
			'',
			'',
			$footer,
			$style,
			$tracking_pixel,
			$actions
		);

		return $html_message;
	}

	/**
	 * Add a plain-text alternative part to an outbound email
	 *
	 * This makes the message more accessible to mail clients that aren't HTML-aware, and decreases the likelihood
	 * that the message will be flagged as spam.
	 *
	 * @param PHPMailer $phpmailer - the phpmailer.
	 */
	public static function add_plain_text_alternative( $phpmailer ) {
		// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		// Add an extra break so that the extra space above the <p> is preserved after the <p> is stripped out
		$alt_body = str_replace( '<p>', '<p><br />', $phpmailer->Body );

		// Convert <br> to \n breaks, to preserve the space between lines that we want to keep
		$alt_body = str_replace( array( '<br>', '<br />' ), "\n", $alt_body );

		// Convert <div> to \n breaks, to preserve space between lines for new email formatting.
		$alt_body = str_replace( '<div', "\n<div", $alt_body );

		// Convert <hr> to an plain-text equivalent, to preserve the integrity of the message
		$alt_body = str_replace( array( '<hr>', '<hr />' ), "----\n", $alt_body );

		// Trim the plain text message to remove the \n breaks that were after <doctype>, <html>, and <body>
		$phpmailer->AltBody = trim( wp_strip_all_tags( $alt_body ) );
		// phpcs:enable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

	/**
	 * Add deepslashes.
	 *
	 * @param array $value - the value.
	 * @return array The value, with slashes added.
	 */
	public function addslashes_deep( $value ) {
		if ( is_array( $value ) ) {
			return array_map( array( $this, 'addslashes_deep' ), $value );
		} elseif ( is_object( $value ) ) {
			$vars = get_object_vars( $value );
			foreach ( $vars as $key => $data ) {
				$value->{$key} = $this->addslashes_deep( $data );
			}
			return (array) $value;
		}

		return addslashes( $value );
	}

	/**
	 * Rough implementation of Gutenberg's align-attribute-to-css-class map.
	 * Only allowin "wide" and "full" as "center", "left" and "right" don't
	 * make much sense for the form.
	 *
	 * @param array $attributes Block attributes.
	 * @return string The CSS alignment class: alignfull | alignwide.
	 */
	public static function get_block_alignment_class( $attributes = array() ) {
		$align_to_class_map = array(
			'wide' => 'alignwide',
			'full' => 'alignfull',
		);
		if ( empty( $attributes['align'] ) || ! array_key_exists( $attributes['align'], $align_to_class_map ) ) {
			return '';
		}
		return $align_to_class_map[ $attributes['align'] ];
	}

	/**
	 * Process a file upload field.
	 *
	 * @param string $field_id The field ID.
	 * @param object $field The field object.
	 *
	 * @return array A structured array with field_id and files array.
	 */
	public function process_file_upload_field( $field_id, $field ) {
		$field_id = sanitize_key( $field_id );

		$raw_data = array();
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( isset( $_POST[ $field_id ] ) ) {

			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Missing
			$raw_post_data = wp_unslash( $_POST[ $field_id ] );
			if ( is_array( $raw_post_data ) ) {
				$raw_data = array_map( 'sanitize_text_field', $raw_post_data );
			}
		}

		$file_data_array = is_array( $raw_data )
			? array_map(
				function ( $json_str ) {
					$decoded = json_decode( $json_str, true );
					return array(
						'file_id' => isset( $decoded['file_id'] ) ? sanitize_text_field( $decoded['file_id'] ) : '',
						'name'    => isset( $decoded['name'] ) ? sanitize_text_field( $decoded['name'] ) : '',
						'size'    => isset( $decoded['size'] ) ? absint( $decoded['size'] ) : 0,
						'type'    => isset( $decoded['type'] ) ? sanitize_text_field( $decoded['type'] ) : '',
					);
				},
				$raw_data
			) : array();

		if ( empty( $file_data_array ) ) {
			$field->add_error( __( 'Failed to upload file.', 'jetpack-forms' ) );
			return array(
				'field_id' => $field_id,
				'files'    => array(),
			);
		}

		return array(
			'field_id' => $field_id,
			'files'    => $file_data_array,
		);
	}

	/**
	 * Ensures a field label ends with a colon, unless it ends with a question mark.
	 *
	 * @param string $label The field label.
	 * @return string The formatted label.
	 */
	private static function maybe_add_colon_to_label( $label ) {
		$formatted_label = $label ? $label : '';
		// Special case for the Terms consent field block which a period after the label.
		$formatted_label = str_ends_with( $formatted_label, '?' ) ? $formatted_label : rtrim( $formatted_label, ':.' ) . ':';

		return $formatted_label;
	}

	/**
	 * Ensures a value is formatted as a string, taking into account file upload fields.
	 *
	 * @param mixed $value The value to transform.
	 * @return mixed The transformed value.
	 */
	private static function maybe_transform_value( $value ) {
		if ( is_array( $value ) && isset( $value['type'] ) && $value['type'] === 'image-select' ) {
			return implode(
				', ',
				array_map(
					function ( $choice ) {
						$value = $choice['perceived'];

						if ( $choice['showLabels'] && ! empty( $choice['label'] ) ) {
							$value .= ' - ' . $choice['label'];
						}

						return $value;
					},
					$value['choices']
				)
			);
		}

		// For file upload fields, we want to show the file name and size
		if ( is_array( $value ) && isset( $value['name'] ) && isset( $value['size'] ) ) {
			$file_name = $value['name'];
			$file_size = $value['size'];
			return empty( $file_size ) ? $file_name : $file_name . ' (' . $file_size . ')';
		}

		return $value;
	}

	/**
	 * Helper method to get the images from an image select field.
	 *
	 * @param array $value The value to get the images from.
	 * @return array The images.
	 */
	private static function get_images( $value ) {
		if ( is_array( $value ) && isset( $value['type'] ) && $value['type'] === 'image-select' ) {
			return array_map(
				function ( $choice ) {
					return $choice['image']['src'] ?? '';
				},
				$value['choices']
			);
		}

		return null;
	}

	/**
	 * Helper method to format a raw label string for display, including kses sanitization.
	 *
	 * @param string|null $raw_label The raw label input.
	 * @return string The formatted and kses'd label string, or an empty string if raw_label is empty.
	 */
	private static function escape_and_sanitize_field_label( $raw_label ) {
		if ( empty( $raw_label ) ) {
			return ''; // kses the empty string
		}
		return wp_kses( (string) $raw_label, array() );
	}

	/**
	 * Enforce required block supports UIs for Classic themes.
	 *
	 * @param \WP_Theme_JSON_Data $theme_json_data Theme JSON data object.
	 *
	 * @return \WP_Theme_JSON_Data Updated theme JSON settings.
	 */
	public static function add_theme_json_data_for_classic_themes( $theme_json_data ) {
		if ( wp_is_block_theme() ) {
			return $theme_json_data;
		}

		$data = $theme_json_data->get_data();

		if ( ! isset( $data['settings']['blocks'] ) ) {
			$data['settings']['blocks'] = array();
		}

		$data['settings']['blocks']['jetpack/input'] = array(
			'color'      => array(
				'text'       => true,
				'background' => false,
			),
			'border'     => array(
				'color'  => true,
				'radius' => true,
				'style'  => true,
				'width'  => true,
			),
			'typography' => array(
				'fontFamily'     => true,
				'fontSize'       => true,
				'fontStyle'      => true,
				'fontWeight'     => true,
				'letterSpacing'  => true,
				'lineHeight'     => true,
				'textDecoration' => true,
				'textTransform'  => true,
			),
		);

		// maybe need to add support for jetpack/phone-input

		$data['settings']['blocks']['jetpack/options'] = array(
			'color'  => array(
				'text'       => true,
				'background' => true,
			),
			'border' => array(
				'color'  => true,
				'radius' => true,
				'style'  => true,
				'width'  => true,
			),
		);

		$shared_settings                              = array(
			'color'      => array(
				'text'       => true,
				'background' => false,
			),
			'typography' => array(
				'fontFamily'     => true,
				'fontSize'       => true,
				'fontStyle'      => true,
				'fontWeight'     => true,
				'letterSpacing'  => true,
				'lineHeight'     => true,
				'textDecoration' => true,
				'textTransform'  => true,
			),
		);
		$data['settings']['blocks']['jetpack/label']  = $shared_settings;
		$data['settings']['blocks']['jetpack/option'] = $shared_settings;

		$theme_json_class = get_class( $theme_json_data );
		return new $theme_json_class( $data, 'default' );
	}

	/**
	 * Validate the contact form fields.
	 *
	 * This method checks each field for errors and ensures that at least one field has a value.
	 * If no fields have values and there are no errors, it adds an error indicating that the form is empty.
	 */
	public function validate() {
		$has_value = false;
		// Validate the form fields before processing the form.
		foreach ( $this->fields as $field ) {
			$field->validate();
			if ( ! $has_value && $field->has_value() ) {
				$has_value = true;
			}
		}

		if ( ! $has_value && ! $this->has_errors() ) {
			$this->add_error( 'empty', __( 'Please fill out at least one field.', 'jetpack-forms' ) );
		}
	}

	/**
	 * Reset the static errors for the contact form.
	 *
	 * @param string $id The ID of the contact form to reset errors for. If null, resets all static errors.
	 *
	 * This method is used to clear the static errors stored in the class.
	 */
	public static function reset_errors( $id = null ) {
		if ( $id && isset( self::$static_errors[ $id ] ) ) {
			unset( self::$static_errors[ $id ] );
			return;
		}
		self::$static_errors = array();
	}

	/**
	 * Add an error to the contact form.
	 *
	 * @param string $error_code    The error code.
	 * @param string $error_message The error message.
	 */
	public function add_error( $error_code, $error_message ) {
		$id = $this->get_attribute( 'id' );
		if ( ! isset( self::$static_errors[ $id ] ) ) {
			self::$static_errors[ $id ] = Form_Submission_Error::validation_error( $error_code, $error_message );
		} else {
			// If we already have errors, add this error to the existing Form_Submission_Error
			self::$static_errors[ $id ]->add( $error_code, $error_message );
		}
		$this->errors = self::$static_errors[ $id ];
	}
	/**
	 * Check if the contact form has errors.
	 *
	 * @return bool True if the contact form has errors, false otherwise.
	 */
	public function has_errors() {
		$id = $this->get_attribute( 'id' );
		if ( ! isset( self::$static_errors[ $id ] ) ) {
			return false;
		}
		return is_wp_error( self::$static_errors[ $id ] ) && ! empty( self::$static_errors[ $id ]->get_error_codes() );
	}

	/**
	 * Get the error messages of the contact form.
	 *
	 * @return array The errors of the contact form.
	 */
	public function get_error_messages() {
		if ( ! $this->has_errors() ) {
			return array();
		}
		$id = $this->get_attribute( 'id' );
		return self::$static_errors[ $id ]->get_error_messages();
	}

	/**
	 * Get the confirmation type of the contact form from the deprecated customThankyou attribute.
	 *
	 * @return string The confirmation type of the contact form.
	 */
	public function get_confirmation_type() {
		$confirmation_type = $this->get_attribute( 'confirmationType' );

		if ( '' === $confirmation_type ) {
			$confirmation_type = 'redirect' === $this->get_attribute( 'customThankyou' ) ? 'redirect' : 'text';
		}

		return $confirmation_type;
	}

	/**
	 * Get the disable summary of the contact form from the deprecated customThankyou attribute.
	 *
	 * @return string The disable summary of the contact form.
	 */
	public function get_disable_summary() {
		$disable_summary = $this->get_attribute( 'disableSummary' );
		$custom_thankyou = $this->get_attribute( 'customThankyou' );

		if ( '' === $disable_summary ) {
			$disable_summary = 'noSummary' === $custom_thankyou || 'message' === $custom_thankyou;
		}

		return $disable_summary;
	}
}

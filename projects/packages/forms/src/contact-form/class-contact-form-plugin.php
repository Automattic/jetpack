<?php
/**
 * Contact_Form_Plugin class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block;
use Automattic\Jetpack\Forms\Jetpack_Forms;
use Automattic\Jetpack\Forms\Service\MailPoet_Integration;
use Automattic\Jetpack\Forms\Service\Post_To_Url;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;
use Jetpack_Options;
use WP_Block;
use WP_Block_Patterns_Registry;
use WP_Block_Type_Registry;
use WP_Error;

/**
 * Sets up various actions, filters, post types, post statuses, shortcodes.
 */
class Contact_Form_Plugin {

	/**
	 *
	 * The Widget ID of the widget currently being processed.  Used to build the unique contact-form ID for forms embedded in widgets.
	 *
	 * @var string
	 */
	public $current_widget_id;

	/**
	 * The Sidebar ID of the sidebar currently being processed.  Used to build the unique contact-form ID for forms embedded in sidebars.
	 *
	 * @var string
	 */
	public $current_sidebar_id;

	/**
	 * If the contact form field is being used.
	 *
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
	 * The number of steps in the form.
	 *
	 * This is used to determine how many steps are in the form when using the multi-step feature.
	 * It is incremented each time a new step is added.
	 *
	 * @var int
	 */
	public static $step_count = 0;

	/*
	 * Field keys that might be present in the entry json but we don't want to show to the admin
	 * since they not something that the visitor entered into the form.
	 *
	 * @var array
	 */
	const NON_PRINTABLE_FIELDS = array(
		'entry_title'             => '',
		'email_marketing_consent' => '',
		'entry_permalink'         => '',
		'entry_page'              => '',
		'feedback_id'             => '',
	);

	/**
	 * Initializing function.
	 */
	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new Contact_Form_Plugin();

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

		$feedback_ids = $wpdb->get_col( "SELECT p.ID FROM {$wpdb->posts} as p INNER JOIN {$wpdb->postmeta} as m on m.post_id = p.ID WHERE p.post_type = 'feedback' AND m.meta_key = '_feedback_akismet_values' AND DATE_SUB(NOW(), INTERVAL 15 DAY) > p.post_date_gmt LIMIT 10000" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

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
	 * @param mixed $data_with_tags - data we're stripping HTML tags from.
	 * @return mixed
	 */
	public static function strip_tags( $data_with_tags ) {
		$data_without_tags = array();
		if ( is_array( $data_with_tags ) ) {
			foreach ( $data_with_tags as $index => $value ) {
				if ( is_array( $value ) ) {
					$data_without_tags[ $index ] = self::strip_tags( $value );
					continue;
				}

				$index = sanitize_text_field( (string) $index );
				$value = wp_kses_post( (string) $value );
				$value = str_replace( '&amp;', '&', $value ); // undo damage done by wp_kses_normalize_entities()

				$data_without_tags[ $index ] = $value;
			}
		} else {
			$data_without_tags = wp_kses_post( (string) $data_with_tags );
			$data_without_tags = str_replace( '&amp;', '&', $data_without_tags ); // undo damage done by wp_kses_normalize_entities()
		}

		return $data_without_tags;
	}

	/**
	 * Class uses singleton pattern; use Contact_Form_Plugin::init() to initialize.
	 */
	protected function __construct() {
		$this->add_shortcode();

		// While generating the output of a text widget with a contact-form shortcode, we need to know its widget ID.
		add_action( 'dynamic_sidebar', array( $this, 'track_current_widget' ) );
		add_action( 'dynamic_sidebar_before', array( $this, 'track_current_widget_before' ) );
		add_action( 'dynamic_sidebar_after', array( $this, 'track_current_widget_after' ) );

		// If Text Widgets don't get shortcode processed, hack ours into place.
		if (
			version_compare( get_bloginfo( 'version' ), '4.9-z', '<=' )
			&& ! has_filter( 'widget_text', 'do_shortcode' )
		) {
			add_filter( 'widget_text', array( $this, 'widget_shortcode_hack' ), 5 );
		}

		add_filter( 'jetpack_contact_form_is_spam', array( $this, 'is_spam_blocklist' ), 10, 2 );
		add_filter( 'jetpack_contact_form_in_comment_disallowed_list', array( $this, 'is_in_disallowed_list' ), 10, 2 );
		// Akismet to the rescue
		if ( defined( 'AKISMET_VERSION' ) || function_exists( 'akismet_http_post' ) ) {
			add_filter( 'jetpack_contact_form_is_spam', array( $this, 'is_spam_akismet' ), 10, 2 );
			add_action( 'contact_form_akismet', array( $this, 'akismet_submit' ), 10, 2 );
		}

		add_action( 'loop_start', array( '\Automattic\Jetpack\Forms\ContactForm\Contact_Form', 'style_on' ) );
		add_action( 'pre_amp_render_post', array( '\Automattic\Jetpack\Forms\ContactForm\Contact_Form', 'style_on' ) );

		add_action( 'wp_ajax_grunion-contact-form', array( $this, 'ajax_request' ) );
		add_action( 'wp_ajax_nopriv_grunion-contact-form', array( $this, 'ajax_request' ) );

		// GDPR: personal data exporter & eraser.
		add_filter( 'wp_privacy_personal_data_exporters', array( $this, 'register_personal_data_exporter' ) );
		add_filter( 'wp_privacy_personal_data_erasers', array( $this, 'register_personal_data_eraser' ) );

		// Export to CSV feature
		if ( is_admin() ) {
			add_action( 'wp_ajax_feedback_export', array( $this, 'download_feedback_as_csv' ) );
			add_action( 'wp_ajax_create_new_form', array( $this, 'create_new_form' ) );
		}
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'current_screen', array( $this, 'unread_count' ) );
		add_action( 'current_screen', array( $this, 'redirect_edit_feedback_to_jetpack_forms' ) );

		add_filter( 'use_block_editor_for_post_type', array( $this, 'use_block_editor_for_post_type' ), 10, 2 );

		// custom post type we'll use to keep copies of the feedback items
		register_post_type(
			'feedback',
			array(
				'labels'                => array(
					'name'               => __( 'Form Responses', 'jetpack-forms' ),
					'singular_name'      => __( 'Form Responses', 'jetpack-forms' ),
					'search_items'       => __( 'Search Responses', 'jetpack-forms' ),
					'not_found'          => __( 'No responses found', 'jetpack-forms' ),
					'not_found_in_trash' => __( 'No responses found', 'jetpack-forms' ),
				),
				'menu_icon'             => 'dashicons-feedback',
				// when the legacy menu item is retired, we don't want to show the default post type listing
				'show_ui'               => false,
				'show_in_menu'          => false,
				'show_in_admin_bar'     => false,
				'public'                => false,
				'rewrite'               => false,
				'query_var'             => false,
				'capability_type'       => 'page',
				'show_in_rest'          => true,
				'rest_controller_class' => '\Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint',
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
		add_filter( 'wp_untrash_post_status', array( $this, 'untrash_feedback_status_handler' ), 10, 3 );

		// Add to REST API post type allowed list.
		add_filter( 'rest_api_allowed_post_types', array( $this, 'allow_feedback_rest_api_type' ) );

		// Add "spam" as a post status
		register_post_status(
			'spam',
			array(
				'label'                  => 'Spam',
				'public'                 => false,
				'exclude_from_search'    => true,
				'show_in_admin_all_list' => false,
				// translators: The spam count.
				'label_count'            => _n_noop( 'Spam <span class="count">(%s)</span>', 'Spam <span class="count">(%s)</span>', 'jetpack-forms' ),
				'protected'              => true,
				'_builtin'               => false,
			)
		);

		// Add "jp-temp-feedback" as a post status for temporary storage when saveResponses is 'no'.
		// We want these responses skip the inbox but we still need to keep them in the database so that
		// filters and integrations continue to work.
		register_post_status(
			'jp-temp-feedback',
			array(
				'label'                  => 'Temporary Feedback Status',
				'public'                 => false,
				'internal'               => true,
				'exclude_from_search'    => true,
				'show_in_admin_all_list' => false,
				'protected'              => true,
				'_builtin'               => false,
			)
		);

		// POST handler
		if (
			isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) )
			&&
			isset( $_POST['action'] ) && 'grunion-contact-form' === $_POST['action'] // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verification should happen when hook fires.
			&&
			isset( $_POST['contact-form-id'] ) // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes
		) {
			add_action( 'template_redirect', array( $this, 'process_form_submission' ) );
		}

		/*
		 * Can be dequeued by placing the following in wp-content/themes/yourtheme/functions.php
		 *
		 *  function remove_grunion_style() {
		 *      wp_deregister_style('grunion.css');
		 *  }
		 *  add_action('wp_print_styles', 'remove_grunion_style');
		 */
		wp_register_style( 'grunion.css', Jetpack_Forms::plugin_url() . '../dist/contact-form/css/grunion.css', array(), \JETPACK__VERSION );
		wp_style_add_data( 'grunion.css', 'rtl', 'replace' );

		add_filter( 'js_do_concat', array( __CLASS__, 'disable_forms_view_script_concat' ), 10, 3 );

		if ( defined( 'JETPACK__PLUGIN_DIR' ) ) {
			// Register Unauthenticated file download hooks.
			require_once JETPACK__PLUGIN_DIR . 'unauth-file-upload.php';
		}

		self::register_contact_form_blocks();

		// Register MailPoet integration hook after the class is loaded.
		if ( Jetpack_Forms::is_mailpoet_enabled() ) {
			add_action(
				'grunion_after_feedback_post_inserted',
				array( MailPoet_Integration::class, 'handle_mailpoet_integration' ),
				15,
				4
			);
		}
	}

	/**
	 * Prevent 'jp-forms-view' script from being concatenated.
	 *
	 * @param array  $do_concat - the concatenation flag.
	 * @param string $handle - script name.
	 */
	public static function disable_forms_view_script_concat( $do_concat, $handle ) {
		if ( 'jp-forms-view' === $handle ) {
			$do_concat = false;
		}
		return $do_concat;
	}

	/**
	 * Register the contact form block.
	 */
	private static function register_contact_form_blocks() {
		// Field render methods.
		Contact_Form_Block::register_child_blocks();
	}

	/**
	 * Generate block support CSS classes and inline styles for block supports
	 * via the style engine.
	 *
	 * @param string $block_name - the block name.
	 * @param array  $attrs      - the block attributes.
	 * @param array  $options    - the types of support to apply.
	 *
	 * @return array
	 */
	private static function get_block_support_classes_and_styles( $block_name, $attrs, $options = array() ) {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );

		if ( ! $block_type ) {
			return array();
		}

		$default_options = array( 'color', 'typography', 'border', 'custom', 'spacing' );
		$enabled_options = empty( $options ) ? $default_options : $options;

		// Leverage the individual core block support functions to generate classes and styles.
		$color_styles      = in_array( 'color', $enabled_options, true ) ? \wp_apply_colors_support( $block_type, $attrs ) : array();
		$typography_styles = in_array( 'typography', $enabled_options, true ) ? \wp_apply_typography_support( $block_type, $attrs ) : array();
		$border_styles     = in_array( 'border', $enabled_options, true ) ? \wp_apply_border_support( $block_type, $attrs ) : array();
		$custom_classname  = in_array( 'custom', $enabled_options, true ) ? \wp_apply_custom_classname_support( $block_type, $attrs ) : array();
		$spacing_styles    = in_array( 'spacing', $enabled_options, true ) ? \wp_apply_spacing_support( $block_type, $attrs ) : array();

		// Merge all the block support classes and styles.
		$classes = array_filter(
			array(
				$color_styles['class'] ?? '',
				$typography_styles['class'] ?? '',
				$border_styles['class'] ?? '',
				$custom_classname['class'] ?? '',
				$spacing_styles['class'] ?? '',
			),
			'strlen'
		);

		$styles = array_filter(
			array(
				$color_styles['style'] ?? '',
				$typography_styles['style'] ?? '',
				$border_styles['style'] ?? '',
				$spacing_styles['style'] ?? '',
			),
			'strlen'
		);

		$merged_styles = array();

		if ( ! empty( $classes ) ) {
			$merged_styles['class'] = implode( ' ', $classes );
		}
		if ( ! empty( $styles ) ) {
			$merged_styles['style'] = implode( ' ', $styles );
		}

		return $merged_styles;
	}

	/**
	 * Returns an array containing the field classes (including -wrap classes), the remaining classes without block style classes.
	 * The wrap classes are used for the wrapper div around the field.
	 *
	 * @param string $classname The class name.
	 *
	 * @return array {
	 *     @type string $fieldwrapperclasses         Classes that should be added to the field wrapper.
	 *     @type string $classes_without_block_style The remaining classes without block style classes, intended for internal field controls.
	 * }
	 */
	private static function get_block_style_classes( $classname = '' ) {
		if ( ! $classname ) {
			return array(
				'fieldwrapperclasses' => '',
				'classes'             => '',
			);
		}

		$field_wrapper_classes       = '';
		$classes_without_block_style = '';

		preg_match_all( '/is-style-([^\s]+)/i', $classname, $matches );

		$block_style_classes = empty( $matches[0] ) ? '' : implode( ' ', $matches[0] );

		if ( ! empty( $block_style_classes ) ) {
			$wrap_classes          = ! empty( $matches[0] ) ? ' ' . implode( '-wrap ', array_filter( $matches[0] ) ) . '-wrap' : '';
			$field_wrapper_classes = " $block_style_classes $wrap_classes";
		}

		// Remove block style classes from the original classname.
		$classes_without_block_style = trim( preg_replace( '/is-style-([^\s]+)/i', '', $classname ) );

		return array(
			'fieldwrapperclasses' => $field_wrapper_classes,
			'classes'             => $classes_without_block_style,
		);
	}

	/**
	 * Turn block attribute to shortcode attributes.
	 *
	 * @param array         $atts  - the block attributes.
	 * @param string        $type  - the type.
	 * @param WP_Block|null $block - the block object.
	 *
	 * @return array
	 */
	public static function block_attributes_to_shortcode_attributes( $atts, $type, $block = null ) {
		$atts['type'] = $type;
		if ( isset( $atts['className'] ) ) {
			$atts['class'] = $atts['className'];
			unset( $atts['className'] );
		}

		if ( isset( $atts['defaultValue'] ) ) {
			$atts['default'] = $atts['defaultValue'];
			unset( $atts['defaultValue'] );
		}

		// Process inner blocks to shortcode attributes.
		if ( $block && ! empty( $block->parsed_block['innerBlocks'] ) ) {
			// Only apply the block style classes to the field wrapper if the field is one of the new inner block types.
			$add_block_style_classes_to_field_wrapper = false;

			foreach ( $block->parsed_block['innerBlocks'] as $inner_block ) {
				$block_name = $inner_block['blockName'] ?? '';

				if ( 'jetpack/label' === $block_name ) {
					$atts['label']                            = $inner_block['attrs']['label'] ?? $inner_block['attrs']['defaultLabel'] ?? '';
					$atts['requiredText']                     = $inner_block['attrs']['requiredText'] ?? null;
					$label_attrs                              = self::get_block_support_classes_and_styles( $block_name, $inner_block['attrs'] );
					$atts['labelclasses']                     = 'wp-block-jetpack-label';
					$atts['labelclasses']                    .= isset( $label_attrs['class'] ) ? ' ' . $label_attrs['class'] : '';
					$atts['labelstyles']                      = $label_attrs['style'] ?? null;
					$add_block_style_classes_to_field_wrapper = true;

					continue;
				}

				if ( 'jetpack/input' === $block_name ) {
					$atts['placeholder']   = $inner_block['attrs']['placeholder'] ?? '';
					$atts['min']           = $inner_block['attrs']['min'] ?? '';
					$atts['max']           = $inner_block['attrs']['max'] ?? '';
					$input_attrs           = self::get_block_support_classes_and_styles( $block_name, $inner_block['attrs'] );
					$atts['inputclasses']  = 'wp-block-jetpack-input';
					$atts['inputclasses'] .= isset( $input_attrs['class'] ) ? ' ' . $input_attrs['class'] : '';
					$atts['inputstyles']   = $input_attrs['style'] ?? null;

					if ( 'jetpack/field-select' === $block->name ) {
						$atts['togglelabel'] = $atts['placeholder'];
					}

					/*
						Borders for the outlined notched HTML.
					*/
					$style_variation_data                     = self::get_style_variation_shortcode_attributes( $block_name, $inner_block['attrs'] );
					$atts                                     = array_merge( $atts, $style_variation_data );
					$add_block_style_classes_to_field_wrapper = true;

					continue;
				}

				// This input is exclusively used by the new telephone field.
				if ( 'jetpack/phone-input' === $block_name ) {
					$atts['placeholder'] = $inner_block['attrs']['placeholder'] ?? '';

					if ( ! isset( $atts['showCountrySelector'] ) || ! $atts['showCountrySelector'] ) {
						unset( $atts['default'] );
					}

					if ( ! isset( $atts['showCountrySelector'] ) || ! $atts['showCountrySelector'] ) {
						unset( $atts['default'] );
					}

					$input_attrs           = self::get_block_support_classes_and_styles( $block_name, $inner_block['attrs'] );
					$atts['inputclasses']  = 'wp-block-jetpack-input jetpack-field__input-element';
					$atts['inputclasses'] .= isset( $input_attrs['class'] ) ? ' ' . $input_attrs['class'] : '';
					$atts['inputstyles']   = $input_attrs['style'] ?? null;

					/*
						Borders for the outlined notched HTML.
					*/
					$style_variation_data                     = self::get_style_variation_shortcode_attributes( $block_name, $inner_block['attrs'] );
					$atts                                     = array_merge( $atts, $style_variation_data );
					$add_block_style_classes_to_field_wrapper = true;

					continue;
				}

				// The following handles when option blocks are a direct inner block for a field e.g. singular checkbox field.
				if ( 'jetpack/option' === $block_name ) {
					$atts['label']                            = $inner_block['attrs']['label'] ?? $inner_block['attrs']['defaultLabel'] ?? '';
					$option_attrs                             = self::get_block_support_classes_and_styles( $block_name, $inner_block['attrs'] );
					$atts['optionclasses']                    = 'wp-block-jetpack-option';
					$atts['optionclasses']                   .= isset( $option_attrs['class'] ) ? ' ' . $option_attrs['class'] : '';
					$atts['optionstyles']                     = $option_attrs['style'] ?? null;
					$add_block_style_classes_to_field_wrapper = true;

					continue;
				}

				// The following handles choice fields such as; Single Choice Field (radio) or Multiple Choice Field (checkbox).
				if ( 'jetpack/options' === $block_name ) {
					$option_blocks           = $inner_block['innerBlocks'] ?? array();
					$options                 = array();
					$options_data            = array();
					$atts['optionsclasses']  = 'wp-block-jetpack-options';
					$options_attrs           = self::get_block_support_classes_and_styles( $block_name, $inner_block['attrs'] );
					$atts['optionsclasses'] .= isset( $options_attrs['class'] ) ? ' ' . $options_attrs['class'] : '';

					// Check if the block has left border, then apply a class for indentation.
					$global_styles = wp_get_global_styles(
						array( 'border' ),
						array(
							'block_name' => $block_name,
							'transforms' => array( 'resolve-variables' ),
						)
					);

					if ( isset( $inner_block['attrs']['style']['border']['width'] ) || isset( $inner_block['attrs']['style']['border']['left']['width'] ) || isset( $global_styles['width'] ) || isset( $global_styles['left']['width'] ) ) {
						$atts['optionsclasses'] .= ' jetpack-field-multiple__list--has-border';
					}

					$atts['optionsstyles'] = $options_attrs['style'] ?? null;

					foreach ( $option_blocks as $option ) {
						$option_label = trim( $option['attrs']['label'] ?? '' );

						if ( $option_label ) {
							$option_attrs = self::get_block_support_classes_and_styles( 'jetpack/option', $option['attrs'] );
							$option_data  = array( 'label' => $option_label );

							if ( isset( $option_attrs['class'] ) ) {
								$option_data['class'] = $option_attrs['class'] . ' wp-block-jetpack-option';
							} else {
								$option_data['class'] = 'wp-block-jetpack-option';
							}

							if ( isset( $option_attrs['style'] ) ) {
								$option_data['style'] = $option_attrs['style'];
							}

							$options[]      = $option_label; // Legacy shortcode attribute in case filters are using it.
							$options_data[] = $option_data;
						}
					}

					$atts['options']     = implode( ',', $options );
					$atts['optionsdata'] = \wp_json_encode( $options_data );

					/*
						Borders for the outlined notched HTML.
					*/
					$style_variation_atts                     = self::get_style_variation_shortcode_attributes( $block_name, $inner_block['attrs'] );
					$atts                                     = array_merge( $atts, $style_variation_atts );
					$add_block_style_classes_to_field_wrapper = true;

					continue;
				}

				if ( 'jetpack/fieldset-image-options' === $block_name ) {
					$option_blocks           = $inner_block['innerBlocks'] ?? array();
					$options                 = array();
					$options_data            = array();
					$atts['optionsclasses']  = 'wp-block-jetpack-fieldset-image-options';
					$options_attrs           = self::get_block_support_classes_and_styles( $block_name, $inner_block['attrs'] );
					$atts['optionsclasses'] .= isset( $options_attrs['class'] ) ? ' ' . $options_attrs['class'] : '';

					// Check if the block has left border, then apply a class for indentation.
					$global_styles = wp_get_global_styles(
						array( 'border' ),
						array(
							'block_name' => $block_name,
							'transforms' => array( 'resolve-variables' ),
						)
					);

					if ( isset( $inner_block['attrs']['style']['border']['width'] ) || isset( $inner_block['attrs']['style']['border']['left']['width'] ) || isset( $global_styles['width'] ) || isset( $global_styles['left']['width'] ) ) {
						$atts['optionsclasses'] .= ' jetpack-field-image-select__list--has-border';
					}

					$atts['optionsstyles'] = $options_attrs['style'] ?? null;

					foreach ( $option_blocks as $option_index => $option ) {
						$option_label = trim( $option['attrs']['label'] ?? '' );

						// Generate letter for this option (A, B, C, ..., AA, AB, etc.)
						$option_letter = self::get_image_option_letter( $option_index + 1 );

						$option_attrs       = self::get_block_support_classes_and_styles( 'jetpack/input-image-option', $option['attrs'], array( 'typography', 'border', 'custom', 'spacing' ) );
						$option_attrs_color = self::get_block_support_classes_and_styles( 'jetpack/input-image-option', $option['attrs'], array( 'color' ) );
						$option_data        = array(
							'label'  => $option_label,
							'letter' => $option_letter,
							'image'  => $option['innerBlocks'][0],
						);

						if ( isset( $option_attrs['class'] ) ) {
							$option_data['class'] = $option_attrs['class'] . ' wp-block-jetpack-input-image-option';
						} else {
							$option_data['class'] = 'wp-block-jetpack-input-image-option';
						}
						if ( isset( $option_attrs_color['class'] ) ) {
							$option_data['classcolor'] = $option_attrs_color['class'];
						}

						if ( isset( $option_attrs['style'] ) ) {
							$option_data['style'] = $option_attrs['style'];
						}
						if ( isset( $option_attrs_color['style'] ) ) {
							$option_data['stylecolor'] = $option_attrs_color['style'];
						}

						$options[]      = $option_letter; // Legacy shortcode attribute - use letter for consistent submission
						$options_data[] = $option_data;
					}

					$atts['options']     = implode( ',', $options );
					$atts['optionsdata'] = \wp_json_encode( $options_data );

					/*
						Borders for the outlined notched HTML.
					*/
					$style_variation_atts                     = self::get_style_variation_shortcode_attributes( $block_name, $inner_block['attrs'] );
					$atts                                     = array_merge( $atts, $style_variation_atts );
					$add_block_style_classes_to_field_wrapper = true;

					continue;
				}

				if ( 'jetpack/input-rating' === $block_name ) {
					$input_attrs          = self::get_block_support_classes_and_styles( $block_name, $inner_block['attrs'] );
					$atts['inputclasses'] = isset( $input_attrs['class'] ) ? ' ' . $input_attrs['class'] : '';
					$atts['inputstyles']  = $input_attrs['style'] ?? null;
					$atts['iconStyle']    = $atts['iconStyle'] ?? $inner_block['attrs']['iconStyle'] ?? 'stars';
					continue;
				}

				if ( 'jetpack/input-range' === $block_name ) {
					$input_attrs          = self::get_block_support_classes_and_styles( $block_name, $inner_block['attrs'] );
					$atts['inputclasses'] = isset( $input_attrs['class'] ) ? ' ' . $input_attrs['class'] : '';
					$atts['inputstyles']  = $input_attrs['style'] ?? null;
					// Also add classes to the field wrapper so color/typography presets cascade to slider labels on the frontend.
					if ( isset( $input_attrs['class'] ) && $input_attrs['class'] ) {
						$atts['fieldwrapperclasses'] = trim( ( $atts['fieldwrapperclasses'] ?? '' ) . ' ' . $input_attrs['class'] );
					}
					$add_block_style_classes_to_field_wrapper = true;
					continue;
				}
			}

			/*
			 * Add the `wp-block-jetpack-field-*` and `is-style-*` classes to the field wrapper div
			 * for fields that are one of the new inner block types.
			 * This ensures any updates to field block styles in theme.json or global styles are
			 * correctly applied.
			 */
			if ( $add_block_style_classes_to_field_wrapper ) {
				$atts['fieldwrapperclasses'] = 'wp-block-jetpack-field-' . $type;
				if ( ! empty( $atts['class'] ) ) {
					$block_style_classes          = self::get_block_style_classes( $atts['class'] );
					$atts['fieldwrapperclasses'] .= $block_style_classes['fieldwrapperclasses'];
					// Return the rest of the classes without the block style classes.
					$atts['class'] = $block_style_classes['classes'];
				}
			}
		}

		return $atts;
	}

	/**
	 * Generates a letter for image options based on position (A, B, C, ..., AA, AB, etc.)
	 *
	 * @param int $position The 1-based position of the option.
	 * @return string The letter representation.
	 */
	private static function get_image_option_letter( $position ) {
		if ( $position < 1 ) {
			return '';
		}

		$result = '';

		while ( $position > 0 ) {
			--$position;
			$result   = chr( 65 + ( $position % 26 ) ) . $result;
			$position = floor( $position / 26 );
		}

		return $result;
	}

	/**
	 * Resets the step counter back to 0.
	 */
	public static function reset_step() {
		self::$step_count = 0;
	}

	/**
	 * Render the number field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the number field.
	 */
	public static function gutenblock_render_form_step( $atts, $content ) {
		self::$step_count = 1 + self::$step_count;

		$version = Constants::get_constant( 'JETPACK__VERSION' );
		if ( empty( $version ) ) {
			$version = '0.1';
		}

		\wp_enqueue_script_module(
			'jetpack-form-step',
			plugins_url( '../../dist/modules/form-step/view.js', __FILE__ ),
			array( '@wordpress/interactivity' ),
			$version
		);

		// Process content for marker classes and add interactivity
		$processed_content = $content;

		// Only process if we have the WP_HTML_Tag_Processor
		if ( class_exists( 'WP_HTML_Tag_Processor' ) ) {
			$blocks_content = do_blocks( $content );
			$tags           = new \WP_HTML_Tag_Processor( $blocks_content );

			// Move to the first token so the bookmark has a valid span, then set the bookmark.
			$tags->next_tag();
			$tags->set_bookmark( 'start' );

			// Process blocks with the "next step" trigger
			while ( $tags->next_tag( array( 'class_name' => 'trigger-next-step' ) ) ) {
				// No need to set data-wp-interactive since the parent div already has it
				$tags->set_attribute( 'data-wp-on--click', 'actions.nextStep' );
			}

			// Reset and process blocks with the "previous step" trigger
			$tags->seek( 'start' );
			while ( $tags->next_tag( array( 'class_name' => 'trigger-previous-step' ) ) ) {
				$tags->set_attribute( 'data-wp-on--click', 'actions.previousStep' );
			}

			$processed_content = $tags->get_updated_html();
		} else {
			$processed_content = do_blocks( $content );
		}
		$is_current_step_class = ( self::$step_count === 1 ? 'is-current-step' : '' );
		return '<div data-wp-interactive="jetpack/form" class="jetpack-form-step ' . $is_current_step_class . ' " data-wp-class--is-before-current="state.isBeforeCurrent" data-wp-class--is-after-current="state.isAfterCurrent" data-wp-class--is-current-step="state.isCurrentStep" ' . wp_interactivity_data_wp_context( array( 'step' => self::$step_count ) ) . ' >'
				. $processed_content
			. '</div>';
	}

	/**
	 * Render the number field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the number field.
	 */
	public static function gutenblock_render_form_step_navigation( $atts, $content ) {

		$version = Constants::get_constant( 'JETPACK__VERSION' );
		if ( empty( $version ) ) {
			$version = '0.1';
		}
		\wp_enqueue_script_module(
			'jetpack-form-step-navigation',
			plugins_url( '../../dist/modules/form-step-navigation/view.js', __FILE__ ),
			array( '@wordpress/interactivity' ),
			$version
		);

		// Enqueue the frontend style for the step navigation.
		$style_handle = 'jetpack-form-step-navigation-style';
		$style_path   = '../../dist/blocks/form-step-navigation/style.css';
		if ( ! wp_style_is( $style_handle, 'enqueued' ) ) {
			wp_enqueue_style( $style_handle, plugins_url( $style_path, __FILE__ ), array(), $version );
		}

		$button_blocks_html = do_blocks( $content );

		$processor = new \WP_HTML_Tag_Processor( $button_blocks_html );

		$processor->next_tag();
		$processor->next_tag();

		$processor->set_attribute( 'data-wp-interactive', 'jetpack/form' );

		$class_names = array();

		if ( ! empty( $atts['layout']['type'] ) ) {
			$class_names[] = 'is-layout-' . sanitize_title( $atts['layout']['type'] );
		}

		if ( ! empty( $atts['layout']['orientation'] ) ) {
			$class_names[] = 'is-' . sanitize_title( $atts['layout']['orientation'] );
		}

		if ( ! empty( $atts['layout']['justifyContent'] ) ) {
			$class_names[] = 'is-content-justification-' . sanitize_title( $atts['layout']['justifyContent'] );
		}

		if ( ! empty( $atts['layout']['flexWrap'] ) && 'nowrap' === $atts['layout']['flexWrap'] ) {
			$class_names[] = 'is-nowrap';
		}

		foreach ( $class_names as $class_name ) {
			$processor->add_class( $class_name );
		}

		while ( $processor->next_tag() ) {
			$id = $processor->get_attribute( 'data-id-attr' );
			if ( 'previous-step' === $id ) {
				$processor->remove_attribute( 'id' );
				$processor->add_class( 'disable-spinner is-previous is-hidden' );
				$processor->set_attribute( 'data-wp-on--click', 'actions.previousStep' );
				$processor->set_attribute( 'data-wp-class--is-hidden', 'state.isFirstStep' );
			}
			if ( 'next-step' === $id ) {
				$processor->remove_attribute( 'id' );
				$processor->add_class( 'disable-spinner is-next' );
				$processor->set_attribute( 'data-wp-on--click', 'actions.nextStep' );
				$processor->set_attribute( 'data-wp-class--is-hidden', 'state.isLastStep' );
			}
			if ( 'submit-step' === $id ) {
				$processor->remove_attribute( 'id' );
				$processor->add_class( 'is-submit is-hidden' );
				$processor->set_attribute( 'data-wp-class--is-hidden', 'state.isNotLastStep' );
			}
		}

		return $processor->get_updated_html();
	}

	/**
	 * Render the progress indicator.
	 *
	 * @param array $attributes - the block attributes.
	 *
	 * @return string HTML for the progress indicator.
	 */
	public static function gutenblock_render_form_progress_indicator( $attributes ) {
		$version = Constants::get_constant( 'JETPACK__VERSION' );
		if ( empty( $version ) ) {
			$version = '0.1';
		}

		// Get step count from Contact_Form_Block
		$max_steps = Contact_Form_Block::get_form_step_count();

		$style_handle = 'jetpack-form-progress-indicator-style';
		if ( ! wp_style_is( $style_handle, 'enqueued' ) ) {
			wp_enqueue_style( $style_handle, plugins_url( 'dist/blocks/form-progress-indicator/style.css', dirname( __DIR__ ) ), array(), $version );
		}

		$script_handle = 'jetpack-form-progress-indicator';
		\wp_enqueue_script_module(
			$script_handle,
			plugins_url( 'dist/modules/form-progress-indicator/view.js', dirname( __DIR__ ) ),
			array( '@wordpress/interactivity' ),
			$version
		);

		$variant       = isset( $attributes['variant'] ) ? $attributes['variant'] : 'line';
		$is_dots_style = $variant === 'dots';

		// Build custom CSS variables for progress indicator colors
		$custom_styles = array();

		if ( isset( $attributes['progressColor'] ) ) {
			$custom_styles[] = '--jp-progress-active-color: ' . esc_attr( $attributes['progressColor'] );
		}

		if ( isset( $attributes['progressBackgroundColor'] ) ) {
			$custom_styles[] = '--jp-progress-track-color: ' . esc_attr( $attributes['progressBackgroundColor'] );
		}

		if ( isset( $attributes['textColor'] ) ) {
			$custom_styles[] = '--jp-progress-text-color: var(--wp--preset--color--' . esc_attr( $attributes['textColor'] ) . ')';
		} elseif ( isset( $attributes['style']['color']['text'] ) ) {
			$custom_styles[] = '--jp-progress-text-color: ' . esc_attr( $attributes['style']['color']['text'] );
		}

		// Use WordPress Style Engine for block supports (dimensions, spacing, background, etc.)
		$generated_styles = wp_style_engine_get_styles( $attributes['style'] ?? array() );

		$generated_css_parts = ! empty( $generated_styles['css'] ) ? explode( ';', $generated_styles['css'] ) : array();
		$all_styles          = array_filter( array_merge( $custom_styles, $generated_css_parts ) );

		$extra_attributes = array();
		if ( ! empty( $all_styles ) ) {
			$extra_attributes['style'] = implode( '; ', $all_styles );
		}

		// Add generated classnames if any
		$classes = array();
		if ( ! empty( $generated_styles['classnames'] ) ) {
			$classes[] = $generated_styles['classnames'];
		}
		// Add variant class
		$classes[] = 'is-variant-' . $variant;

		$extra_attributes['class'] = implode( ' ', $classes );

		$wrapper_attributes = get_block_wrapper_attributes( $extra_attributes );

		// Build the complete HTML structure using output buffering for better readability
		ob_start();
		$progress_state = $is_dots_style ? 'state.getDotsProgress' : 'state.getStepProgress';
		?>
		<div <?php echo wp_kses_post( $wrapper_attributes ); ?>>
			<div class="jetpack-form-progress-indicator-steps">
				<?php if ( $is_dots_style ) : ?>
					<?php for ( $i = 0; $i < $max_steps; $i++ ) : ?>
						<?php $step_context = array( 'stepIndex' => $i ); ?>
						<div class="jetpack-form-progress-indicator-step"
							data-wp-class--is-active="state.isStepActive"
							data-wp-class--is-completed="state.isStepCompleted"
							data-wp-context='<?php echo wp_json_encode( $step_context ); ?>'>
							<div class="jetpack-form-progress-indicator-line"></div>
							<div class="jetpack-form-progress-indicator-dot">
								<span class="jetpack-form-progress-indicator-step-number">
									<span class="step-number"><?php echo esc_html( $i + 1 ); ?></span>
									<span class="step-checkmark" role="img" aria-label="<?php echo esc_attr__( 'Completed', 'jetpack-forms' ); ?>">
										<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" fill="currentColor"/>
										</svg>
									</span>
								</span>
							</div>
						</div>
					<?php endfor; ?>
				<?php endif; ?>
				<div class="jetpack-form-progress-indicator-progress"
					data-wp-style--width="<?php echo esc_attr( $progress_state ); ?>"></div>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Returns the form "Outlined" style classes and styles.
	 * Important: The "Outlined" style is somewhat different as it uses custom HTML to create a border around the field's label.
	 * When applying styles to the control, background and border styles are applied to the custom HTML, not the input itself.
	 *
	 * @param string $block_name - the block name.
	 * @param array  $attrs - the block attributes.
	 *
	 * @return array
	 */
	protected static function get_style_variation_shortcode_attributes( $block_name, $attrs ) {
		$picked_attributes = array();

		// For style variations like the outlined style, we only care about porting specific attributes like background color and border
		// to the custom label HTML, so we pick those attributes and ignore the rest.
		if ( isset( $attrs['backgroundColor'] ) ) {
			$picked_attributes['backgroundColor'] = $attrs['backgroundColor'];
		}

		if ( isset( $attrs['borderColor'] ) ) {
			$picked_attributes['borderColor'] = $attrs['borderColor'];
		}

		if ( isset( $attrs['style']['border'] ) ) {
			$picked_attributes['style']['border'] = $attrs['style']['border'];
		}

		if ( isset( $attrs['borderColor'] ) ) {
			$picked_attributes['borderColor'] = $attrs['borderColor'];
		}

		if ( isset( $attrs['style']['color']['background'] ) ) {
			$picked_attributes['style']['color']['background'] = $attrs['style']['color']['background'];
		}

		$block_support_styles = self::get_block_support_classes_and_styles( $block_name, $picked_attributes );
		return array(
			'stylevariationattributes' => isset( $picked_attributes['style'] ) ? \wp_json_encode( $picked_attributes['style'] ) : '',
			'stylevariationclasses'    => isset( $block_support_styles['class'] ) ? ' ' . $block_support_styles['class'] : '',
			'stylevariationstyles'     => isset( $block_support_styles['style'] ) ? $block_support_styles['style'] : '',
		);
	}

	/**
	 * Render the text field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_text( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'text', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the name field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_name( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'name', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the email field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_email( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'email', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the url field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_url( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'url', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the date field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_date( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'date', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the telephone field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_telephone( $atts, $content, $block ) {
		// conversion telephone to phone
		$type = empty( $atts['showCountrySelector'] ) ? 'telephone' : 'phone';
		$atts = self::block_attributes_to_shortcode_attributes( $atts, $type, $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the text area field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_textarea( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'textarea', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the checkbox field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_checkbox( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'checkbox', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the multiple checkbox field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_checkbox_multiple( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'checkbox-multiple', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the multiple choice field option.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_option( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'field-option' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the radio button field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_radio( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'radio', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the select field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_select( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'select', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the consent field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 */
	public static function gutenblock_render_field_consent( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'consent', $block );

		if ( ! isset( $atts['implicitConsentMessage'] ) ) {
			$atts['implicitConsentMessage'] = __( "By submitting your information, you're giving us permission to email you. You may unsubscribe at any time.", 'jetpack-forms' );
		}

		if ( ! isset( $atts['explicitConsentMessage'] ) ) {
			$atts['explicitConsentMessage'] = __( 'Can we send you an email from time to time?', 'jetpack-forms' );
		}

		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the file upload field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the file upload field.
	 */
	public static function gutenblock_render_field_file( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'file', $block );
		// Create wrapper div for the file field
		$output = '<div class="jetpack-form-file-field">';

		// Render the file field
		$output .= Contact_Form::parse_contact_field( $atts, $content );

		$output .= '</div>';

		return $output;
	}
	/**
	 * Render the dropzone field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the dropzone field.
	 */
	public static function gutenblock_render_dropzone( $atts, $content ) {

		if ( class_exists( 'WP_HTML_Tag_Processor' ) ) {
			$processor = \WP_HTML_Processor::create_fragment( $content );
			while ( $processor->next_tag() ) {
				if ( $processor->has_class( 'wp-block-jetpack-dropzone' ) ) {
					if ( isset( $atts['layout']['justifyContent'] ) ) {
						$processor->add_class( 'is-content-justification-' . $atts['layout']['justifyContent'] );
					}
				}
				if ( 'A' === $processor->get_tag() || 'BUTTON' === $processor->get_tag() ) {
					$processor->set_attribute( 'tabindex', '-1' );
				}
			}
			$content = $processor->get_updated_html();
		}

		return $content;
	}
	/**
	 * Render the hidden field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the hidden field.
	 */
	public static function gutenblock_render_field_hidden( $atts, $content ) {
		// Convert block attributes to shortcode attributes.
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'hidden' );
		// Parse the contact field.
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the number field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the number field.
	 */
	public static function gutenblock_render_field_number( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'number', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the time field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the time field.
	 */
	public static function gutenblock_render_field_time( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'time', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the image select field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the image select form field.
	 */
	public static function gutenblock_render_field_image_select( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'image-select', $block );

		// Ensure showLabels is always present in the shortcode attributes, as it defaults to true.
		if ( ! array_key_exists( 'showLabels', $atts ) ) {
			$atts['showLabels'] = true;
		}

		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Add the 'Form Responses' menu item as a submenu of Feedback.
	 */
	public function admin_menu() {
		$slug = 'feedback';

		if ( is_plugin_active( 'polldaddy/polldaddy.php' ) ) {
			add_menu_page(
				__( 'Feedback', 'jetpack-forms' ),
				__( 'Feedback', 'jetpack-forms' ),
				'edit_pages',
				$slug,
				null,
				'dashicons-feedback',
				45
			);
		}

		add_submenu_page(
			$slug,
			__( 'Form Responses', 'jetpack-forms' ),
			__( 'Form Responses', 'jetpack-forms' ),
			'edit_pages',
			'edit.php?post_type=feedback',
			null,
			0
		);

		remove_submenu_page(
			$slug,
			$slug
		);

		// remove the first default submenu item
		remove_submenu_page(
			$slug,
			'edit.php?post_type=feedback'
		);
	}

	/**
	 * Add to REST API post type allowed list.
	 *
	 * @param array $post_types - the post types.
	 */
	public function allow_feedback_rest_api_type( $post_types ) {
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
	public function unread_count( $screen ) {
		if ( isset( $screen->post_type ) && 'feedback' === $screen->post_type || $screen->id === 'jetpack_page_jetpack-forms-admin' ) {
			update_option( 'feedback_unread_count', 0 );
		} else {
			global $submenu, $menu;
			if ( apply_filters( 'jetpack_forms_use_new_menu_parent', true ) && current_user_can( 'edit_pages' ) ) {
				// show the count on Jetpack and Jetpack → Forms
				$unread = get_option( 'feedback_unread_count', 0 );

				if ( $unread > 0 && isset( $submenu['jetpack'] ) && is_array( $submenu['jetpack'] ) && ! empty( $submenu['jetpack'] ) ) {
					$forms_unread_count_tag = " <span class='count-{$unread} awaiting-mod'><span>" . number_format_i18n( $unread ) . '</span></span>';
					$jetpack_badge_count    = $unread;

					// Main menu entries
					foreach ( $menu as $index => $main_menu_item ) {
						if ( isset( $main_menu_item[1] ) && 'jetpack_admin_page' === $main_menu_item[1] ) {
							// Parse the menu item
							$jetpack_menu_item = $this->parse_menu_item( $menu[ $index ][0] );

							if ( isset( $jetpack_menu_item['badge'] ) && is_numeric( $jetpack_menu_item['badge'] ) && intval( $jetpack_menu_item['badge'] ) ) {
								$jetpack_badge_count += intval( $jetpack_menu_item['badge'] );
							}

							if ( isset( $jetpack_menu_item['count'] ) && is_numeric( $jetpack_menu_item['count'] ) && intval( $jetpack_menu_item['count'] ) ) {
								$jetpack_badge_count += intval( $jetpack_menu_item['count'] );
							}

							$jetpack_unread_tag = " <span class='count-{$jetpack_badge_count} awaiting-mod'><span>" . number_format_i18n( $jetpack_badge_count ) . '</span></span>';

							// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
							$menu[ $index ][0] = $jetpack_menu_item['title'] . ' ' . $jetpack_unread_tag;
						}
					}

					// Jetpack submenu entries
					foreach ( $submenu['jetpack'] as $index => $menu_item ) {
						if ( 'jetpack-forms-admin' === $menu_item[2] ) {
							// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
							$submenu['jetpack'][ $index ][0] .= $forms_unread_count_tag;
						}
					}
				}
				return;
			}
			if ( isset( $submenu['feedback'] ) && is_array( $submenu['feedback'] ) && ! empty( $submenu['feedback'] ) ) {
				foreach ( $submenu['feedback'] as $index => $menu_item ) {
					if ( 'edit.php?post_type=feedback' === $menu_item[2] ) {
						$unread = get_option( 'feedback_unread_count', 0 );
						if ( $unread > 0 ) {
							$unread_count = current_user_can( 'publish_pages' ) ? " <span class='feedback-unread count-{$unread} awaiting-mod'><span class='feedback-unread-count'>" . number_format_i18n( $unread ) . '</span></span>' : '';

							// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
							$submenu['feedback'][ $index ][0] .= $unread_count;
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
	public function process_form_submission() {
		// Add a filter to replace tokens in the subject field with sanitized field values.
		add_filter( 'contact_form_subject', array( $this, 'replace_tokens_with_input' ), 10, 2 );

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Checked below for logged-in users only, see https://plugins.trac.wordpress.org/ticket/1859
		$id   = isset( $_POST['contact-form-id'] ) ? sanitize_text_field( wp_unslash( $_POST['contact-form-id'] ) ) : null;
		$hash = isset( $_POST['contact-form-hash'] ) ? sanitize_text_field( wp_unslash( $_POST['contact-form-hash'] ) ) : null;
		$hash = is_string( $hash ) ? preg_replace( '/[^\da-f]/i', '', $hash ) : $hash;
		// phpcs:enable

		if ( ! is_string( $id ) || ! is_string( $hash ) ) {
			return false;
		}

		if ( is_user_logged_in() ) {
			check_admin_referer( "contact-form_{$id}" );
		}

		$is_widget              = str_starts_with( $id, 'widget-' );
		$is_block_template      = str_starts_with( $id, 'block-template-' );
		$is_block_template_part = str_starts_with( $id, 'block-template-part-' );

		if ( isset( $_POST['jetpack_contact_form_jwt'] ) ) {
			$form = Contact_Form::get_instance_from_jwt( sanitize_text_field( wp_unslash( $_POST['jetpack_contact_form_jwt'] ) ) );
			if ( ! $form ) { // fail early if the JWT is invalid.
				// If the JWT is invalid, we can't process the form.
				return false;
			}

			$form->validate();

			if ( $form->has_errors() ) {
				return $form->errors;
			}

			if ( ! empty( $form->attributes['salesforceData'] ) || ! empty( $form->attributes['postToUrl'] ) ) {
				Post_To_Url::init();
			}
			// Process the form
			return $form->process_submission();
		}
		/** This action is documented already in this file. */
		do_action( 'jetpack_forms_log', 'submission_missing_jwt' );

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
				// Process the widget to populate Contact_Form::$last
				call_user_func( $widget['callback'], $widget_args, $widget['params'][0] );
				ob_end_clean();
			}
		} elseif ( $is_block_template ) {
			/*
			 * Recreate the logic in wp-includes/template-loader.php
			 * that happens *after* 'template_redirect'.
			 *
			 * This logic populates the $_wp_current_template_content
			 * global, which we need in order to render the contact
			 * form for this block template.
			 */
			// start of copy-pasta from wp-includes/template-loader.php.
			$tag_templates = array(
				'is_embed'             => 'get_embed_template',
				'is_404'               => 'get_404_template',
				'is_search'            => 'get_search_template',
				'is_front_page'        => 'get_front_page_template',
				'is_home'              => 'get_home_template',
				'is_privacy_policy'    => 'get_privacy_policy_template',
				'is_post_type_archive' => 'get_post_type_archive_template',
				'is_tax'               => 'get_taxonomy_template',
				'is_attachment'        => 'get_attachment_template',
				'is_single'            => 'get_single_template',
				'is_page'              => 'get_page_template',
				'is_singular'          => 'get_singular_template',
				'is_category'          => 'get_category_template',
				'is_tag'               => 'get_tag_template',
				'is_author'            => 'get_author_template',
				'is_date'              => 'get_date_template',
				'is_archive'           => 'get_archive_template',
			);
			$template      = false;
			// Loop through each of the template conditionals, and find the appropriate template file.
			// This is what calls locate_block_template() to hydrate $_wp_current_template_content.
			foreach ( $tag_templates as $tag => $template_getter ) {
				if ( call_user_func( $tag ) ) {
					$template = call_user_func( $template_getter );
				}
				if ( $template ) {
					if ( 'is_attachment' === $tag ) {
						remove_filter( 'the_content', 'prepend_attachment' );
					}
					break;
				}
			}
			if ( ! $template ) {
				$template = get_index_template();
			}
			// end of copy-pasta from wp-includes/template-loader.php.

			// Ensure 'block_template' attribute is added to any shortcodes in the template.
			$template = Util::grunion_contact_form_set_block_template_attribute( $template );

			// Process the block template to populate Contact_Form::$last
			get_the_block_template_html();
		} elseif ( $is_block_template_part ) {
			$block_template_part_id   = str_replace( 'block-template-part-', '', $id );
			$bits                     = explode( '//', $block_template_part_id );
			$block_template_part_slug = array_pop( $bits );
			// Process the block part template to populate Contact_Form::$last
			$attributes = array(
				'theme'   => wp_get_theme()->get_stylesheet(),
				'slug'    => $block_template_part_slug,
				'tagName' => 'div',
			);
			do_blocks( '<!-- wp:template-part ' . wp_json_encode( $attributes ) . ' /-->' );
		} else {
			// It's a form embedded in a post

			if ( ! is_post_publicly_viewable( $id ) && ! current_user_can( 'read_post', $id ) ) {
				// The user can't see the post.
				return false;
			}

			if ( post_password_required( $id ) ) {
				// The post is password-protected and the password is not provided.
				return false;
			}

			$post = get_post( $id );

			// Process the content to populate Contact_Form::$last
			if ( $post ) {
				if ( str_contains( $post->post_content, '<!--nextpage-->' ) ) {
					$postdata = generate_postdata( $post );
					$page     = isset( $_POST['page'] ) ? absint( wp_unslash( $_POST['page'] ) ) : null; // phpcs:Ignore WordPress.Security.NonceVerification.Missing
					$paged    = isset( $page ) ? $page : 1;
					$content  = isset( $postdata['pages'][ $paged - 1 ] ) ? $postdata['pages'][ $paged - 1 ] : $post->post_content;
				} else {
					$content = $post->post_content;
				}
				/** This filter is already documented in core. wp-includes/post-template.php */
				apply_filters( 'the_content', $content );
			}
		}

		// In future version we will be able to skip this step.
		$form = isset( Contact_Form::$forms[ $hash ] ) ? Contact_Form::$forms[ $hash ] : null;

		// No form may mean user is using do_shortcode, grab the form using the stored post meta
		if ( ! $form && is_numeric( $id ) && $hash ) {

			// Get shortcode from post meta
			$shortcode = get_post_meta( $id, "_g_feedback_shortcode_{$hash}", true );

			// Format it
			if ( $shortcode !== '' && $shortcode !== false ) {

				// Get attributes from post meta.
				$parameters = '';
				$attributes = get_post_meta( $id, "_g_feedback_shortcode_atts_{$hash}", true );
				if ( ! empty( $attributes ) && is_array( $attributes ) ) {
					foreach ( array_filter( $attributes ) as $param => $value ) {
						if ( is_scalar( $value ) ) {
							$parameters .= " $param=\"$value\"";
						}
					}
				}

				$shortcode = '[contact-form' . $parameters . ']' . $shortcode . '[/contact-form]';
				do_shortcode( $shortcode );

				// Recreate form
				$form = Contact_Form::$last;
			}
		}

		if ( ! $form ) {
			return false;
		}

		if ( $form->has_errors() ) {
			return false;
		}

		if ( ! empty( $form->attributes['salesforceData'] ) || ! empty( $form->attributes['postToUrl'] ) ) {
			Post_To_Url::init();
		}

		// Process the form
		return $form->process_submission();
	}

	/**
	 * Handle the ajax request.
	 *
	 * @return never
	 */
	public function ajax_request() {
		$submission_result = self::process_form_submission();
		$accepts_json      = isset( $_SERVER['HTTP_ACCEPT'] ) && false !== strpos( strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_ACCEPT'] ) ) ), 'application/json' );

		if ( ! $submission_result ) {
			/**
			 * Action when we want to log a jetpack_forms event.
			 *
			 * @since 6.3.0
			 *
			 * @param string $log_message The log message.
			 */
			do_action( 'jetpack_forms_log', 'submission_failed' );
			$accepts_json && wp_send_json_error(
				array(
					'error' => __( 'An error occurred. Please try again later.', 'jetpack-forms' ),
				),
				500
			);

			// Non-JSON request, output the error message directly.
			header( 'HTTP/1.1 500 Server Error', true, 500 );
			echo '<div class="form-error"><ul class="form-errors"><li class="form-error-message">';
			esc_html_e( 'An error occurred. Please try again later.', 'jetpack-forms' );
			echo '</li></ul></div>';
			die();

		} elseif ( is_wp_error( $submission_result ) ) {
			do_action( 'jetpack_forms_log', $submission_result->get_error_message() );
			$accepts_json && wp_send_json_error(
				array(
					'error' => $submission_result->get_error_message(),
				),
				400
			);

			// Non-JSON request, output the error message directly.
			header( 'HTTP/1.1 400 Bad Request', true, 403 );
			echo '<div class="form-error"><ul class="form-errors"><li class="form-error-message">';
			echo esc_html( $submission_result->get_error_message() );
			echo '</li></ul></div>';
			die();
		}

		// Success case.
		echo '<h4>' . esc_html__( 'Your message has been sent', 'jetpack-forms' ) . '</h4>' . wp_kses(
			$submission_result,
			array(
				'br'         => array(),
				'blockquote' => array( 'class' => array() ),
				'p'          => array(),
			)
		);
		die();
	}

	/**
	 * Ensure the post author is always zero for contact-form feedbacks
	 * Attached to `wp_insert_post_data`
	 *
	 * @see Contact_Form::process_submission()
	 *
	 * @param array $data the data to insert.
	 * @param array $postarr the data sent to wp_insert_post().
	 * @return array The filtered $data to insert.
	 */
	public function insert_feedback_filter( $data, $postarr ) {
		if ( $data['post_type'] === 'feedback' && $postarr['post_type'] === 'feedback' ) {
			$data['post_author'] = 0;
		}

		return $data;
	}

	/**
	 * Adds our contact-form shortcode
	 * The "child" contact-field shortcode is enabled as needed by the contact-form shortcode handler
	 */
	public function add_shortcode() {
		add_shortcode( 'contact-form', array( '\Automattic\Jetpack\Forms\ContactForm\Contact_Form', 'parse' ) );
		add_shortcode( 'contact-field', array( '\Automattic\Jetpack\Forms\ContactForm\Contact_Form', 'parse_contact_field' ) );

		// We need 'contact-field-option' to be registered, so it's included to the get_shortcode_regex() method
		// But we don't need a callback because we're handling contact-field-option manually
		add_shortcode( 'contact-field-option', '__return_null' );
	}

	/**
	 * Tokenize the label.
	 *
	 * @param string $label - the label.
	 *
	 * @return string
	 */
	public static function tokenize_label( $label ) {
		return '{' . trim( wp_strip_all_tags( preg_replace( '#^\d+_#', '', $label ) ) ) . '}';
	}

	/**
	 * Sanitizes the value of a field.
	 *
	 * @param string|array|null $value The value to sanitize.
	 * @return string The sanitized value.
	 */
	public static function sanitize_value( $value ) {
		if ( null === $value ) {
			return '';
		}

		// If value is an array, convert it to a comma-separated string
		if ( is_array( $value ) ) {
			return implode( ', ', array_map( array( __CLASS__, 'sanitize_value' ), $value ) );
		}

		return preg_replace( '=((<CR>|<LF>|0x0A/%0A|0x0D/%0D|\\n|\\r)\S).*=i', '', $value );
	}

	/**
	 * Sanitizes and formats values for display, ensuring arrays are properly converted to strings.
	 *
	 * @param mixed $value The value to format.
	 * @return string|array The formatted value ready for display or file array for upload fields.
	 */
	public static function format_value_for_display( $value ) {
		if ( is_array( $value ) ) {
			// Check if this is a file upload field
			if ( Contact_Form::is_file_upload_field( $value ) ) {
				// This is a file upload field, return as is to be handled by the proper renderer
				return $value;
			}

			// Process each array element recursively and join with commas
			$formatted_values = array();
			foreach ( $value as $key => $item ) {
				$formatted_values[] = is_numeric( $key ) ? self::format_value_for_display( $item ) : "$key: " . self::format_value_for_display( $item );
			}
			return implode( ', ', $formatted_values );
		}

		// Simple value, just convert to string
		return (string) $value;
	}

	/**
	 * Replaces tokens like {city} or {City} (case insensitive) with the value
	 * of an input field of that name
	 *
	 * @param string $subject - the subject.
	 * @param array  $field_values Array with field label => field value associations.
	 *
	 * @return string The filtered $subject with the tokens replaced.
	 */
	public function replace_tokens_with_input( $subject, $field_values ) {
		// Wrap labels into tokens (inside {})
		$wrapped_labels = array_map( array( '\Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin', 'tokenize_label' ), array_keys( $field_values ) );
		// Sanitize all values
		$sanitized_values = array_map( array( '\Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin', 'sanitize_value' ), array_values( $field_values ) );

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
	 * @see $current_widget_id - the current widget ID.
	 *
	 * @param array $widget The widget data.
	 */
	public function track_current_widget( $widget ) {
		$this->current_widget_id = isset( $widget['id'] ) ? $widget['id'] : '';
	}

	/**
	 * Tracks the sidebar currently being processed.
	 * Attached to `dynamic_sidebar_before`
	 *
	 * @see $current_sidebar_id - the current sidebar ID.
	 *
	 * @param string $index The sidebar index.
	 */
	public function track_current_widget_before( $index ) {
		$this->current_sidebar_id = $index;
	}

	/**
	 * Clear the current widget context.
	 */
	public function track_current_widget_after() {
		$this->current_sidebar_id = '';
		$this->current_widget_id  = '';
	}

	/**
	 * Gets the current widget context.
	 *
	 * @return string The current widget context or false if not set.
	 */
	public function get_current_widget_context() {
		// If we don't have a current widget ID or sidebar ID, we
		if ( empty( $this->current_widget_id ) || empty( $this->current_sidebar_id ) ) {
			return '';
		}
		return $this->current_widget_id . '-' . $this->current_sidebar_id;
	}

	/**
	 * Adds a "widget" attribute to every contact-form embedded in a text widget.
	 * Used to tell the difference between post-embedded contact-forms and widget-embedded contact-forms
	 * Attached to `widget_text`
	 *
	 * @param string $text The widget text.
	 *
	 * @return string The filtered widget text.
	 */
	public function widget_atts( $text ) {
		Contact_Form::style( true );

		return preg_replace( '/\[contact-form([^a-zA-Z_-])/', '[contact-form widget="' . $this->current_widget_id . '"\\1', $text );
	}

	/**
	 * For sites where text widgets are not processed for shortcodes, we add this hack to process just our shortcode
	 * Attached to `widget_text`
	 *
	 * @param string $text The widget text.
	 *
	 * @return string The contact-form filtered widget text
	 */
	public function widget_shortcode_hack( $text ) {
		if ( ! preg_match( '/\[contact-form([^a-zA-Z_-])/', $text ) ) {
			return $text;
		}

		$old = $GLOBALS['shortcode_tags'];
		remove_all_shortcodes();
		self::$using_contact_form_field = true;
		$this->add_shortcode();

		$text = do_shortcode( $text );

		self::$using_contact_form_field = false;
		$GLOBALS['shortcode_tags']      = $old; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		return $text;
	}

	/**
	 * Check if a submission matches the Comment Blocklist.
	 * The Comment Blocklist is a means to moderate discussion, and contact
	 * forms are 1:1 discussion forums, ripe for abuse by users who are being
	 * removed from the public discussion.
	 * Attached to `jetpack_contact_form_is_spam`
	 *
	 * @param bool  $is_spam - if the submission is spam.
	 * @param array $form - the form data.
	 * @return bool TRUE => spam, FALSE => not spam
	 */
	public function is_spam_blocklist( $is_spam, $form = array() ) {
		if ( $is_spam ) {
			return $is_spam;
		}

		return $this->is_in_disallowed_list( false, $form );
	}

	/**
	 * Check if a submission matches the comment disallowed list.
	 * Attached to `jetpack_contact_form_in_comment_disallowed_list`.
	 *
	 * @param boolean $in_disallowed_list Whether the feedback is in the disallowed list.
	 * @param array   $form The form array.
	 * @return bool Returns true if the form submission matches the disallowed list and false if it doesn't.
	 */
	public function is_in_disallowed_list( $in_disallowed_list, $form = array() ) {
		if ( $in_disallowed_list ) {
			return $in_disallowed_list;
		}

		if (
			wp_check_comment_disallowed_list(
				$form['comment_author'],
				$form['comment_author_email'],
				$form['comment_author_url'],
				$form['comment_content'],
				$form['user_ip'],
				$form['user_agent']
			)
		) {
			return true;
		}

		return false;
	}

	/**
	 * Populate an array with all values necessary to submit a NEW contact-form feedback to Akismet.
	 * Note that this includes the current user_ip etc, so this should only be called when accepting a new item via $_POST
	 *
	 * @param array $form - contact form feedback array.
	 *
	 * @return array feedback array with additional data ready for submission to Akismet.
	 */
	public function prepare_for_akismet( $form ) {
		$form['comment_type']     = 'contact_form';
		$form['user_ip']          = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$form['user_agent']       = isset( $_SERVER['HTTP_USER_AGENT'] ) ? filter_var( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
		$form['referrer']         = isset( $_SERVER['HTTP_REFERER'] ) ? esc_url_raw( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) : '';
		$form['blog']             = get_option( 'home' );
		$form['comment_date_gmt'] = gmdate( DATE_ATOM, time() ); // ISO 8601. See https://www.php.net/manual/en/class.datetimeinterface.php#datetimeinterface.constants.types

		foreach ( $_SERVER as $key => $value ) {
			if ( ! is_string( $value ) ) {
				continue;
			}
			if ( in_array( $key, array( 'HTTP_COOKIE', 'HTTP_COOKIE2', 'HTTP_USER_AGENT', 'HTTP_REFERER' ), true ) ) {
				// We don't care about cookies, and the UA and Referrer were caught above.
				continue;
			} elseif ( in_array( $key, array( 'REMOTE_ADDR', 'REQUEST_URI', 'DOCUMENT_URI' ), true ) ) {
				// All three of these are relevant indicators and should be passed along.
				$form[ $key ] = $value;
			} elseif ( str_starts_with( $key, 'HTTP_' ) ) {
				// Any other HTTP header indicators.
				$form[ $key ] = $value;
			}
		}

		/**
		 * Filter the values that are sent to Akismet for the spam check.
		 *
		 * @module contact-form
		 *
		 * @since 10.2.0
		 *
		 * @param array $form The form values being sent to Akismet.
		 */
		return apply_filters( 'jetpack_contact_form_akismet_values', $form );
	}

	/**
	 * Submit contact-form data to Akismet to check for spam.
	 * If you're accepting a new item via $_POST, run it Contact_Form_Plugin::prepare_for_akismet() first
	 * Attached to `jetpack_contact_form_is_spam`
	 *
	 * @param bool  $is_spam - if the submission is spam.
	 * @param array $form - the form data.
	 * @return bool|WP_Error TRUE => spam, FALSE => not spam, WP_Error => stop processing entirely
	 */
	public function is_spam_akismet( $is_spam, $form = array() ) {
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
			$response = \Akismet::http_post( $query_string, 'comment-check' );
		} else {
			$response = akismet_http_post( $query_string, $akismet_api_host, '/1.1/comment-check', $akismet_api_port );
		}

		$result = false;

		if ( isset( $response[0]['x-akismet-pro-tip'] ) && 'discard' === trim( $response[0]['x-akismet-pro-tip'] ) && get_option( 'akismet_strictness' ) === '1' ) {
			$result = new WP_Error( 'feedback-discarded', __( 'Feedback discarded.', 'jetpack-forms' ) );
		} elseif ( isset( $response[1] ) && 'true' === trim( $response[1] ) ) { // 'true' is spam
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
	 * @param string $as - Either 'spam' or 'ham'.
	 * @param array  $form - the contact-form data.
	 *
	 * @return bool|string
	 */
	public function akismet_submit( $as, $form ) {
		global $akismet_api_host, $akismet_api_port;

		if ( ! in_array( $as, array( 'ham', 'spam' ), true ) ) {
			return false;
		}

		$query_string = '';
		if ( is_array( $form ) ) {
			$query_string = http_build_query( $form );
		}
		if ( method_exists( 'Akismet', 'http_post' ) ) {
			$response = \Akismet::http_post( $query_string, "submit-{$as}" );
		} else {
			$response = akismet_http_post( $query_string, $akismet_api_host, "/1.1/submit-{$as}", $akismet_api_port );
		}

		return trim( $response[1] );
	}

	/**
	 * Prints a dropdown of posts with forms.
	 *
	 * @param int $selected_id Currently selected post ID.
	 * @return void
	 */
	public static function form_posts_dropdown( $selected_id ) {
		?>
		<select name="jetpack_form_parent_id">
			<option value="all"><?php esc_html_e( 'All sources', 'jetpack-forms' ); ?></option>
			<?php echo self::get_feedbacks_as_options( $selected_id ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTML is escaped in the function. ?>
		</select>
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
	 * @param int  $post_id Id of the post to fetch meta data for.
	 * @param bool $has_json_data Whether the post has JSON data or not, defaults to false for backwards compatibility.
	 *
	 * @return mixed
	 */
	public function get_post_meta_for_csv_export( $post_id, $has_json_data = false ) {
		$content_fields = self::parse_fields_from_content( $post_id );
		$all_fields     = isset( $content_fields['_feedback_all_fields'] ) ? $content_fields['_feedback_all_fields'] : array();
		$md             = $has_json_data
			? array_diff_key( $all_fields, array_flip( array_keys( self::NON_PRINTABLE_FIELDS ) ) )
			: (array) get_post_meta( $post_id, '_feedback_extra_fields', true );

		$md['-3_response_date'] = get_the_date( 'Y-m-d H:i:s', $post_id );
		$md['93_ip_address']    = ( isset( $content_fields['_feedback_ip'] ) ) ? $content_fields['_feedback_ip'] : 0;

		// add the email_marketing_consent to the post meta.
		$md['90_consent'] = 0;
		if ( ! empty( $all_fields ) ) {
			// check if the email_marketing_consent field exists.
			if ( isset( $all_fields['email_marketing_consent'] ) ) {
				$md['90_consent'] = $all_fields['email_marketing_consent'];
			}

			// check if the feedback entry has a title.
			if ( isset( $all_fields['entry_title'] ) ) {
				$md['-9_title'] = $all_fields['entry_title'];
			}

			// check if the feedback entry has a permalink we can use.
			if ( ! empty( $all_fields['entry_permalink'] ) ) {
				$parsed          = wp_parse_url( $all_fields['entry_permalink'] );
				$md['-6_source'] = '';
				if ( $parsed && ! empty( $parsed['path'] ) && strpos( $parsed['path'], '/' ) === 0 ) {
					$md['-6_source'] .= $parsed['path'];
				}
				if ( $parsed && ! empty( $parsed['query'] ) ) {
					$md['-6_source'] .= '?' . $parsed['query'];
				}
			}
		}

		// flatten and decode all values.
		$result = array();
		foreach ( $md as $key => $value ) {
			if ( is_array( $value ) ) {
				if ( Contact_Form::is_file_upload_field( $value ) ) {
					$file_names = array();
					foreach ( $value['files'] as $file ) {
						$file_names[] = $file['name'];
					}
					$value = implode( ', ', $file_names );
				} else {
					$value = implode( ', ', $value );
				}
			}
			$result[ $key ] = html_entity_decode( $value, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 );
		}

		return $result;
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
	 * @param array $parsed_post_content Parsed post content.
	 * @param bool  $use_main_comment Whether to use the main comment from the post_content or not.
	 *                                Defaults to true for backwards compatibility. New JSON format
	 *                                does not have a main comment and instead has all fields in the parsed content.
	 *
	 * @see parse_fields_from_content for how the input data is generated.
	 *
	 * @return array Mapped fields.
	 */
	public function map_parsed_field_contents_of_post_to_field_names( $parsed_post_content, $use_main_comment = true ) {

		$mapped_fields = array();

		$field_mapping = array(
			// TODO: Commented out since we'll be re-introducing this after some other changes
			// '_feedback_subject'      => __( 'Contact Form', 'jetpack-forms' ),
			'_feedback_author'       => '1_Name',
			'_feedback_author_email' => '2_Email',
			'_feedback_author_url'   => '3_Website',
			'_feedback_ip'           => '93_ip_address',
		);

		if ( $use_main_comment ) {
			$field_mapping['_feedback_main_comment'] = '4_Comment';
		}

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
			'exporter_friendly_name' => __( 'Feedback', 'jetpack-forms' ),
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
			'eraser_friendly_name' => __( 'Feedback', 'jetpack-forms' ),
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
		return $this->internal_personal_data_exporter( $email, $page );
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
	 * @param  int    $per_page Number of feedbacks to process per page. Internal use only (testing).
	 *
	 * @return array            Associative array with keys expected by core.
	 */
	public function internal_personal_data_exporter( $email, $page = 1, $per_page = 250 ) {
		$post_ids = $this->personal_data_post_ids_by_email( $email, $per_page, $page );

		return array(
			'data' => $this->internal_personal_data_formater( $post_ids ),
			'done' => count( $post_ids ) < $per_page,
		);
	}

	/**
	 * Formats personal data for export.
	 *
	 * @param  array $post_ids Array of post IDs to format.
	 *
	 * @return array $export_data Formatted personal data for export.
	 */
	public function internal_personal_data_formater( $post_ids ) {
		$export_data = array();
		foreach ( $post_ids as $post_id ) {
			$post_export_data = array();
			$feedback         = Feedback::get( $post_id );
			if ( ! $feedback ) {
				continue;
			}
			$fields             = $feedback->get_compiled_fields( 'personal_export', 'all' );
			$post_export_data[] = array(
				'name'  => __( 'Date', 'jetpack-forms' ),
				'value' => $feedback->get_time(),
			);

			$post_export_data[] = array(
				'name'  => __( 'Source Title', 'jetpack-forms' ),
				'value' => $feedback->get_entry_title(),
			);

			$post_export_data[] = array(
				'name'  => __( 'Source URL:', 'jetpack-forms' ),
				'value' => $feedback->get_entry_permalink(),
			);

			foreach ( $fields as $field ) {
				$post_export_data[] = array(
					'name'  => $field['label'],
					'value' => $field['value'],
				);
			}

			$post_export_data[] = array(
				'name'  => __( 'Consent', 'jetpack-forms' ),
				'value' => $feedback->has_consent() ? __( 'Yes', 'jetpack-forms' ) : __( 'No', 'jetpack-forms' ),
			);

			$post_export_data[] = array(
				'name'  => __( 'IP Address', 'jetpack-forms' ),
				'value' => $feedback->get_ip_address(),
			);

			$export_data[] = array(
				'group_id'    => 'feedback',
				'group_label' => __( 'Feedback', 'jetpack-forms' ),
				'item_id'     => 'feedback-' . $post_id,
				'data'        => $post_export_data,
			);
		}

		return $export_data;
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
	 * @param  int    $per_page Number of feedbacks to process per page. Internal use only (testing).
	 *
	 * @return array            Associative array with keys expected by core.
	 */
	public function _internal_personal_data_eraser( $email, $page = 1, $per_page = 250 ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore -- this is called in other files.
		$removed      = false;
		$retained     = false;
		$messages     = array();
		$option_name  = sprintf( '_jetpack_pde_feedback_%s', md5( $email ) );
		$last_post_id = 1 === $page ? 0 : get_option( $option_name, 0 );
		$post_ids     = $this->personal_data_post_ids_by_email( $email, $per_page, $page, $last_post_id );

		foreach ( $post_ids as $post_id ) {
			$last_post_id = $post_id;

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
						__( 'Feedback ID %d could not be removed at this time.', 'jetpack-forms' ),
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
					__( 'Feedback ID %d could not be removed at this time.', 'jetpack-forms' ),
					$post_id
				);
			}
		}

		$done = count( $post_ids ) < $per_page;

		if ( $done ) {
			delete_option( $option_name );
		} else {
			update_option( $option_name, (int) $last_post_id );
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
	 * @return string         Filtered SQL where clause.
	 */
	public function personal_data_search_filter( $search ) {
		global $wpdb;

		/*
		 * Limits search to `post_content` only, and we only match the
		 * author's email address whenever it's on a line by itself.
		 */
		if ( $this->pde_email_address && str_contains( $search, '..PDE..AUTHOR EMAIL:..PDE..' ) ) {
			$search = (string) $wpdb->prepare(
				" AND (
					{$wpdb->posts}.post_content LIKE %s
					OR {$wpdb->posts}.post_content LIKE %s
				)",
				// `chr( 10 )` = `\n`, `chr( 13 )` = `\r` - Keeping this in case someone needs it for reference.
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
	 * Returns an array of feedback data for export.
	 *
	 * @param array $feedback_ids Array of feedback IDs to fetch the data for.
	 *
	 * @return array
	 */
	public function get_export_feedback_data( $feedback_ids ) {
		$feedback_data = array();
		$field_names   = array();

		foreach ( $feedback_ids as $feedback_id ) {
			$response = Feedback::get( $feedback_id );
			if ( ! $response instanceof Feedback ) {
				continue; // Skip if the feedback is not an instance of Feedback.
			}
			$feedback_data[ $feedback_id ] = $response;
			$field_names                   = array_merge( $field_names, $response->get_compiled_fields( 'csv', 'label' ) );
		}

		/**
		 * Make sure the field names are unique, because we don't want duplicate data.
		 */
		$field_names = array_unique( $field_names );
		return $this->format_feedback_data_for_csv( $feedback_data, $field_names );
	}

	/**
	 * Returns an array of feedback data for CSV export.
	 *
	 * @param array $feedback_data Array of feedback data to fetch the results for.
	 * @param array $field_names   Array of field names to include in the results.
	 *
	 * @return array
	 */
	private function format_feedback_data_for_csv( $feedback_data, $field_names ) {
		$results = array();
		foreach ( $feedback_data as $feedback_id => $feedback ) {

			if ( ! $feedback instanceof Feedback ) {
				continue; // Skip if the feedback is not an instance of Feedback.
			}
			$results[ __( 'ID', 'jetpack-forms' ) ][]     = $feedback_id;
			$results[ __( 'Date', 'jetpack-forms' ) ][]   = $feedback->get_time();
			$results[ __( 'Title', 'jetpack-forms' ) ][]  = $feedback->get_entry_title();
			$results[ __( 'Source', 'jetpack-forms' ) ][] = $feedback->get_entry_short_permalink();
			/**
			 * Go through all the possible fields and check if the field is available
			 * in the current feedback.
			 *
			 * If it is - add the data as a value.
			 * If it is not - add an empty string, which is just a placeholder in the CSV.
			 */
			foreach ( $field_names as $single_field_name ) {
				if ( ! isset( $results[ $single_field_name ] ) ) {
					$results[ $single_field_name ] = array();
				}
				$results[ $single_field_name ][] = $feedback->get_field_value_by_label( $single_field_name, 'csv' );
			}

			$results[ __( 'Consent', 'jetpack-forms' ) ][]    = $feedback->has_consent() ? __( 'Yes', 'jetpack-forms' ) : __( 'No', 'jetpack-forms' );
			$results[ __( 'IP Address', 'jetpack-forms' ) ][] = $feedback->get_ip_address();

		}
		return $results;
	}

	/**
	 * Prepares feedback post data for CSV export.
	 *
	 * @deprecated since 5.1.0
	 *
	 * @see get_export_feedback_data()
	 * @param array $post_ids Post IDs to fetch the data for. These need to be Feedback posts.
	 *
	 * @return array
	 */
	public function get_export_data_for_posts( $post_ids ) {
		_deprecated_function( __METHOD__, 'package-5.1.0', 'Contact_Form_Plugin::get_export_feedback_data()' );
		return $this->get_export_feedback_data( $post_ids );
	}

	/**
	 * Returns an array of [prefixed column name] => [translated column name], used on export.
	 * Prefix indicates the position in which the column will be rendered:
	 * - Negative numbers render BEFORE any form field/value column: -5, -3, -1...
	 * - Positive values render AFTER any form field/value column: 1, 30, 93...
	 *   Mind using high numbering on these ones as the prefix is used on regular inputs: 1_Name, 2_Email, etc
	 *
	 * @deprecated since 5.1.0
	 *
	 * @return array
	 */
	public function get_well_known_column_names() {
		_deprecated_function( __METHOD__, 'package-5.1.0', 'Contact_Form_Plugin::get_export_column_names()' );
		return array(
			'-9_title'         => __( 'Title', 'jetpack-forms' ),
			'-6_source'        => __( 'Source', 'jetpack-forms' ),
			'-3_response_date' => __( 'Response Date', 'jetpack-forms' ),
			'90_consent'       => _x( 'Consent', 'noun', 'jetpack-forms' ),
			'93_ip_address'    => __( 'IP Address', 'jetpack-forms' ),
		);
	}

	/**
	 * Extracts feedback entries based on POST data.
	 */
	public function get_feedback_entries_from_post() {
		if ( empty( $_POST['feedback_export_nonce_csv'] ) && empty( $_POST['feedback_export_nonce_gdrive'] ) ) {
			return;
		} elseif ( ! empty( $_POST['feedback_export_nonce_csv'] ) ) {
			check_admin_referer( 'feedback_export', 'feedback_export_nonce_csv' );
		} elseif ( ! empty( $_POST['feedback_export_nonce_gdrive'] ) ) {
			check_admin_referer( 'feedback_export', 'feedback_export_nonce_gdrive' );
		}

		if ( ! current_user_can( 'export' ) ) {
			return;
		}

		$args = array(
			'posts_per_page'   => -1,
			'post_type'        => 'feedback',
			'post_status'      => array( 'publish', 'draft' ),
			'order'            => 'ASC',
			'fields'           => 'ids',
			'suppress_filters' => false,
			'date_query'       => array(),
		);

		// Check if we want to download all the feedbacks or just a certain contact form
		if ( ! empty( $_POST['post'] ) && $_POST['post'] !== 'all' ) {
			$args['post_parent'] = (int) $_POST['post'];
		}

		if ( ! empty( $_POST['status'] ) && in_array( $_POST['status'], array( 'spam', 'trash' ), true ) ) {
			$args['post_status'] = sanitize_text_field( wp_unslash( $_POST['status'] ) );
		}

		if ( ! empty( $_POST['search'] ) ) {
			$args['s'] = sanitize_text_field( wp_unslash( $_POST['search'] ) );
		}

		// TODO: We can remove this when the wp-admin UI is removed.
		if ( ! empty( $_POST['year'] ) && intval( $_POST['year'] ) > 0 ) {
			$args['date_query']['year'] = intval( $_POST['year'] );
		}
		// TODO: We can remove this when the wp-admin UI is removed.
		if ( ! empty( $_POST['month'] ) && intval( $_POST['month'] ) > 0 ) {
			$args['date_query']['month'] = intval( $_POST['month'] );
		}

		if ( ! empty( $_POST['after'] ) && ! empty( $_POST['before'] ) ) {
			$before = strtotime( sanitize_text_field( wp_unslash( $_POST['before'] ) ) );
			$after  = strtotime( sanitize_text_field( wp_unslash( $_POST['after'] ) ) );
			if ( $before && $after && $before < $after ) {
				$args['date_query']['after']  = $after;
				$args['date_query']['before'] = $before;
			}
		}

		if ( ! empty( $_POST['selected'] ) && is_array( $_POST['selected'] ) ) {
			$args['include'] = array_filter(
				array_map(
					function ( $selected ) {
						return intval( $selected );
					},
					$_POST['selected'] // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
				)
			);
		}

		$feedbacks = get_posts( $args );

		return $this->get_export_feedback_data( $feedbacks );
	}

	/**
	 * Download exported data as CSV
	 */
	public function download_feedback_as_csv() {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verification is done on get_feedback_entries_from_post function
		$post_data = wp_unslash( $_POST );
		$data      = $this->get_feedback_entries_from_post();

		if ( empty( $data ) ) {
			return;
		}

		// Check if we want to download all the feedbacks or just a certain contact form
		if ( ! empty( $post_data['post'] ) && $post_data['post'] !== 'all' ) {
			$filename = sprintf(
				'%s - %s.csv',
				Util::get_export_filename( get_the_title( (int) $post_data['post'] ) ),
				gmdate( 'Y-m-d H:i' )
			);
		} else {
			$filename = sprintf(
				'%s - %s.csv',
				Util::get_export_filename(),
				gmdate( 'Y-m-d H:i' )
			);
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
		// @todo When we drop support for PHP <7.4, consider passing empty-string for `$escape` here for better spec compatibility.
		fputcsv( $output, $fields, ',', '"', '\\' );

		/**
		 * Print rows to the output.
		 */
		for ( $i = 0; $i < $row_count; $i++ ) {

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
			// @todo When we drop support for PHP <7.4, consider passing empty-string for `$escape` here for better spec compatibility.
			fputcsv( $output, $current_row, ',', '"', '\\' );
		}

		fclose( $output ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose

		$this->record_tracks_event( 'forms_export_responses', array( 'format' => 'csv' ) );
		exit( 0 );
	}

	/**
	 * Create a new page with a Form block
	 */
	public function create_new_form() {
		if ( ! isset( $_POST['newFormNonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['newFormNonce'] ) ), 'create_new_form' ) ) {
			wp_send_json_error(
				__( 'Invalid nonce', 'jetpack-forms' ),
				403
			);
		}

		if ( ! current_user_can( 'edit_pages' ) ) {
			wp_send_json_error(
				__( 'You do not have permission to create pages', 'jetpack-forms' ),
				403
			);
		}

		$pattern_name = isset( $_POST['pattern'] ) ? sanitize_text_field( wp_unslash( $_POST['pattern'] ) ) : null;

		if ( $pattern_name && WP_Block_Patterns_Registry::get_instance()->is_registered( $pattern_name ) ) {
			$pattern         = WP_Block_Patterns_Registry::get_instance()->get_registered( $pattern_name );
			$pattern_content = $pattern['content'];
		}

		// If no pattern found or specified, use a default form block
		if ( empty( $pattern_content ) ) {
			$pattern_content = '<!-- wp:jetpack/contact-form -->
														<div class="wp-block-jetpack-contact-form"></div>
													<!-- /wp:jetpack/contact-form -->';
		}

		$post_id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_title'   => esc_html__( 'Jetpack Forms', 'jetpack-forms' ),
				'post_content' => $pattern_content,
			)
		);

		if ( is_wp_error( $post_id ) ) {
			wp_send_json_error(
				$post_id->get_error_message(),
				500
			);
		} else {
			wp_send_json(
				array(
					'post_url' => admin_url( 'post.php?post=' . intval( $post_id ) . '&action=edit' ),
				)
			);
		}
	}

	/**
	 * Send an event to Tracks
	 *
	 * @param string $event_name - the name of the event.
	 * @param array  $event_props - event properties to send.
	 *
	 * @return null|void
	 */
	public function record_tracks_event( $event_name, $event_props ) {
		/*
		 * Event details.
		 */
		$event_user = wp_get_current_user();

		/*
		 * Record event.
		 * We use different libs on wpcom and Jetpack.
		 */
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$event_name             = 'wpcom_' . $event_name;
			$event_props['blog_id'] = get_current_blog_id();
			// logged out visitor, record event with blog owner.
			if ( empty( $event_user->ID ) ) {
				$event_user_id = wpcom_get_blog_owner( $event_props['blog_id'] );
				$event_user    = get_userdata( $event_user_id );
			}

			require_lib( 'tracks/client' );
			tracks_record_event( $event_user, $event_name, $event_props );
		} else {
			$user_connected = ( new \Automattic\Jetpack\Connection\Manager( 'jetpack-forms' ) )->is_user_connected( get_current_user_id() );
			if ( ! $user_connected ) {
				return;
			}
			// logged out visitor, record event with Jetpack master user.
			if ( empty( $event_user->ID ) ) {
				$master_user_id = Jetpack_Options::get_option( 'master_user' );
				if ( ! empty( $master_user_id ) ) {
					$event_user = get_userdata( $master_user_id );
				}
			}

			$tracking = new Tracking();
			$tracking->record_user_event( $event_name, $event_props, $event_user );
		}
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
	 * @param string $field - the CSV field.
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
	 * Returns an array of parent post IDs for the user.
	 * The parent posts are those posts where forms have been published.
	 *
	 * @param array $query_args A WP_Query compatible array of query args.
	 *
	 * @return array The array of post IDs
	 */
	public static function get_all_parent_post_ids( $query_args = array() ) {
		$default_query_args = array(
			'fields'           => 'id=>parent',
			'posts_per_page'   => 100000, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page
			'post_type'        => 'feedback',
			'post_status'      => 'publish',
			'suppress_filters' => false,
		);
		$args               = array_merge( $default_query_args, $query_args );
		// Get the feedbacks' parents' post IDs
		$feedbacks = get_posts( $args );
		return array_values( array_unique( array_values( $feedbacks ) ) );
	}

	/**
	 * Returns a string of HTML <option> items from an array of posts
	 *
	 * @param int $selected_id Currently selected post ID.
	 * @return string a string of HTML <option> items
	 */
	protected static function get_feedbacks_as_options( $selected_id = 0 ) {
		$options    = '';
		$parent_ids = self::get_all_parent_post_ids();

		// creates the string of <option> elements
		foreach ( $parent_ids as $parent_id ) {
			$parent_url = get_permalink( $parent_id );
			$parsed_url = wp_parse_url( $parent_url );

			$options .= sprintf(
				'<option value="%s" %s>/%s</option>',
				esc_attr( $parent_id ),
				$selected_id === $parent_id ? 'selected' : '',
				esc_html( basename( $parsed_url['path'] ) )
			);
		}

		return $options;
	}

	/**
	 * Get the names of all the form's fields
	 *
	 * @param array|int $posts the post we want the fields of.
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

	/**
	 * Returns if the feedback post has JSON data
	 *
	 * @param int $post_id The feedback post ID to check.
	 * @return bool
	 */
	public function has_json_data( $post_id ) {
		$post_content = get_post_field( 'post_content', $post_id );
		$content      = explode( "\nJSON_DATA", $post_content );
		if ( empty( $content[1] ) ) {
			return false;
		}
		$json_data = json_decode( $content[1], true );
		return is_array( $json_data ) && ! empty( $json_data );
	}

	/**
	 * Helper function to parse the post content.
	 *
	 * @param string $post_content The post content to parse.
	 * @return array Parsed fields.
	 *
	 * @codeCoverageIgnore - No need to be covered.
	 * @deprecated since 5.3.0
	 */
	public static function parse_feedback_content( $post_content ) {
		$all_values = array();

		$content = explode( '<!--more-->', $post_content );
		$lines   = array();

		if ( count( $content ) > 1 ) {
			$content = str_ireplace( array( '<br />', ')</p>' ), '', $content[1] );
			if ( str_contains( $content, 'JSON_DATA' ) ) {
				$chunks     = explode( "\nJSON_DATA", $content );
				$all_values = json_decode( $chunks[1], true );
				if ( $all_values === null ) {
					// If JSON decoding fails, try to decode the second try with stripslashes and trim.
					// This is a workaround for some cases where the JSON data is not properly formatted.
					$all_values = json_decode( stripslashes( trim( $chunks[1] ) ), true );
				}
				$lines = array_filter( explode( "\n", $chunks[0] ) );
			} else {
				$fields_array = preg_replace( '/.*Array\s\( (.*)\)/msx', '$1', $content );

				// This line of code is used to parse a string containing key-value pairs formatted as [Key] => Value and extract the keys and values into an array.
				// The regular expression ensures that each key-value pair is correctly identified and captured.
				// Given an input string
				// [Key1] => Value1
				// [Key2] => Value2
				// it  $matches[1]: The keys (e.g., Key1, Key2 ).
				// and $matches[2]: The values (e.g., Value1, Value2 ).
				preg_match_all( '/^\s*\[([^\]]+)\] =\&gt\; (.*)(?=^\s*(\[[^\]]+\] =\&gt\;)|\z)/msU', $fields_array, $matches );

				if ( count( $matches ) > 1 ) {
					$all_values = array_combine( array_map( 'trim', $matches[1] ), array_map( 'trim', $matches[2] ) );
				}

				$lines = array_filter( explode( "\n", $content ) );
			}
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
		// All fields should always be an array, even if empty.
		if ( ! is_array( $all_values ) ) {
			$all_values = array();
		}
		$fields['_feedback_all_fields'] = array();
		foreach ( $all_values as $key => $value ) {
			$fields['_feedback_all_fields'][ wp_strip_all_tags( $key ) ] = $value;
		}

		return $fields;
	}

	/**
	 * Parse the contact form fields.
	 *
	 * @param int $post_id - the post ID.
	 * @return array Fields.
	 */
	public static function parse_fields_from_content( $post_id ) {
		$response = Feedback::get( $post_id );

		if ( $response instanceof Feedback ) {
			return $response->get_all_legacy_values();
		}

		return array();
	}

	/**
	 * Creates a valid csv row from a post id
	 *
	 * @param int   $post_id The id of the post.
	 * @param array $fields  An array containing the names of all the fields of the csv.
	 *
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
		$row_items   = array();
		$row_items[] = $content_fields['_feedback_subject'];

		// Loop the fields array in order to fill the $row_items array correctly
		foreach ( $fields as $field ) {
			if ( $field === __( 'Contact Form', 'jetpack-forms' ) ) { // the first field will ever be the contact form, so we can continue
				continue;
			} elseif ( array_key_exists( $field, $all_fields ) ) {
				$row_items[] = $all_fields[ $field ];
			} else {
				$row_items[] = '';
			}
		}

		return $row_items;
	}

	/**
	 * Get the IP address.
	 *
	 * @return string|null IP address.
	 */
	public static function get_ip_address() {
		return isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : null;
	}

	/**
	 * Disable Block Editor for feedbacks.
	 *
	 * @param bool   $can_edit Whether the post type can be edited or not.
	 * @param string $post_type The post type being checked.
	 * @return bool
	 */
	public function use_block_editor_for_post_type( $can_edit, $post_type ) {
		return 'feedback' === $post_type ? false : $can_edit;
	}

	/**
	 * Kludge method: reverses the output of a standard print_r( $array ).
	 * Sort of what unserialize does to a serialized object.
	 * This is here while we work on a better data storage inside the posts. See:
	 * - p1675781140892129-slack-C01CSBEN0QZ
	 * - https://www.php.net/manual/en/function.print-r.php#93529
	 *
	 * @param string $print_r_output The array string to be reverted. Needs to being with 'Array'.
	 * @param bool   $parse_html Whether to run html_entity_decode on each line.
	 *                           As strings are stored right now, they are all escaped, so '=>' are '&gt;'.
	 * @return array|string Array when successfully reconstructed, string otherwise. Output will always be esc_html'd.
	 */
	public static function reverse_that_print( $print_r_output, $parse_html = false ) {
		$lines = explode( "\n", trim( $print_r_output ) );
		if ( $parse_html ) {
			$lines = array_map( 'html_entity_decode', $lines );
		}

		if ( trim( $lines[0] ) !== 'Array' ) {
			// bottomed out to something that isn't an array, escape it and be done
			return esc_html( $print_r_output );
		} else {
			// this is an array, lets parse it
			if ( preg_match( '/(\s{5,})\(/', $lines[1], $match ) ) {
				// this is a tested array/recursive call to this function
				// take a set of spaces off the beginning
				$spaces        = $match[1];
				$spaces_length = strlen( $spaces );
				$lines_total   = count( $lines );

				for ( $i = 0; $i < $lines_total; $i++ ) {
					if ( substr( $lines[ $i ], 0, $spaces_length ) === $spaces ) {
						$lines[ $i ] = substr( $lines[ $i ], $spaces_length );
					}
				}
			}

			array_shift( $lines ); // Array
			array_shift( $lines ); // (
			array_pop( $lines ); // )
			$print_r_output = implode( "\n", $lines );

			// make sure we only match stuff with 4 preceding spaces (stuff for this array and not a nested one
			preg_match_all( '/^\s{4}\[(.+?)\] \=\> /m', $print_r_output, $matches, PREG_OFFSET_CAPTURE | PREG_SET_ORDER );

			$pos          = array();
			$previous_key = '';
			$in_length    = strlen( $print_r_output );

			// store the following in $pos:
			// array with key = key of the parsed array's item
			// value = array(start position in $print_r_output, $end position in $print_r_output)
			foreach ( $matches as $match ) {
				$key         = $match[1][0];
				$start       = $match[0][1] + strlen( $match[0][0] );
				$pos[ $key ] = array( $start, $in_length );

				if ( $previous_key !== '' ) {
					$pos[ $previous_key ][1] = $match[0][1] - 1;
				}

				$previous_key = $key;
			}

			$ret = array();

			foreach ( $pos as $key => $where ) {
				// recursively see if the parsed out value is an array too
				$ret[ $key ] = self::reverse_that_print( substr( $print_r_output, $where[0], $where[1] - $where[0] ), $parse_html );
			}

			return $ret;
		}
	}

	/**
	 * Method untrash_feedback_status_handler
	 * wp_untrash_post filter handler.
	 *
	 * @param string $current_status   The status to be set.
	 * @param int    $post_id          The post ID.
	 * @param string $previous_status  The previous status.
	 */
	public function untrash_feedback_status_handler( $current_status, $post_id, $previous_status ) {
		$post = get_post( $post_id );
		if ( 'feedback' === $post->post_type ) {
			if ( in_array( $previous_status, array( 'spam', 'publish' ), true ) ) {
				return $previous_status;
			}
			return 'publish';
		}
		return $current_status;
	}

	/**
	 * Returns whether we are in condition to track and use
	 * analytics functionality like Tracks.
	 *
	 * @return bool Returns true if we can track analytics, else false.
	 */
	public static function can_use_analytics() {
		$is_wpcom               = defined( 'IS_WPCOM' ) && IS_WPCOM;
		$status                 = new Status();
		$connection             = new Connection_Manager();
		$tracking               = new Tracking( 'jetpack', $connection );
		$should_enable_tracking = $tracking->should_enable_tracking( new Terms_Of_Service(), $status );

		return $is_wpcom || $should_enable_tracking;
	}

	/**
	 * Jetpack menu item might have a count badge when there are updates available.
	 * This method parses that information, removes the associated markup and adds it to the response.
	 * Copied verbatim from WPCOM_REST_API_V2_Endpoint_Admin_Menu::prepare_menu_item.
	 *
	 * Also sanitizes the titles from remaining unexpected markup.
	 *
	 * @param string $title Title to parse.
	 * @return array
	 */
	private function parse_menu_item( $title ) {
		$item = array();

		if (
			str_contains( $title, 'count-' )
			&& preg_match( '/<span class=".+\s?count-(\d*).+\s?<\/span><\/span>/', $title, $matches )
		) {

			$count = (int) ( $matches[1] );
			if ( $count > 0 ) {
				// Keep the counter in the item array.
				$item['count'] = $count;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		if (
			str_contains( $title, 'inline-text' )
			&& preg_match( '/<span class="inline-text".+\s?>(.+)<\/span>/', $title, $matches )
		) {

			$text = $matches[1];
			if ( $text ) {
				// Keep the text in the item array.
				$item['inlineText'] = $text;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		if (
			str_contains( $title, 'awaiting-mod' )
			&& preg_match( '/<span class="awaiting-mod">(.+)<\/span>/', $title, $matches )
		) {

			$text = $matches[1];
			if ( $text ) {
				// Keep the text in the item array.
				$item['badge'] = $text;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		// It's important we sanitize the title after parsing data to remove any unexpected markup but keep the content.
		// We are also capitalizing the first letter in case there was a counter (now parsed) in front of the title.
		$item['title'] = ucfirst( wp_strip_all_tags( $title ) );

		return $item;
	}

	/**
	 * Render the rating field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_rating( $atts, $content, $block ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'rating', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Render the slider field.
	 *
	 * @param array    $atts - the block attributes.
	 * @param string   $content - html content.
	 * @param WP_Block $block - the block instance object.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_slider( $atts, $content, $block ) {
		// Get min, max, and default from the parent block's attributes.
		$parent_attrs     = $block->parsed_block['attrs'] ?? array();
		$atts['min']      = isset( $parent_attrs['min'] ) ? $parent_attrs['min'] : 0;
		$atts['max']      = isset( $parent_attrs['max'] ) ? $parent_attrs['max'] : 100;
		$atts['default']  = isset( $parent_attrs['default'] ) ? $parent_attrs['default'] : 0;
		$atts['step']     = isset( $parent_attrs['step'] ) ? $parent_attrs['step'] : 1;
		$atts['minLabel'] = isset( $parent_attrs['minLabel'] ) ? $parent_attrs['minLabel'] : '';
		$atts['maxLabel'] = isset( $parent_attrs['maxLabel'] ) ? $parent_attrs['maxLabel'] : '';

		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'slider', $block );
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Redirect users from the edit-feedback screen to the Jetpack Forms admin page.
	 *
	 * This method is hooked to 'current_screen' and checks if the current screen
	 * is 'edit-feedback'. If so, it redirects the user to admin.php?page=jetpack-forms-admin.
	 *
	 * @since 6.0.0
	 */
	public function redirect_edit_feedback_to_jetpack_forms() {
		// Only proceed if we have a valid screen object
		if ( ! function_exists( 'get_current_screen' ) ) {
			return;
		}

		$screen = get_current_screen();

		// Check if this is the edit-feedback screen
		if ( ! $screen || $screen->id !== 'edit-feedback' ) {
			return;
		}

		// Perform the redirect to the Jetpack Forms admin page
		$redirect_url = admin_url( 'admin.php?page=jetpack-forms-admin' );

		// Use wp_safe_redirect to ensure we're redirecting to a safe location
		wp_safe_redirect( $redirect_url );
		exit;
	}
}

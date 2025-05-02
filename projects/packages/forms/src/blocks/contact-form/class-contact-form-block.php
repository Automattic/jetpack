<?php
/**
 * Contact Form Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Contact_Form;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use Automattic\Jetpack\Forms\Dashboard\Dashboard_View_Switch;
use Automattic\Jetpack\Forms\Jetpack_Forms;
use Automattic\Jetpack\Modules;
use Jetpack;

/**
 * Contact Form block render callback.
 */
class Contact_Form_Block {
	/**
	 * Register the Contact Form block.
	 * We are core block dependent only on whether the jetpack contact form plugin
	 * is active or not. This is allowing us to make it more discoverable
	 * and enable the plugin in one click
	 */
	public static function register_block() {
		/*
		 * The block is available even when the module is not active,
		 * so we can display a nudge to activate the module instead of the block.
		 * However, since non-admins cannot activate modules, we do not display the empty block for them.
		 */
		if ( ! self::can_manage_block() ) {
			return;
		}

		Blocks::jetpack_register_block(
			'jetpack/contact-form',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_form' ),
			)
		);

		add_filter( 'render_block_data', array( __CLASS__, 'find_nested_html_block' ), 10, 3 );
		add_filter( 'render_block_core/html', array( __CLASS__, 'render_wrapped_html_block' ), 10, 2 );
	}

	/**
	 *  Find nested html block that reside in the contact form block.
	 *  We are using this to wrap the html block with div if it is nested inside contact form block. So that the elements render as expected.
	 *
	 *  @param array  $parsed_block - the parsed block.
	 *  @param array  $source_block - the source block.
	 *  @param object $parent_block - the parent WP_Block.
	 *
	 *  @return array
	 */
	public static function find_nested_html_block( $parsed_block, $source_block, $parent_block ) {
		if ( $parsed_block['blockName'] === 'core/html' && isset( $parent_block->parsed_block ) && $parent_block->parsed_block['blockName'] === 'jetpack/contact-form' ) {
			$parsed_block['hasJPFormParent'] = true;
		}
		return $parsed_block;
	}

	/**
	 * Render wrapped html block that is inside the form block with a wrapped div so that the elements render as expected.
	 * The extra div is needed because the form block has a `flex: 0 0 100%;` applied to all the children of the form block.
	 * This cases all the elementes inside the block to render in a single line and make it not possible to add have inline elements.
	 *
	 * @param string $content - the content of the block.
	 * @param array  $parsed_block - the parsed block.
	 *
	 * @return string
	 */
	public static function render_wrapped_html_block( $content, $parsed_block ) {
		if ( ! empty( $parsed_block['hasJPFormParent'] ) ) {
			return '<div>' . $content . '</div>';
		}

		return $content;
	}

	/**
	 * Register the Child blocks of Contact Form
	 * We are registering child blocks only when Contact Form plugin is Active
	 */
	public static function register_child_blocks() {
		// Bail early if the user cannot manage the block.
		if ( ! self::can_manage_block() ) {
			return;
		}

		// Field render methods.
		Blocks::jetpack_register_block(
			'jetpack/field-text',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_text' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-name',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_name' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-email',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_email' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-url',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_url' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-date',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_date' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-telephone',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_telephone' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-textarea',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_textarea' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-checkbox',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_checkbox' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-checkbox-multiple',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_checkbox_multiple' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-option-checkbox',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_option' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-radio',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_radio' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-option-radio',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_option' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-select',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_select' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-consent',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_consent' ),
			)
		);

		Blocks::jetpack_register_block(
			'jetpack/field-number',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_number' ),
			)
		);

		$blocks_variation = apply_filters( 'jetpack_blocks_variation', \Automattic\Jetpack\Constants::get_constant( 'JETPACK_BLOCKS_VARIATION' ) );
		if ( 'beta' === $blocks_variation ) {
			self::register_beta_blocks();
		}
	}

	/**
	 * Register beta blocks
	 */
	private static function register_beta_blocks() {
		Blocks::jetpack_register_block(
			'jetpack/field-file',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_file' ),
				'plan_check'      => apply_filters( 'jetpack_unauth_file_upload_plan_check', true ),
			)
		);

		add_action(
			'jetpack_register_gutenberg_extensions',
			array( __CLASS__, 'set_file_field_extension_available' )
		);
	}

	/**
	 * Set field-file extension available hook handler
	 */
	public static function set_file_field_extension_available() {
		if ( ! apply_filters( 'jetpack_unauth_file_upload_plan_check', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'field-file' );
		}
	}

	/**
	 * Render the gutenblock form.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string
	 */
	public static function gutenblock_render_form( $atts, $content ) {
		// We should not render block if the module is disabled on a site using the Jetpack plugin.
		if ( class_exists( 'Jetpack' ) && ! ( new Modules() )->is_active( 'contact-form' ) ) {
			return '';
		}
		// Render fallback in other contexts than frontend (i.e. feed, emails, API, etc.), unless the form is being submitted.
		if ( ! jetpack_is_frontend() && ! isset( $_POST['contact-form-id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return sprintf(
				'<div class="%1$s"><a href="%2$s" target="_blank" rel="noopener noreferrer">%3$s</a></div>',
				esc_attr( Blocks::classes( 'contact-form', $atts ) ),
				esc_url( get_the_permalink() ),
				esc_html__( 'Submit a form.', 'jetpack-forms' )
			);
		}

		self::load_view_scripts();

		return Contact_Form::parse( $atts, do_blocks( $content ) );
	}

	/**
	 * Load editor styles for the block.
	 * These are loaded via enqueue_block_assets to ensure proper loading in the editor iframe context.
	 */
	public static function load_editor_styles() {

		$handle = 'jp-forms-blocks';

		Assets::register_script(
			$handle,
			'../../../dist/blocks/editor.js',
			__FILE__,
			array(
				'css_path'   => '../../../dist/blocks/editor.css',
				'textdomain' => 'jetpack-forms',
			)
		);
		wp_enqueue_style( 'jp-forms-blocks' );
	}

	/**
	 * Loads scripts
	 */
	public static function load_editor_scripts() {
		// Bail early if the user cannot manage the block.
		if ( ! self::can_manage_block() ) {
			return;
		}

		$handle = 'jp-forms-blocks';

		Assets::register_script(
			$handle,
			'../../../dist/blocks/editor.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-forms',
				'enqueue'    => true,
				// Editor styles are loaded separately, see load_editor_styles().
				'css_path'   => null,
			)
		);

		// Create a Contact_Form instance to get the default values
		$dashboard_view_switch   = new Dashboard_View_Switch();
		$contact_form            = new Contact_Form( array() );
		$defaults                = $contact_form->defaults;
		$admin_url               = $dashboard_view_switch->get_forms_admin_url( 'spam' );
		$akismet_active_with_key = Jetpack::is_akismet_active();
		$akismet_key_url         = admin_url( 'admin.php?page=akismet-key-config' );
		$preferred_view          = $dashboard_view_switch->get_preferred_view();

		$data = array(
			'defaults' => array(
				'to'                   => $defaults['to'],
				'subject'              => $defaults['subject'],
				'formsAdminUrl'        => $admin_url,
				'akismetActiveWithKey' => $akismet_active_with_key,
				'akismetUrl'           => $akismet_key_url,
				'assetsUrl'            => Jetpack_Forms::assets_url(),
				'preferredView'        => $preferred_view,
			),
		);

		wp_add_inline_script( $handle, 'window.jpFormsBlocks = ' . wp_json_encode( $data ) . ';', 'before' );
	}

	/**
	 * Loads scripts
	 */
	public static function load_view_scripts() {
		if ( is_admin() ) {
			// A block's view assets will not be required in wp-admin.
			return;
		}

		Assets::register_script(
			'jp-forms-blocks',
			'../../../dist/blocks/view.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-forms',
				'enqueue'    => true,
			)
		);
	}

	/**
	 * Check if the current user can view the block.
	 * Every user can see it if the Contact Form module is active,
	 * but if it is inactive, only admins can see it.
	 *
	 * This is only useful when the Contact Form package is used within the Jetpack plugin,
	 * where the module logic exists.
	 *
	 * @since 0.49.0
	 *
	 * @return bool
	 */
	public static function can_manage_block() {
		if (
			/**
			 * Allow third-parties to override the form block's visibility.
			 *
			 * @since 0.49.0
			 *
			 * @module contact-form
			 *
			 * @param bool $can_manage_block Whether the current user can manage the block.
			 */
			apply_filters( 'jetpack_contact_form_can_manage_block', false )
		) {
			return true;
		}

		if ( ! class_exists( 'Jetpack' ) ) {
			return true;
		}

		return ( new Modules() )->is_active( 'contact-form' ) || current_user_can( 'jetpack_activate_modules' );
	}
}

<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

use Automattic\Jetpack\Forms\ContactForm\Util;
use Automattic\Jetpack\Forms\Dashboard\Dashboard;
use Automattic\Jetpack\Forms\Dashboard\Dashboard_View_Switch;
/**
 * Understands the Jetpack Forms package.
 */
class Jetpack_Forms {

	const PACKAGE_VERSION = '0.36.0';

	/**
	 * Load the contact form module.
	 */
	public static function load_contact_form() {
		Util::init();

		if ( is_admin() && self::is_feedback_dashboard_enabled() ) {
			$view_switch = new Dashboard_View_Switch();

			$dashboard = new Dashboard( $view_switch );
			$dashboard->init();
		}

		if ( is_admin() && apply_filters_deprecated( 'tmp_grunion_allow_editor_view', array( true ), '0.30.5', '', 'This functionality will be removed in an upcoming version.' ) ) {
			add_action( 'current_screen', '\Automattic\Jetpack\Forms\ContactForm\Editor_View::add_hooks' );
		}

		add_action( 'init', '\Automattic\Jetpack\Forms\ContactForm\Util::register_pattern' );
		add_action( 'init', array( __CLASS__, 'register_post_type' ) );

		add_action( 'rest_api_init', array( new WPCOM_REST_API_V2_Endpoint_Forms(), 'register_rest_routes' ) );
	}

	/**
	 * Get the plugin URL.
	 */
	public static function plugin_url() {
		return plugin_dir_url( __FILE__ );
	}

	/**
	 * Get the assets URL.
	 */
	public static function assets_url() {
		return plugin_dir_url( __DIR__ ) . 'assets';
	}

	/**
	 * Returns true if the feedback dashboard is enabled.
	 *
	 * @return boolean
	 */
	public static function is_feedback_dashboard_enabled() {
		/**
		 * Enable the new Jetpack Forms dashboard.
		 *
		 * @module contact-form
		 * @since 0.3.0
		 *
		 * @param bool false Should the new Jetpack Forms dashboard be enabled? Default to false.
		 */
		return apply_filters( 'jetpack_forms_dashboard_enable', true );
	}

	/**
	 * Registers the jp_forms post type.
	 */
	public static function register_post_type() {

		register_post_type(
			'jp_forms',
			array(
				'labels'                => array(
					'name'                  => _x( 'Jetpack Forms', 'post type general name', 'jetpack-forms' ),
					'singular_name'         => _x( 'Jetpack Form', 'post type singular name', 'jetpack-forms' ),
					'add_new'               => __( 'Add Form', 'jetpack-forms' ),
					'add_new_item'          => __( 'Add Form', 'jetpack-forms' ),
					'new_item'              => __( 'New Form', 'jetpack-forms' ),
					'edit_item'             => __( 'Edit', 'jetpack-forms' ),
					'view_item'             => __( 'View Form', 'jetpack-forms' ),
					'all_items'             => __( 'Forms', 'jetpack-forms' ),
					'search_items'          => __( 'Search Forms', 'jetpack-forms' ),
					'parent_item_colon'     => __( 'Parent Form:', 'jetpack-forms' ),
					'not_found'             => __( 'No Form found.', 'jetpack-forms' ),
					'not_found_in_trash'    => __( 'No Form found in Trash.', 'jetpack-forms' ),
					'archives'              => __( 'Form archives', 'jetpack-forms' ),
					'insert_into_item'      => __( 'Insert into Form', 'jetpack-forms' ),
					'uploaded_to_this_item' => __( 'Uploaded to this Form', 'jetpack-forms' ),
					'filter_items_list'     => __( 'Filter Form list', 'jetpack-forms' ),
					'items_list_navigation' => __( 'Forms list navigation', 'jetpack-forms' ),
					'items_list'            => __( 'Forms list', 'jetpack-forms' ),
				),
				'description'           => __( 'Forms that can be inserted into your site.', 'jetpack-forms' ),
				'public'                => false,
				'has_archive'           => false,
				'show_ui'               => true,
				'show_in_menu'          => true,
				'show_in_admin_bar'     => true,
				'show_in_rest'          => true,
				'rewrite'               => false,
				'template'              => array(
					array(
						'jetpack/contact-form',
						array(
							'lock' => array(
								'move'   => true,
								'remove' => true,
							),
						),
					),
				),
				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				'menu_icon'             => 'data:image/svg+xml;base64,' . base64_encode(
					'<?xml version="1.0" encoding="UTF-8"?><svg aria-hidden="true" context="list-view" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M18 9H13V7.5H18V9Z" clip-rule="evenodd" fill-rule="evenodd"/><path fill="currentColor" d="m18 16.5h-5v-1.5h5v1.5z" clip-rule="evenodd" fill-rule="evenodd"/><path fill="currentColor" d="m9.5 7.5h-2v2h2v-2zm-2-1.5h2c0.8284 0 1.5 0.67157 1.5 1.5v2c0 0.8284-0.6716 1.5-1.5 1.5h-2c-0.82843 0-1.5-0.6716-1.5-1.5v-2c0-0.82843 0.67157-1.5 1.5-1.5z" clip-rule="evenodd" fill-rule="evenodd"/><path fill="currentColor" d="m9.5 14.5h-2v2h2v-2zm-2-1.5h2c0.8284 0 1.5 0.6716 1.5 1.5v2c0 0.8284-0.6716 1.5-1.5 1.5h-2c-0.82843 0-1.5-0.6716-1.5-1.5v-2c0-0.8284 0.67157-1.5 1.5-1.5z" clip-rule="evenodd" fill-rule="evenodd"/><path fill="currentColor" d="m19 4.5h-14c-0.27614 0-0.5 0.22386-0.5 0.5v14c0 0.2761 0.22386 0.5 0.5 0.5h14c0.2761 0 0.5-0.2239 0.5-0.5v-14c0-0.27614-0.2239-0.5-0.5-0.5zm-14-1.5c-1.1046 0-2 0.89543-2 2v14c0 1.1046 0.89543 2 2 2h14c1.1046 0 2-0.8954 2-2v-14c0-1.1046-0.8954-2-2-2h-14z" clip-rule="evenodd" fill-rule="evenodd"/></svg>
'
				),
				'map_meta_cap'          => true,
				'capabilities'          => array(
					'edit_others_posts'      => 'edit_theme_options',
					'delete_posts'           => 'edit_theme_options',
					'publish_posts'          => 'edit_theme_options',
					'create_posts'           => 'edit_theme_options',
					'read_private_posts'     => 'edit_theme_options',
					'delete_private_posts'   => 'edit_theme_options',
					'delete_published_posts' => 'edit_theme_options',
					'delete_others_posts'    => 'edit_theme_options',
					'edit_private_posts'     => 'edit_theme_options',
					'edit_published_posts'   => 'edit_theme_options',
					'edit_posts'             => 'edit_theme_options',
				),
				'rest_base'             => 'jp_forms',
				'rest_controller_class' => 'WP_REST_Posts_Controller',
				'supports'              => array(
					'title',
					'editor',
					'revisions',
				),
			)
		);
	}
}

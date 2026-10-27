<?php
/**
 * The custom post type that stores flows.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers `jetpack_flow`: published means enabled, draft means disabled.
 */
class Flow_Post_Type {

	const POST_TYPE = 'jetpack_flow';

	/**
	 * Meta key holding the JSON definition (trigger and steps).
	 */
	const META_DEFINITION = '_jetpack_flow_definition';

	/**
	 * Meta key holding the trigger ID, so enabled flows can be queried by trigger.
	 */
	const META_TRIGGER = '_jetpack_flow_trigger';

	/**
	 * Meta key holding the secret token of a flow's inbound event URL.
	 */
	const META_TOKEN = '_jetpack_flow_inbound_token';

	/**
	 * Hook registration.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
	}

	/**
	 * Register the post type. Not public: flows are only managed through the Flow dashboard.
	 *
	 * @return void
	 */
	public static function register() {
		register_post_type(
			self::POST_TYPE,
			array(
				'label'               => __( 'Flows', 'jetpack-flow-pkg' ),
				'public'              => false,
				'show_ui'             => false,
				'show_in_rest'        => false,
				'exclude_from_search' => true,
				'supports'            => array( 'title' ),
				'rewrite'             => false,
				'query_var'           => false,
				'capabilities'        => array(
					'edit_post'          => 'manage_options',
					'read_post'          => 'manage_options',
					'delete_post'        => 'manage_options',
					'edit_posts'         => 'manage_options',
					'edit_others_posts'  => 'manage_options',
					'delete_posts'       => 'manage_options',
					'publish_posts'      => 'manage_options',
					'read_private_posts' => 'manage_options',
				),
			)
		);
	}
}

<?php
/**
 * Marketplace webhook response endpoint.
 *
 * @package endpoints
 */

/**
 * Marketplace_Webhook_Response class.
 */
class Marketplace_Webhook_Response extends WP_REST_Controller {

	/**
	 * Namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'wpcomsh/v1';

	/**
	 * Rest base.
	 *
	 * @var string
	 */
	protected $rest_base = 'marketplace/license';

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'args' => array(
					'event_type'  => array(
						'description' => 'Subscription event type.',
						'type'        => 'string',
						'enum'        => array(
							'subscription_cancelled',
							'subscription_created',
							'subscription_domain_changed',
							'subscription_refunded',
							'subscription_renewed',
						),
						'required'    => true,
					),
					'plugin_slug' => array(
						'description' => 'Slug of the plugin for which webhook was called for.',
						'required'    => true,
						'type'        => 'string',
					),
					'payload'     => array(
						'description' => 'Arbitrary webhook response data.',
						'required'    => true,
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Checks if a given request has access to create items.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool True if the request has access, false otherwise.
	 */
	public function create_item_permissions_check( $request ) { //phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundInExtendedClass
		return method_exists( 'Automattic\Jetpack\Connection\Manager', 'verify_xml_rpc_signature' ) && ( new Automattic\Jetpack\Connection\Manager() )->verify_xml_rpc_signature();
	}

	/**
	 * Creates one item from the collection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public function create_item( $request ) {
		$params = $request->get_json_params();

		/**
		 * Fires when the site receives a response from a marketplace plugin webhook request.
		 *
		 * @param mixed  $payload     Arbitrary webhook response data.
		 * @param string $event_type  Subscription event type.
		 * @param string $plugin_slug Plugin slug.
		 */
		do_action( 'wpcom_marketplace_webhook_response', $params['payload'], $params['event_type'], $params['plugin_slug'] );
	}
}

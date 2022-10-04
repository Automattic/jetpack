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
					'event_type'   => array(
						'description' => 'Subscription event type.',
						'type'        => 'string',
						'enum'        => array(
							'provision_license',
							'subscription_cancelled',
							'subscription_created',
							'subscription_domain_changed',
							'subscription_refunded',
							'subscription_renewed',
						),
						'required'    => true,
					),
					'product_slug' => array(
						'description' => 'Slug of the product for which webhook was called for.',
						'required'    => true,
						'pattern'     => '[\w\-]+',
						'type'        => 'string',
					),
					'payload'      => array(
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
	 * Runs a filter and passes licensing payload to enable vendors to set their license.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error WP_REST_Response on success, WP_Error on failure.
	 */
	public function create_item( $request ) {
		$params = $request->get_json_params();

		/**
		 * Fires when the site receives a response from a marketplace product webhook request.
		 *
		 * @param bool|WP_Error $result     Result to return. True on success, WP_Error on failure.
		 * @param mixed         $payload    Arbitrary webhook response data.
		 * @param string        $event_type Subscription event type.
		 */
		$result = apply_filters( 'wpcom_marketplace_webhook_response_' . $params['product_slug'], true, $params['payload'], $params['event_type'] );

		return rest_ensure_response( $result );
	}
}

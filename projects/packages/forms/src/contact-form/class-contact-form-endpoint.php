<?php
/**
 * Contact_Form_Endpoint class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Class Contact_Form_Endpoint
 * Used as 'rest_controller_class' parameter when 'feedback' post type is
 * registered in \Automattic\Jetpack\Forms\ContactForm\Contact_Form.
 */
class Contact_Form_Endpoint extends \WP_REST_Posts_Controller {
	/**
	 * Registers the REST routes.
	 *
	 * @access public
	 */
	public function register_routes() {
		parent::register_routes();
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/filters',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_filters' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/integration-status/(?P<slug>[\w-]+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_integration_status' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'slug' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $param ) {
							return preg_match( '/^[\w-]+$/', $param );
						},
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/bulk_actions',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'bulk_actions' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'action'   => array(
						'type'     => 'string',
						'enum'     => array(
							'mark_as_spam',
							'mark_as_not_spam',
						),
						'required' => true,
					),
					'post_ids' => array(
						'type'     => 'array',
						'items'    => array( 'type' => 'integer' ),
						'required' => true,
					),
				),
			)
		);

		// Register the file endpoint route
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/files',
			array(
				'methods'                 => \WP_REST_Server::READABLE,
				'callback'                => array( $this, 'get_file' ),
				'permission_callback'     => array( $this, 'get_file_permissions_check' ),
				'args'                    => array(
					'file_id'    => array(
						'required'          => true,
						'validate_callback' => function ( $param ) {
							if ( empty( $param ) ) {
								return new WP_Error(
									'missing_file_id',
									esc_html__( 'File ID is required.', 'jetpack-forms' ),
									array( 'status' => 400 )
								);
							}
							return true;
						},
					),
					'file_nonce' => array(
						'required'          => true,
						'validate_callback' => function ( $file_nonce, $request ) {
							$file_id = $request->get_param( 'file_id' );
							if ( ! wp_verify_nonce( $file_nonce, 'jetpack_forms_view_file_' . $file_id ) ) {
								return new WP_Error(
									'rest_forbidden',
									esc_html__( 'Invalid or missing file access token.', 'jetpack-forms' ),
									array( 'status' => 403 )
								);
							}
							return true;
						},
					),
				),
				'requires_authentication' => true,
			)
		);
	}

	/**
	 * Retrieves all distinct sources (posts) and all the distinct available dates that
	 * any feedback was received, in order to be used as filters in the list.
	 *
	 * @return WP_REST_Response Response object on success.
	 */
	public function get_filters() {
		// TODO: investigate how we can do this better regarding usage of $wpdb
		// performance by querying all the entities, etc..
		global $wpdb;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$months = $wpdb->get_results(
			"SELECT DISTINCT YEAR( post_date ) AS year, MONTH( post_date ) AS month
			FROM $wpdb->posts
			WHERE post_type = 'feedback'
			ORDER BY post_date DESC"
		);
		// phpcs:enable
		$source_ids = Contact_Form_Plugin::get_all_parent_post_ids(
			array_diff_key( array( 'post_status' => array( 'draft', 'publish', 'spam', 'trash' ) ), array( 'post_parent' => '' ) )
		);
		return rest_ensure_response(
			array(
				'date'   => array_map(
					static function ( $row ) {
						return array(
							'month' => (int) $row->month,
							'year'  => (int) $row->year,
						);
					},
					$months
				),
				'source' => array_map(
					static function ( $post_id ) {
						return array(
							'id'    => $post_id,
							'title' => get_the_title( $post_id ),
							'url'   => get_permalink( $post_id ),
						);
					},
					$source_ids
				),
			)
		);
	}

	/**
	 * Adds the additional fields to the item's schema.
	 *
	 * @return array Item schema as an array.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['parent'] = array(
			'description' => __( 'The ID for the parent of the post. This refers to the post/page where the feedback was created.', 'jetpack-forms' ),
			'type'        => 'integer',
			'context'     => array( 'view', 'edit', 'embed' ),
			'readonly'    => true,
		);

		$schema['properties']['uid'] = array(
			'description' => __( 'Unique identifier for the form response.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['author_name'] = array(
			'description' => __( 'The name of the person who submitted the form.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['author_email'] = array(
			'description' => __( 'The email address of the person who submitted the form.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['author_url'] = array(
			'description' => __( 'The website URL of the person who submitted the form.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['author_avatar'] = array(
			'description' => __( 'The URL of the avatar image for the person who submitted the form.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['email_marketing_consent'] = array(
			'description' => __( 'Whether the person consented to email marketing when submitting the form.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['ip'] = array(
			'description' => __( 'The IP address from which the form was submitted.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['entry_title'] = array(
			'description' => __( 'The title of the page or post where the form was submitted.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['entry_permalink'] = array(
			'description' => __( 'The URL of the page or post where the form was submitted.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['subject'] = array(
			'description' => __( 'The subject line of the form submission.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['fields'] = array(
			'description' => __( 'The custom form fields and their submitted values.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Prepares the item for the REST response.
	 *
	 * @param object          $item    WP Cron event.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object on success.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );
		$data     = $response->get_data();
		$fields   = $this->get_fields_for_response( $request );

		$base_fields   = array(
			'email_marketing_consent' => '',
			'entry_title'             => '',
			'entry_permalink'         => '',
			'feedback_id'             => '',
		);
		$data_defaults = array(
			'_feedback_author'       => '',
			'_feedback_author_email' => '',
			'_feedback_author_url'   => '',
			'_feedback_all_fields'   => array(),
			'_feedback_ip'           => '',
			'_feedback_subject'      => '',
		);

		$feedback_data = array_merge(
			$data_defaults,
			\Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::parse_fields_from_content( $item->ID )
		);

		$all_fields = array_merge( $base_fields, $feedback_data['_feedback_all_fields'] );

		$data['date'] = get_the_date( 'c', $data['id'] );
		if ( rest_is_field_included( 'uid', $fields ) ) {
			$data['uid'] = $all_fields['feedback_id'];
		}
		if ( rest_is_field_included( 'author_name', $fields ) ) {
			$data['author_name'] = $feedback_data['_feedback_author'];
		}
		if ( rest_is_field_included( 'author_email', $fields ) ) {
			$data['author_email'] = $feedback_data['_feedback_author_email'];
		}
		if ( rest_is_field_included( 'author_url', $fields ) ) {
			$data['author_url'] = $feedback_data['_feedback_author_url'];
		}
		if ( rest_is_field_included( 'author_avatar', $fields ) ) {
			$data['author_avatar'] = empty( $feedback_data['_feedback_author_email'] ) ? '' : get_avatar_url( $feedback_data['_feedback_author_email'] );
		}
		if ( rest_is_field_included( 'email_marketing_consent', $fields ) ) {
			$data['email_marketing_consent'] = $all_fields['email_marketing_consent'];
		}
		if ( rest_is_field_included( 'ip', $fields ) ) {
			$data['ip'] = $feedback_data['_feedback_ip'];
		}
		if ( rest_is_field_included( 'entry_title', $fields ) ) {
			$data['entry_title'] = $all_fields['entry_title'];
		}
		if ( rest_is_field_included( 'entry_permalink', $fields ) ) {
			$data['entry_permalink'] = $all_fields['entry_permalink'];
		}
		if ( rest_is_field_included( 'subject', $fields ) ) {
			$data['subject'] = $feedback_data['_feedback_subject'];
		}
		if ( rest_is_field_included( 'fields', $fields ) ) {
			$data['fields'] = array_diff_key(
				$all_fields,
				$base_fields
			);
		}
		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves the query params for the feedback collection.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		// Add parent related query parameters since the `feedback` post type is not hierarchical, but
		// it uses the `parent` field to store the ID of the post/page where the feedback was created.
		$query_params['parent']         = array(
			'description' => __( 'Limit result set to items with particular parent IDs.', 'jetpack-forms' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);
		$query_params['parent_exclude'] = array(
			'description' => __( 'Limit result set to all items except those of a particular parent ID.', 'jetpack-forms' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);
		return $query_params;
	}

	/**
	 * Handles bulk actions for Jetpack Forms responses.
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return WP_REST_Response A response object..
	 */
	public function bulk_actions( $request ) {
		$action   = $request->get_param( 'action' );
		$post_ids = $request->get_param( 'post_ids' );

		if ( $action && ! is_array( $post_ids ) ) {
			return new WP_REST_Response( array( 'error' => __( 'Bad request', 'jetpack-forms' ) ), 400 );
		}

		switch ( $action ) {
			case 'mark_as_spam':
				return $this->bulk_action_mark_as_spam( $post_ids );

			case 'mark_as_not_spam':
				return $this->bulk_action_mark_as_not_spam( $post_ids );

			default:
				return new WP_REST_Response( array( 'error' => __( 'Bad request', 'jetpack-forms' ) ), 400 );
		}
	}

	/**
	 * Performs the Akismet action to mark all feedback posts matching the given IDs as spam.
	 *
	 * @param  array $post_ids Array of post IDs.
	 * @return WP_REST_Response
	 */
	private function bulk_action_mark_as_spam( $post_ids ) {
		foreach ( $post_ids as $post_id ) {
			/** This action is documented in \Automattic\Jetpack\Forms\ContactForm\Admin */
			do_action(
				'contact_form_akismet',
				'spam',
				get_post_meta( $post_id, '_feedback_akismet_values', true )
			);
		}
		return new WP_REST_Response( array(), 200 );
	}

	/**
	 * Performs the Akismet action to mark all feedback posts matching the given IDs as not spam.
	 *
	 * @param  array $post_ids Array of post IDs.
	 * @return WP_REST_Response
	 */
	private function bulk_action_mark_as_not_spam( $post_ids ) {
		foreach ( $post_ids as $post_id ) {
			/** This action is documented in \Automattic\Jetpack\Forms\ContactForm\Admin */
			do_action(
				'contact_form_akismet',
				'ham',
				get_post_meta( $post_id, '_feedback_akismet_values', true )
			);
		}
		return new WP_REST_Response( array(), 200 );
	}

	/**
	 * Check whether a given request has proper authorization to view feedback items.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|boolean
	 */
	public function get_items_permissions_check( $request ) { //phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'edit_pages' ) ) {
			return false;
		}
		if ( ! is_user_member_of_blog( get_current_user_id(), get_current_blog_id() ) ) {
			return new WP_Error(
				'rest_cannot_view',
				esc_html__( 'Sorry, you cannot view this resource.', 'jetpack-forms' ),
				array( 'status' => 401 )
			);
		}

		return true;
	}

	/**
	 * Check whether a given request has proper authorization to view feedback item.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|boolean
	 */
	public function get_item_permissions_check( $request ) { //phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'edit_pages' ) ) {
			return false;
		}
		if ( ! is_user_member_of_blog( get_current_user_id(), get_current_blog_id() ) ) {
			return new WP_Error(
				'rest_cannot_view',
				esc_html__( 'Sorry, you cannot view this resource.', 'jetpack-forms' ),
				array( 'status' => 401 )
			);
		}

		return true;
	}

	/**
	 * Checks if the current user has permission to view files.
	 *
	 * @return true|\WP_Error True if the user has permission, WP_Error otherwise.
	 */
	public function get_file_permissions_check() {
		// Verify the user is logged in with appropriate capabilities
		if ( ! current_user_can( 'edit_pages' ) ) {
			return new WP_Error(
				'rest_forbidden',
				esc_html__( 'You must be logged in with appropriate permissions to view this file.', 'jetpack-forms' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Retrieves a file using the file_id and serves it to the client.
	 *
	 * @param \WP_REST_Request $request The current request object.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_file( $request ) {
		$file_id = $request->get_param( 'file_id' );

		// Create dummy content that includes the file ID for testing
		$dummy_content = sprintf(
			"This is a test file.\nRequested File ID: %s\nThis is a dummy response for testing the file download endpoint.",
			esc_html( $file_id )
		);

		return new \WP_REST_Response(
			$dummy_content,
			200,
			array(
				'Content-Type'              => 'text/plain',
				'Content-Disposition'       => 'attachment; filename="test-file.txt"',
				'Content-Length'            => strlen( $dummy_content ),
				'Content-Transfer-Encoding' => 'binary',
				'X-Robots-Tag'              => 'noindex',
				'Cache-Control'             => 'no-cache, must-revalidate, max-age=0',
			)
		);
	}

	/**
	 * Get the status of a forms integration.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_integration_status( WP_REST_Request $request ) {
		$slug = $request->get_param( 'slug' );

		switch ( $slug ) {
			case 'akismet':
				return $this->get_akismet_status();

			case 'creative-mail':
			case 'jetpack-crm':
				return $this->get_plugin_status( $slug );

			default:
				return new WP_Error(
					'invalid_integration',
					/* translators: %s: integration slug */
					sprintf( __( 'Unknown integration: %s', 'jetpack-forms' ), $slug )
				);
		}
	}

	/**
	 * Get basic plugin status (installed/active).
	 *
	 * @param string $plugin_slug The plugin slug (e.g. 'akismet' or 'creative-mail').
	 * @return WP_REST_Response Plugin status data.
	 */
	private function get_plugin_status( $plugin_slug ) {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$plugin_files = array(
			'akismet'       => 'akismet/akismet.php',
			'creative-mail' => 'creative-mail-by-constant-contact/creative-mail-by-constant-contact.php',
			'jetpack-crm'   => 'zero-bs-crm/ZeroBSCRM.php',
		);

		$plugin_file = $plugin_files[ $plugin_slug ] ?? '';
		if ( empty( $plugin_file ) ) {
			return rest_ensure_response(
				array(
					'type'        => 'plugin',
					'isInstalled' => false,
					'isActive'    => false,
					/* translators: %s: plugin slug */
					'error'       => sprintf( __( 'Unknown plugin: %s', 'jetpack-forms' ), $plugin_slug ),
				)
			);
		}

		$installed_plugins = get_plugins();
		$is_installed      = isset( $installed_plugins[ $plugin_file ] );
		$is_active         = is_plugin_active( $plugin_file );

		return rest_ensure_response(
			array(
				'type'        => 'plugin',
				'isInstalled' => $is_installed,
				'isActive'    => $is_active,
			)
		);
	}

	/**
	 * Get Akismet plugin status including key configuration.
	 *
	 * @return WP_REST_Response Response object.
	 */
	public function get_akismet_status() {
		$plugin_status = $this->get_plugin_status( 'akismet' );
		$status_data   = $plugin_status->get_data();

		return rest_ensure_response(
			array_merge(
				$status_data,
				array(
					'isConnected'      => class_exists( 'Jetpack' ) && \Jetpack::is_akismet_active(),
					'configurationUrl' => admin_url( 'admin.php?page=akismet-key-config' ),
				)
			)
		);
	}
}

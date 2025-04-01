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
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'get_file' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
				'args'                => array(
					'file_id' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'post_id' => array(
						'required'          => true,
						'type'              => 'integer',
					),
					'field_id' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
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
			'type'        => 'object',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'properties'  => array(
				'files' => array(
					'type'       => 'object',
					'properties' => array(
						'field_id' => array(
							'type'        => 'string',
							'arg_options' => array(
								'sanitize_callback' => 'sanitize_text_field',
							),
						),
						'files'    => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'file_id' => array(
										'type'        => 'string',
										'arg_options' => array(
											'sanitize_callback' => 'sanitize_text_field',
										),
									),
									'name'    => array(
										'type'        => 'string',
										'arg_options' => array(
											'sanitize_callback' => 'sanitize_text_field',
										),
									),
									'size'    => array(
										'type'        => 'integer',
										'arg_options' => array(
											'sanitize_callback' => 'absint',
										),
									),
									'url'     => array(
										'type'        => 'string',
										'arg_options' => array(
											'sanitize_callback' => 'esc_url_raw',
										),
									),
								),
							),
						),
					),
				),
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
			$fields_data = array_diff_key( $all_fields, $base_fields );

			// Add file URLs to file fields
			require_once dirname( __DIR__ ) . '/class-file-handler.php';
			$file_handler = new \Automattic\Jetpack\Forms\File_Handler();
			foreach ( $fields_data as $key => &$field ) {
				if ( \Automattic\Jetpack\Forms\ContactForm\Contact_Form::is_file_upload_field( $field ) ) {
					foreach ( $field['files'] as &$file ) {
						$url = $file_handler->get_file_url( $field['field_id'], $file['file_id'], $item->ID );
						// Add credentials parameter to URL
						$url = add_query_arg( array(
							'credentials' => 'include',
						), $url );
						$file['url'] = $url;
					}
				}
			}

			$data['fields'] = $fields_data;
		}
		return rest_ensure_response( $data );
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
		l( 'get_item_permissions_check user', get_current_user_id() );
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
	 * Retrieves a file using the file_id and serves it to the client.
	 *
	 * @param \WP_REST_Request $request The current request object.
	 *
	 * @return \WP_REST_Response|\WP_Error Response object or error.
	 */
	public function get_file( $request ) {
		$file_id  = $request->get_param( 'file_id' );
		$post_id  = $request->get_param( 'post_id' );
		$field_id = $request->get_param( 'field_id' );

		$fields = \Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::parse_fields_from_content( $post_id );

		// Find the file in the fields
		$file = false;
		foreach ( $fields['_feedback_all_fields'] as $field ) {
			if ( isset( $field['field_id'] ) && $field['field_id'] === $field_id ) {
				foreach ( $field['files'] as $_file ) {
					if ( $_file['file_id'] === $file_id ) {
						$file = $_file;
						break 2;
					}
				}
			}
		}

		if ( ! $file ) {
			return new WP_Error(
				'file_not_found',
				esc_html__( 'The requested file could not be found.', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		$file_path = $file['path'];
		$file_name = $file['name'];

		// Verify file exists and is readable
		if ( ! file_exists( $file_path ) || ! is_readable( $file_path ) ) {
			return new WP_Error(
				'file_not_accessible',
				esc_html__( 'The file cannot be accessed.', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		// Get file type and mime type
		$file_type = wp_check_filetype( $file_path );
		$mime_type = $file_type['type'];

		if ( empty( $mime_type ) ) {
			return new WP_Error(
				'unknown_file_type',
				esc_html__( 'Unable to determine the file type.', 'jetpack-forms' ),
				array( 'status' => 415 )
			);
		}

		// Set up WordPress filesystem
		require_once ABSPATH . 'wp-admin/includes/file.php';
		WP_Filesystem();
		global $wp_filesystem;

		// Get file content
		$file_content = $wp_filesystem->get_contents( $file_path );
		if ( false === $file_content ) {
			return new WP_Error(
				'file_read_error',
				esc_html__( 'Unable to read the file.', 'jetpack-forms' ),
				array( 'status' => 500 )
			);
		}

		// Clean output buffer
		if ( ob_get_length() ) {
			ob_clean();
		}

		// Set up response headers
		$valid_headers = array(
			'content-type',
			'content-length',
			'content-disposition',
		);

		$headers = array(
			'content-type'              => $mime_type,
			'content-disposition'       => 'inline; filename="' . sanitize_file_name( $file_name ) . '"',
			'content-length'            => $wp_filesystem->size( $file_path ),
			'content-transfer-encoding' => 'binary',
			'x-robots-tag'             => 'noindex',
			'accept-ranges'            => 'bytes',
			'cache-control'            => 'no-cache, must-revalidate, max-age=0',
			'pragma'                   => 'no-cache',
			'expires'                  => '0',
		);

		// Set content headers
		foreach ( $valid_headers as $header ) {
			if ( ! empty( $headers[ $header ] ) ) {
				header( ucwords( $header, '-' ) . ': ' . $headers[ $header ] );
			}
		}

		// Set cache headers
		header( 'Cache-Control: no-cache, no-store, must-revalidate' );
		header( 'Pragma: no-cache' );
		header( 'Expires: 0' );

		// Output file content and exit
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Media binary data
		echo $file_content;
		exit;
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

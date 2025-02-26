<?php
/**
 * The Forms Rest Controller class.
 * Registers the REST routes for Jetpack Forms (taken from stats-admin).
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Handles the REST routes for Form Responses, aka Feedback.
 */
class WPCOM_REST_API_V2_Endpoint_Forms extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'forms';

		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Registers the REST routes.
	 *
	 * @access public
	 */
	public function register_rest_routes() {
		// Stats for single resource type.

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/responses',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_responses' ),
				'permission_callback' => array( $this, 'get_responses_permission_check' ),
				'args'                => array(
					'limit'   => array(
						'default'  => 20,
						'type'     => 'integer',
						'required' => false,
						'minimum'  => 1,
					),
					'offset'  => array(
						'default'  => 0,
						'type'     => 'integer',
						'required' => false,
						'minimum'  => 0,
					),
					'form_id' => array(
						'type'     => 'integer',
						'required' => false,
						'minimum'  => 1,
					),
					'search'  => array(
						'type'     => 'string',
						'required' => false,
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/responses/bulk_actions',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'bulk_actions' ),
				'permission_callback' => array( $this, 'get_responses_permission_check' ),
			)
		);

		// Register the file endpoint route
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/files',
			array(
				'methods'                 => WP_REST_Server::READABLE,
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
	 * Returns Jetpack Forms responses.
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return WP_REST_Response A response object containing Jetpack Forms responses.
	 */
	public function get_responses( $request ) {
		$args = array(
			'post_type'   => 'feedback',
			'post_status' => array( 'publish', 'draft' ),
		);

		if ( isset( $request['parent_id'] ) ) {
			$args['post_parent'] = $request['parent_id'];
		}

		if ( isset( $request['month'] ) ) {
			$args['m'] = $request['month'];
		}

		if ( isset( $request['limit'] ) ) {
			$args['posts_per_page'] = $request['limit'];
		}

		if ( isset( $request['offset'] ) ) {
			$args['offset'] = $request['offset'];
		}

		if ( isset( $request['search'] ) ) {
			$args['s'] = $request['search'];
		}

		$filter_args = array_merge(
			$args,
			array( 'post_status' => array( 'draft', 'publish', 'spam', 'trash' ) )
		);

		$current_query = 'inbox';
		if ( isset( $request['status'] ) && in_array( $request['status'], array( 'spam', 'trash' ), true ) ) {
			$current_query = $request['status'];
		}

		$query = array(
			'inbox' => new \WP_Query(
				array_merge(
					$args,
					array(
						'post_status'    => array( 'draft', 'publish' ),
						'posts_per_page' => $current_query === 'inbox' ? $args['posts_per_page'] : -1,
					)
				)
			),
			'spam'  => new \WP_Query(
				array_merge(
					$args,
					array(
						'post_status'    => array( 'spam' ),
						'posts_per_page' => $current_query === 'spam' ? $args['posts_per_page'] : -1,
					)
				)
			),
			'trash' => new \WP_Query(
				array_merge(
					$args,
					array(
						'post_status'    => array( 'trash' ),
						'posts_per_page' => $current_query === 'trash' ? $args['posts_per_page'] : -1,
					)
				)
			),
		);

		$source_ids = Contact_Form_Plugin::get_all_parent_post_ids(
			array_diff_key( $filter_args, array( 'post_parent' => '' ) )
		);

		$base_fields   = Contact_Form_Plugin::NON_PRINTABLE_FIELDS;
		$data_defaults = array(
			'_feedback_author'       => '',
			'_feedback_author_email' => '',
			'_feedback_author_url'   => '',
			'_feedback_all_fields'   => array(),
			'_feedback_ip'           => '',
			'_feedback_subject'      => '',
		);

		$responses = array_map(
			function ( $response ) use ( $base_fields, $data_defaults ) {
				$data = array_merge(
					$data_defaults,
					\Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::parse_fields_from_content( $response->ID )
				);

				$all_fields = array_merge( $base_fields, $data['_feedback_all_fields'] );
				return array(
					'id'                      => $response->ID,
					'uid'                     => $all_fields['feedback_id'],
					'date'                    => get_the_date( 'c', $response ),
					'author_name'             => $data['_feedback_author'],
					'author_email'            => $data['_feedback_author_email'],
					'author_url'              => $data['_feedback_author_url'],
					'author_avatar'           => empty( $data['_feedback_author_email'] ) ? '' : get_avatar_url( $data['_feedback_author_email'] ),
					'email_marketing_consent' => $all_fields['email_marketing_consent'],
					'ip'                      => $data['_feedback_ip'],
					'entry_title'             => $all_fields['entry_title'],
					'entry_permalink'         => $all_fields['entry_permalink'],
					'subject'                 => $data['_feedback_subject'],
					'fields'                  => array_diff_key(
						$all_fields,
						$base_fields
					),
				);
			},
			$query[ $current_query ]->posts
		);

		return rest_ensure_response(
			array(
				'responses'         => $responses,
				'totals'            => array_map(
					function ( $subquery ) {
						return $subquery->found_posts;
					},
					$query
				),
				'filters_available' => array(
					'month'  => $this->get_months_filter_for_query( $filter_args ),
					'source' => array_map(
						function ( $post_id ) {
							return array(
								'id'    => $post_id,
								'title' => get_the_title( $post_id ),
								'url'   => get_permalink( $post_id ),
							);
						},
						$source_ids
					),
				),
			)
		);
	}

	/**
	 * Returns a list of months which can be used to filter the given query.
	 *
	 * @param array $query Query.
	 *
	 * @return array List of months.
	 */
	private function get_months_filter_for_query( $query ) {
		global $wpdb;

		$filters = '';

		if ( isset( $query['post_parent'] ) ) {
			$filters = $wpdb->prepare( 'AND post_parent = %d ', $query['post_parent'] );
		}

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$months = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT DISTINCT YEAR( post_date ) AS year, MONTH( post_date ) AS month
				FROM $wpdb->posts
				WHERE post_type = 'feedback'
				$filters
				ORDER BY post_date DESC"
			)
		);
		// phpcs:enable

		return array_map(
			function ( $row ) {
				return array(
					'month' => intval( $row->month ),
					'year'  => intval( $row->year ),
				);
			},
			$months
		);
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
			return new $this->error_response( __( 'Bad request', 'jetpack-forms' ), 400 );
		}

		switch ( $action ) {
			case 'mark_as_spam':
				return $this->bulk_action_mark_as_spam( $post_ids );

			case 'mark_as_not_spam':
				return $this->bulk_action_mark_as_not_spam( $post_ids );

			case 'trash':
				return $this->bulk_action_trash( $post_ids );

			case 'untrash':
				return $this->bulk_action_untrash( $post_ids );

			case 'delete':
				return $this->bulk_action_delete_forever( $post_ids );

			default:
				return $this->error_response( __( 'Bad request', 'jetpack-forms' ), 400 );
		}
	}

	/**
	 * Verifies that the current user has the requird capability for viewing form responses.
	 *
	 * @return true|WP_Error Returns true if the user has the required capability, else a WP_Error object.
	 */
	public function get_responses_permission_check() {
		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( ! current_user_can( 'edit_pages' ) ) {
			return new WP_Error(
				'invalid_user_permission_jetpack_form_responses',
				'unauthorized',
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Marks all feedback posts matchin the given IDs as spam.
	 *
	 * @param  array $post_ids Array of post IDs.
	 * @return WP_REST_Response
	 */
	private function bulk_action_mark_as_spam( $post_ids ) {
		foreach ( $post_ids as $post_id ) {
			$post = get_post( $post_id );
			if ( $post->post_type !== 'feedback' ) {
				continue;
			}
			$status = wp_update_post(
				array(
					'ID'          => $post_id,
					'post_status' => 'spam',
				),
				false,
				false
			);

			if ( ! $status || is_wp_error( $status ) ) {
				return $this->error_response(
					sprintf(
						/* translators: %s: Post ID */
						__( 'Failed to mark post as spam. Post ID: %d.', 'jetpack-forms' ),
						$post_id
					),
					500
				);
			}

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
	 * Marks all feedback posts matchin the given IDs as not spam.
	 *
	 * @param  array $post_ids Array of post IDs.
	 * @return WP_REST_Response
	 */
	private function bulk_action_mark_as_not_spam( $post_ids ) {
		foreach ( $post_ids as $post_id ) {
			$post = get_post( $post_id );
			if ( $post->post_type !== 'feedback' ) {
				continue;
			}
			$status = wp_update_post(
				array(
					'ID'          => $post_id,
					'post_status' => 'publish',
				),
				false,
				false
			);

			if ( ! $status || is_wp_error( $status ) ) {
				return $this->error_response(
					sprintf(
						/* translators: %s: Post ID */
						__( 'Failed to mark post as not-spam. Post ID: %d.', 'jetpack-forms' ),
						$post_id
					),
					500
				);
			}

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
	 * Moves all feedback posts matchin the given IDs to trash.
	 *
	 * @param  array $post_ids Array of post IDs.
	 * @return WP_REST_Response
	 */
	private function bulk_action_trash( $post_ids ) {
		foreach ( $post_ids as $post_id ) {
			if ( ! wp_trash_post( $post_id ) ) {
				return $this->error_response(
					sprintf(
						/* translators: %s: Post ID */
						__( 'Failed to move post to trash. Post ID: %d.', 'jetpack-forms' ),
						$post_id
					),
					500
				);
			}
		}

		return new WP_REST_Response( array(), 200 );
	}

	/**
	 * Removes all feedback posts matchin the given IDs from trash.
	 *
	 * @param  array $post_ids Array of post IDs.
	 * @return WP_REST_Response
	 */
	private function bulk_action_untrash( $post_ids ) {
		foreach ( $post_ids as $post_id ) {
			if ( ! wp_untrash_post( $post_id ) ) {
				return $this->error_response(
					sprintf(
						/* translators: %s: Post ID */
						__( 'Failed to remove post from trash. Post ID: %d.', 'jetpack-forms' ),
						$post_id
					),
					500
				);
			}
		}

		return new WP_REST_Response( array(), 200 );
	}

	/**
	 * Deletes all feedback posts matchin the given IDs.
	 *
	 * @param  array $post_ids Array of post IDs.
	 * @return WP_REST_Response
	 */
	private function bulk_action_delete_forever( $post_ids ) {
		foreach ( $post_ids as $post_id ) {
			if ( ! wp_delete_post( $post_id ) ) {
				return $this->error_response(
					sprintf(
						/* translators: %s: Post ID */
						__( 'Failed to delete post. Post ID: %d.', 'jetpack-forms' ),
						$post_id
					),
					500
				);
			}
		}

		return new WP_REST_Response( array(), 200 );
	}

	/**
	 * Returns a WP_REST_Response containing the given error message and code.
	 *
	 * @param  string $message Error message.
	 * @param  int    $code    Error code.
	 * @return WP_REST_Response
	 */
	private function error_response( $message, $code ) {
		return new WP_REST_Response( array( 'error' => $message ), $code );
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
	 * @return \WP_REST_Response|\WP_Error Response object or error.
	 */
	public function get_file( $request ) {
		$file_id = $request->get_param( 'file_id' );

		require_once __DIR__ . '/contact-form/class-file-handler.php';
		$file_handler = new File_Handler();
		$file_path    = $file_handler->get_file_path( $file_id );

		require_once ABSPATH . 'wp-admin/includes/file.php';
		WP_Filesystem();
		global $wp_filesystem;

		if ( empty( $file_path ) || ! $wp_filesystem->exists( $file_path ) ) {
			return new WP_Error(
				'file_not_found',
				esc_html__( 'The requested file does not exist.', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		$file_type = wp_check_filetype( $file_path );
		$mime_type = $file_type['type'];

		if ( empty( $mime_type ) ) {
			// Return an error if we can't determine the mime type
			return new WP_Error(
				'unknown_file_type',
				esc_html__( 'Unable to determine the file type. The file cannot be served.', 'jetpack-forms' ),
				array( 'status' => 415 )
			);
		}

		$file_content = $wp_filesystem->get_contents( $file_path );
		$file_size    = $wp_filesystem->size( $file_path );
		$file_name    = wp_basename( $file_path );

		// Set up file-specific headers
		$headers = array(
			'Content-Type'              => $mime_type,
			'Content-Disposition'       => 'inline; filename="' . $file_name . '"',
			'Content-Length'            => $file_size,
			'Content-Transfer-Encoding' => 'binary',
			'X-Robots-Tag'              => 'noindex',
		);

		// Use WordPress core function for cache control headers
		nocache_headers();

		// Clear previous output buffers
		while ( ob_get_level() ) {
			ob_end_clean();
		}

		// Set file-specific headers
		foreach ( $headers as $name => $value ) {
			header( "{$name}: {$value}" );
		}

		// Output file content and exit
		echo $file_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- File contents should not be escaped
		exit;
	}

	/**
	 * Get the mime type of a file.
	 *
	 * @param string $file_path Path to the file.
	 * @return string The mime type.
	 *
	 * @deprecated $$next-version$$ Use wp_check_filetype() instead
	 */
	protected function get_file_mime_type( $file_path ) {
		$mime_type = mime_content_type( $file_path );
		if ( false === $mime_type ) {
			// Fallback to a generic mime type
			$mime_type = 'image/' . substr( $file_path, strrpos( $file_path, '.' ) + 1 );

		}
		return $mime_type;
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( 'Automattic\Jetpack\Forms\WPCOM_REST_API_V2_Endpoint_Forms' );
}

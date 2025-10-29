<?php
/**
 * Contact_Form_Endpoint class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\External_Connections;
use Automattic\Jetpack\Forms\Dashboard\Dashboard as Forms_Dashboard;
use Automattic\Jetpack\Forms\Jetpack_Forms;
use Automattic\Jetpack\Forms\Service\Google_Drive;
use Automattic\Jetpack\Forms\Service\MailPoet_Integration;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use WP_Error;
use WP_Query;
use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Contact_Form_Endpoint
 * Used as 'rest_controller_class' parameter when 'feedback' post type is
 * registered in \Automattic\Jetpack\Forms\ContactForm\Contact_Form.
 */
class Contact_Form_Endpoint extends \WP_REST_Posts_Controller {

	/**
	 * Get filtered list of supported integrations
	 *
	 * @return array Filtered list of supported integrations
	 */
	private function get_supported_integrations() {
		$supported_integrations = array(
			'akismet'      => array(
				'type'                    => 'plugin',
				'file'                    => 'akismet/akismet.php',
				'settings_url'            => 'admin.php?page=akismet-key-config',
				'marketing_redirect_slug' => 'org-spam',
				'title'                   => __( 'Akismet Spam Protection', 'jetpack-forms' ),
				'subtitle'                => __( 'Akismet filters out form spam with 99% accuracy', 'jetpack-forms' ),
				// Overriding this may automatically enable/disable the integration when editing a form.
				'enabled_by_default'      => false,
			),
			'zero-bs-crm'  => array(
				'type'                    => 'plugin',
				'file'                    => 'zero-bs-crm/ZeroBSCRM.php',
				'settings_url'            => 'admin.php?page=zerobscrm-plugin-settings',
				'marketing_redirect_slug' => 'org-crm',
				'title'                   => __( 'Jetpack CRM', 'jetpack-forms' ),
				'subtitle'                => __( 'Store contact form submissions in your CRM', 'jetpack-forms' ),
				// Overriding this may automatically enable/disable the integration when editing a form.
				'enabled_by_default'      => false,
			),
			'salesforce'   => array(
				'type'                    => 'service',
				'file'                    => null,
				'settings_url'            => null,
				'marketing_redirect_slug' => null,
				'title'                   => __( 'Salesforce', 'jetpack-forms' ),
				'subtitle'                => __( 'Send form contacts to Salesforce', 'jetpack-forms' ),
				// Overriding this may automatically enable/disable the integration when editing a form.
				'enabled_by_default'      => false,
			),
			'google-drive' => array(
				'type'                    => 'service',
				'file'                    => null,
				'settings_url'            => null,
				'marketing_redirect_slug' => null,
				'title'                   => __( 'Google Sheets', 'jetpack-forms' ),
				'subtitle'                => __( 'Export form responses to Google Sheets.', 'jetpack-forms' ),
				// Overriding this may automatically enable/disable the integration when editing a form.
				'enabled_by_default'      => false,
			),
			'mailpoet'     => array(
				'type'                    => 'plugin',
				'file'                    => 'mailpoet/mailpoet.php',
				'settings_url'            => 'admin.php?page=mailpoet-homepage',
				'marketing_redirect_slug' => 'org-mailpoet',
				'title'                   => __( 'MailPoet email marketing', 'jetpack-forms' ),
				'subtitle'                => __( 'Send newsletters and marketing emails directly from your site.', 'jetpack-forms' ),
				// Overriding this may automatically enable/disable the integration when editing a form.
				'enabled_by_default'      => false,
			),
		);

		// Conditionally add Hostinger Reach integration behind feature flag.
		if ( Jetpack_Forms::is_hostinger_reach_enabled() ) {
			$supported_integrations['hostinger-reach'] = array(
				'type'                    => 'plugin',
				'file'                    => 'hostinger-reach/hostinger-reach.php',
				'settings_url'            => 'admin.php?page=hostinger-reach#/home',
				'marketing_redirect_slug' => 'hostinger-reach',
				'title'                   => __( 'Hostinger Reach', 'jetpack-forms' ),
				'subtitle'                => __( 'Send newsletters and marketing emails via Hostinger Reach.', 'jetpack-forms' ),
				// Overriding this may automatically enable/disable the integration when editing a form.
				'enabled_by_default'      => false,
			);
		}

		/**
		 * Filters the list of supported integrations available in Jetpack Forms.
		 *
		 * Use this filter to add, modify, or remove integrations. Removing an
		 * integration here will prevent it from being returned by the REST
		 * integrations endpoints and from being displayed in the UI.
		 *
		 * @since 6.4.0
		 *
		 * @param array $integrations Associative array of integration configurations keyed by slug.
		 *                            Each configuration supports the following keys:
		 *                            - type (string)                  : 'plugin' or 'service'.
		 *                            - file (string|null)             : Plugin file path for plugins; null for services.
		 *                            - settings_url (string|null)     : Relative admin URL for settings, or null.
		 *                            - marketing_redirect_slug (string|null) : Redirect slug for marketing links, or null.
		 *                            - title (string)                 : Default UI title for the integration.
		 *                            - subtitle (string)              : Default UI subtitle/description for the integration.
		 */
		return apply_filters( 'jetpack_forms_supported_integrations', $supported_integrations );
	}

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

		// Register integrations routes
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/integrations',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_all_integrations_status' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'version' => array(
						'type'              => 'integer',
						'default'           => 1,
						'sanitize_callback' => 'absint',
						'validate_callback' => function ( $param ) {
							$version = absint( $param );
							return in_array( $version, array( 1, 2 ), true );
						},
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/integrations-metadata',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_integrations_metadata' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/integrations/(?P<slug>[\w-]+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_single_integration_status' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'slug' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $param ) {
							return isset( $this->get_supported_integrations()[ $param ] );
						},
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/integrations/(?P<slug>[\w-]+)',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'disable_integration' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'slug' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $param ) {
							return isset( $this->get_supported_integrations()[ $param ] );
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

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/trash',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_posts_by_status' ),
				'permission_callback' => array( $this, 'delete_items_permissions_check' ),
				'args'                => array(
					'status' => array(
						'type'     => 'string',
						'enum'     => array( 'trash', 'spam' ),
						'required' => false,
						'default'  => 'trash',
					),
				),
			)
		);

		// Forms config endpoint.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/config',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'callback'            => array( $this, 'get_forms_config' ),
			)
		);

		// Mark feedback as read/unread endpoint.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/(?P<id>\d+)/read',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'update_read_status' ),
				'permission_callback' => array( $this, 'update_item_permissions_check' ),
				'args'                => array(
					'id'        => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
					'is_unread' => array(
						'type'              => 'boolean',
						'required'          => true,
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
				),
			)
		);

		// Get optimized status counts.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/counts',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'callback'            => array( $this, 'get_status_counts' ),
				'args'                => array(
					'search'    => array(
						'description'       => 'Limit results to those matching a string.',
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => 'rest_validate_request_arg',
					),
					'parent'    => array(
						'description'       => 'Limit results to those of a specific parent ID.',
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
						'validate_callback' => 'rest_validate_request_arg',
					),
					'before'    => array(
						'description'       => 'Limit results to feedback published before a given ISO8601 compliant date.',
						'type'              => 'string',
						'format'            => 'date-time',
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => 'rest_validate_request_arg',
					),
					'after'     => array(
						'description'       => 'Limit results to feedback published after a given ISO8601 compliant date.',
						'type'              => 'string',
						'format'            => 'date-time',
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => 'rest_validate_request_arg',
					),
					'is_unread' => array(
						'description'       => 'Limit results to read or unread feedback items.',
						'type'              => 'boolean',
						'sanitize_callback' => 'rest_sanitize_boolean',
						'validate_callback' => 'rest_validate_request_arg',
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
	 * Retrieves status counts for inbox, spam, and trash.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response Response object on success.
	 */
	public function get_status_counts( $request ) {
		global $wpdb;

		$search    = $request->get_param( 'search' );
		$parent    = $request->get_param( 'parent' );
		$before    = $request->get_param( 'before' );
		$after     = $request->get_param( 'after' );
		$is_unread = $request->get_param( 'is_unread' );

		$where_conditions = array( $wpdb->prepare( 'post_type = %s', 'feedback' ) );

		if ( ! empty( $search ) ) {
			$search_like        = '%' . $wpdb->esc_like( $search ) . '%';
			$where_conditions[] = $wpdb->prepare( '(post_title LIKE %s OR post_content LIKE %s)', $search_like, $search_like );
		}

		if ( ! empty( $parent ) ) {
			$where_conditions[] = $wpdb->prepare( 'post_parent = %d', $parent );
		}

		if ( ! empty( $before ) ) {
			$where_conditions[] = $wpdb->prepare( 'post_date <= %s', $before );
		}

		if ( ! empty( $after ) ) {
			$where_conditions[] = $wpdb->prepare( 'post_date >= %s', $after );
		}

		if ( null !== $is_unread ) {
			$comment_status     = $is_unread ? Feedback::STATUS_UNREAD : Feedback::STATUS_READ;
			$where_conditions[] = $wpdb->prepare( 'comment_status = %s', $comment_status );
		}

		$where_clause = implode( ' AND ', $where_conditions );

		// Execute single query with CASE statements for all status counts.
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$counts = $wpdb->get_row(
			"SELECT
			SUM(CASE WHEN post_status IN ('publish', 'draft') THEN 1 ELSE 0 END) as inbox,
			SUM(CASE WHEN post_status = 'spam' THEN 1 ELSE 0 END) as spam,
			SUM(CASE WHEN post_status = 'trash' THEN 1 ELSE 0 END) as trash
			FROM $wpdb->posts
			WHERE $where_clause",
			ARRAY_A
		);
		// phpcs:enable

		$result = array(
			'inbox' => (int) ( $counts['inbox'] ?? 0 ),
			'spam'  => (int) ( $counts['spam'] ?? 0 ),
			'trash' => (int) ( $counts['trash'] ?? 0 ),
		);

		return rest_ensure_response( $result );
	}

	/**
	 * Adds the additional fields to the item's schema.
	 *
	 * @return array Item schema as an array.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		// Remove fields that are not relevant to feedback.
		foreach ( array( 'link', 'password', 'template', 'title', 'content', 'excerpt' ) as $key ) {
			if ( isset( $schema['properties'][ $key ] ) ) {
				unset( $schema['properties'][ $key ] );
			}
		}

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

		$schema['properties']['country_code'] = array(
			'description' => __( 'The country code derived from the IP address.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'readonly'    => true,
		);

		$schema['properties']['browser'] = array(
			'description' => __( 'The browser and platform used to submit the form.', 'jetpack-forms' ),
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

		$schema['properties']['edit_form_url'] = array(
			'description' => __( 'The URL to edit the form.', 'jetpack-forms' ),
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
									'file_id'        => array(
										'type'        => 'integer',
										'arg_options' => array(
											'sanitize_callback' => 'sanitize_text_field',
										),
									),
									'name'           => array(
										'type'        => 'string',
										'arg_options' => array(
											'sanitize_callback' => 'sanitize_text_field',
										),
									),
									'size'           => array(
										'type'        => 'string',
										'arg_options' => array(
											'sanitize_callback' => 'sanitize_text_field',
										),
									),
									'url'            => array(
										'type'        => 'string',
										'arg_options' => array(
											'sanitize_callback' => 'esc_url_raw',
										),
									),
									'is_previewable' => array(
										'type'        => 'boolean',
										'arg_options' => array(
											'sanitize_callback' => 'rest_sanitize_boolean',
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

		$schema['properties']['has_file'] = array(
			'description' => __( 'Does the form response contain a file.', 'jetpack-forms' ),
			'type'        => 'boolean',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'booleanval',
			),
			'readonly'    => true,
		);

		$schema['properties']['is_unread'] = array(
			'description' => __( 'Whether the form response is unread.', 'jetpack-forms' ),
			'type'        => 'boolean',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'readonly'    => true,
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Updates the item.
	 * Overrides the parent method to resend the email when the item is updated from spam to publish.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$valid_check = parent::get_post( $request['id'] );
		if ( is_wp_error( $valid_check ) ) {
			return $valid_check;
		}

		$post_id         = $request['id'];
		$previous_status = get_post_status( $post_id );
		$updated_item    = parent::update_item( $request );

		if ( ! is_wp_error( $updated_item ) && ! empty( $updated_item->data && ! empty( $updated_item->data['status'] ) ) ) {
			if ( $previous_status === 'spam' && $updated_item->data['status'] === 'publish' ) {
				// updated item is going from spam to inbox
				$akismet_values = get_post_meta( $post_id, '_feedback_akismet_values', true );
				/** This action is documented in \Automattic\Jetpack\Forms\ContactForm\Admin */
				do_action( 'contact_form_akismet', 'ham', $akismet_values );
				$this->resend_email( $post_id );
			}
		}
		return $updated_item;
	}

	/**
	 * Resends the email for a given post ID.
	 *
	 * @param int $post_id The ID of the post to resend the email for.
	 */
	public function resend_email( $post_id ) {
		$comment_author_email = false;
		$reply_to_addr        = false;
		$message              = '';
		$to                   = false;
		$headers              = false;
		$blog_url             = wp_parse_url( site_url() );

		// resend the original email
		$email = get_post_meta( $post_id, '_feedback_email', true );

		$response = Feedback::get( $post_id );
		if ( ! $response ) {
			return;
		}

		if ( ! empty( $response->get_author_email() ) ) {
			$comment_author_email = $response->get_author_email();
		}

		if ( isset( $email['to'] ) ) {
			$to = $email['to'];
		}

		if ( isset( $email['message'] ) ) {
			$message = $email['message'];
		}

		if ( isset( $email['headers'] ) ) {
			$headers = $email['headers'];
		} else {
			$headers = 'From: "' . $response->get_author() . '" <wordpress@' . $blog_url['host'] . ">\r\n";

			if ( ! empty( $comment_author_email ) ) {
				$reply_to_addr = $comment_author_email;
			} elseif ( is_array( $to ) ) {
				$reply_to_addr = $to[0];
			}

			if ( $reply_to_addr ) {
				$headers .= 'Reply-To: "' . $response->get_author() . '" <' . $reply_to_addr . ">\r\n";
			}

			$headers .= 'Content-Type: text/plain; charset="' . get_option( 'blog_charset' ) . '"';
		}
		Contact_Form::wp_mail( $to, $response->get_subject(), $message, $headers );
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

		$feedback_response = Feedback::get( $item->ID );
		if ( ! $feedback_response ) {
			return rest_ensure_response( $data );
		}

		$data['date'] = get_the_date( 'c', $data['id'] );
		if ( rest_is_field_included( 'uid', $fields ) ) {
			$data['uid'] = $feedback_response->get_feedback_id();
		}
		if ( rest_is_field_included( 'author_name', $fields ) ) {
			$data['author_name'] = $feedback_response->get_author();
		}
		if ( rest_is_field_included( 'author_email', $fields ) ) {
			$data['author_email'] = $feedback_response->get_author_email();
		}
		if ( rest_is_field_included( 'author_url', $fields ) ) {
			$data['author_url'] = $feedback_response->get_author_url();
		}
		if ( rest_is_field_included( 'author_avatar', $fields ) ) {
			$data['author_avatar'] = $feedback_response->get_author_avatar();
		}
		if ( rest_is_field_included( 'email_marketing_consent', $fields ) ) {
			$data['email_marketing_consent'] = $feedback_response->has_consent() ? '1' : '';
		}
		if ( rest_is_field_included( 'ip', $fields ) ) {
			$data['ip'] = $feedback_response->get_ip_address();
		}
		if ( rest_is_field_included( 'country_code', $fields ) ) {
			$data['country_code'] = $feedback_response->get_country_code();
		}
		if ( rest_is_field_included( 'browser', $fields ) ) {
			$data['browser'] = $feedback_response->get_browser();
		}
		if ( rest_is_field_included( 'entry_title', $fields ) ) {
			$data['entry_title'] = $feedback_response->get_entry_title();
		}
		if ( rest_is_field_included( 'entry_permalink', $fields ) ) {
			$data['entry_permalink'] = $feedback_response->get_entry_permalink();
		}
		if ( rest_is_field_included( 'edit_form_url', $fields ) ) {
			$data['edit_form_url'] = $feedback_response->get_edit_form_url();
		}
		if ( rest_is_field_included( 'subject', $fields ) ) {
			$data['subject'] = $feedback_response->get_subject();
		}
		if ( rest_is_field_included( 'fields', $fields ) ) {
			$data['fields'] = $feedback_response->get_compiled_fields( 'api', 'label-value' );
		}

		if ( rest_is_field_included( 'has_file', $fields ) ) {
			$data['has_file'] = $feedback_response->has_file();
		}

		if ( rest_is_field_included( 'is_unread', $fields ) ) {
			$data['is_unread'] = $feedback_response->is_unread();
		}

		$response->set_data( $data );

		return rest_ensure_response( $response );
	}

	/**
	 * Retrieves a collection of feedback items.
	 * Overrides parent to support invalid_ids with OR logic.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$invalid_ids = $request->get_param( 'invalid_ids' );

		// If we have invalid_ids, we need to modify the query with a WHERE clause
		if ( ! empty( $invalid_ids ) ) {
			add_filter( 'posts_where', array( $this, 'modify_query_for_invalid_ids' ), 10, 2 );
			// Store invalid_ids temporarily so the filter can access them
			$this->temp_invalid_ids = $invalid_ids;
		}

		$response = parent::get_items( $request );

		// Clean up
		if ( ! empty( $invalid_ids ) ) {
			remove_filter( 'posts_where', array( $this, 'modify_query_for_invalid_ids' ), 10 );
			unset( $this->temp_invalid_ids );
		}

		return $response;
	}

	/**
	 * Modify the WHERE clause to include invalid_ids with OR logic.
	 *
	 * @param string   $where The WHERE clause.
	 * @param WP_Query $query The WP_Query instance.
	 * @return string Modified WHERE clause.
	 */
	public function modify_query_for_invalid_ids( $where, $query ) {
		global $wpdb;

		// Only modify our feedback queries
		if ( ! isset( $this->temp_invalid_ids ) || empty( $this->temp_invalid_ids ) ) {
			return $where;
		}

		// Only modify if this is a feedback query
		$post_type = $query->get( 'post_type' );
		if ( $post_type !== 'feedback' ) {
			return $where;
		}

		$invalid_ids_sql = implode( ',', array_map( 'absint', $this->temp_invalid_ids ) );

		// Add OR condition for invalid_ids at the end of the WHERE clause
		// Keep the AND at the beginning since WordPress WHERE clauses start with "AND"
		$where .= " OR {$wpdb->posts}.ID IN ({$invalid_ids_sql})";

		return $where;
	}

	/**
	 * Filters the query arguments for the feedback collection.
	 *
	 * @param array           $args    Key value array of query var to query value.
	 * @param WP_REST_Request $request The request used.
	 * @return array Modified query arguments.
	 */
	protected function prepare_items_query( $args = array(), $request = null ) {
		$args = parent::prepare_items_query( $args, $request );

		if ( isset( $request['is_unread'] ) ) {
			$args['comment_status'] = $request['is_unread'] ? Feedback::STATUS_UNREAD : Feedback::STATUS_READ;
		}

		return $args;
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
		$query_params['is_unread']      = array(
			'description'       => __( 'Limit result set to read or unread feedback items.', 'jetpack-forms' ),
			'type'              => 'boolean',
			'sanitize_callback' => 'rest_sanitize_boolean',
			'validate_callback' => 'rest_validate_request_arg',
		);
		$query_params['invalid_ids']    = array(
			'description'       => __( 'List of item IDs to include in results regardless of filters.', 'jetpack-forms' ),
			'type'              => 'array',
			'items'             => array(
				'type' => 'integer',
			),
			'default'           => array(),
			'sanitize_callback' => function ( $param ) {
				return array_map( 'absint', (array) $param );
			},
			'validate_callback' => 'rest_validate_request_arg',
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
	 * Handles emptying Jetpack Forms responses based on status.
	 *
	 * By default, it empties the trash, meaning it will delete all feedbacks in the trash (status = trash).
	 * Passing a status will delete all feedbacks in the status.
	 * The operation is non reversible and thus restricted to statuses spam and trash,
	 * enforced by endpoint query args enum[spam, trash] but also double checked by the endpoint.
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return WP_REST_Response A response object..
	 */
	public function delete_posts_by_status( $request ) { //phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$from_status = $request->get_param( 'status' );

		if ( ! in_array( $from_status, array( 'spam', 'trash' ), true ) ) {
			return new WP_REST_Response( array( 'error' => __( 'Bad request', 'jetpack-forms' ) ), 400 );
		}

		$query_args = array(
			'post_type'      => 'feedback',
			'post_status'    => $from_status ?? 'trash',
			'posts_per_page' => 1000, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page
		);

		$query           = new \WP_Query( $query_args );
		$trash_feedbacks = $query->get_posts();

		$deleted = 0;
		foreach ( (array) $trash_feedbacks as $feedback ) {
			$feedback_deleted = wp_delete_post( $feedback->ID, true );
			if ( ! $feedback_deleted ) {
				if ( $from_status === 'trash' ) {
					return new WP_REST_Response( array( 'error' => __( 'Failed to empty trash.', 'jetpack-forms' ) ), 400 );
				}

				if ( $from_status === 'spam' ) {
					return new WP_REST_Response( array( 'error' => __( 'Failed to empty spam.', 'jetpack-forms' ) ), 400 );
				}
			}
			++$deleted;
		}

		return new WP_REST_Response( array( 'deleted' => $deleted ), 200 );
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
	 * Check whether a given request has proper authorization to view and edit feedback items.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|boolean
	 */
	public function get_items_permissions_check( $request ) { //phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( is_super_admin() ) {
			return true;
		}

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
	 * Check whether a given request has proper authorization to delete feedback items.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|boolean
	 */
	public function delete_items_permissions_check( $request ) { //phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( is_super_admin() ) {
			return true;
		}

		if ( ! current_user_can( 'delete_posts' ) ) {
			return false;
		}

		if ( ! is_user_member_of_blog( get_current_user_id(), get_current_blog_id() ) ) {
			return new WP_Error(
				'rest_user_cannot_delete_post',
				esc_html__( 'Sorry, you cannot delete this resource.', 'jetpack-forms' ),
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
	 * Get static metadata for an integration (without status checks).
	 *
	 * @param string $slug Integration slug.
	 * @param array  $config Integration configuration.
	 * @return array Integration metadata.
	 */
	private function get_integration_metadata_fields( $slug, $config ) {
		$type                    = $config['type'] ?? null;
		$marketing_redirect_slug = $config['marketing_redirect_slug'] ?? null;

		return array(
			'id'               => $slug,
			'slug'             => $slug,
			'type'             => $type,
			'title'            => isset( $config['title'] ) ? sanitize_text_field( $config['title'] ) : '',
			'subtitle'         => isset( $config['subtitle'] ) ? sanitize_text_field( $config['subtitle'] ) : '',
			'marketingUrl'     => $marketing_redirect_slug ? Redirect::get_url( $marketing_redirect_slug ) : null,
			'enabledByDefault' => isset( $config['enabled_by_default'] ) ? (bool) $config['enabled_by_default'] : false,
		);
	}

	/**
	 * Core logic for a single integration
	 *
	 * @param string $slug Integration slug.
	 * @return array Integration status data.
	 */
	private function get_integration( $slug ) {
		$config = $this->get_supported_integrations()[ $slug ];
		$type   = $config['type'] ?? null;

		// Start with metadata fields
		$base = $this->get_integration_metadata_fields( $slug, $config );

		// Add status fields that require checks
		$base['pluginFile']      = ( $type === 'plugin' && ! empty( $config['file'] ) ) ? str_replace( '.php', '', $config['file'] ) : null;
		$base['isInstalled']     = false;
		$base['isActive']        = false;
		$base['needsConnection'] = ( $type === 'service' );
		$base['isConnected']     = false;
		$base['version']         = null;
		$base['settingsUrl']     = null;
		$base['details']         = array();

		// Override base shape based on integration type.
		$status = $type === 'plugin'
			? $this->get_plugin_status( $slug, $base )
			: $this->get_service_status( $slug, $base );

		return $status;
	}

	/**
	 * REST callback for /integrations/{slug}
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public function get_single_integration_status( $request ) {
		$slug         = $request->get_param( 'slug' );
		$integrations = $this->get_supported_integrations();
		if ( ! isset( $integrations[ $slug ] ) ) {
			return new \WP_Error( 'rest_integration_not_found', __( 'Integration not found.', 'jetpack-forms' ), array( 'status' => 404 ) );
		}
		return rest_ensure_response( $this->get_integration( $slug ) );
	}

	/**
	 * REST callback for /integrations
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function get_all_integrations_status( $request ) {
		$version      = absint( $request->get_param( 'version' ) );
		$integrations = array();

		foreach ( $this->get_supported_integrations() as $slug => $config ) {
			$status = $this->get_integration( $slug );
			if ( 1 === $version ) {
				$integrations[ $slug ] = $status;
			} else {
				$integrations[] = $status;
			}
		}

		return rest_ensure_response( $integrations );
	}

	/**
	 * REST callback for /integrations-metadata
	 *
	 * Returns only static metadata (name, description, type, etc.) without making
	 * expensive calls to check connection status or plugin installation status.
	 * This endpoint is designed to be fast and suitable for preloading.
	 *
	 * Uses the same field generation logic as get_integration() to ensure consistency.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function get_integrations_metadata( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$integrations = array();

		foreach ( $this->get_supported_integrations() as $slug => $config ) {
			$integrations[] = $this->get_integration_metadata_fields( $slug, $config );
		}

		return rest_ensure_response( $integrations );
	}

	/**
	 * Get status for internal/service integrations.
	 *
	 * @param string $slug   Service slug.
	 * @param array  $status Base status shape to mutate and return.
	 * @return array Service status data.
	 */
	private function get_service_status( $slug, array $status ) {
		$config = $this->get_supported_integrations()[ $slug ];

		// If a settings redirect slug/url is configured, convert to full URL
		if ( ! empty( $config['settings_url'] ) ) {
			$status['settingsUrl'] = esc_url( Redirect::get_url( $config['settings_url'] ) );
		}

		// Override base shape for specific services.
		switch ( $slug ) {
			case 'google-drive':
				$user_id               = get_current_user_id();
				$jetpack_connected     = ( new Host() )->is_wpcom_simple() || ( new Connection_Manager( 'jetpack-forms' ) )->is_user_connected( $user_id );
				$status['isConnected'] = $jetpack_connected && Google_Drive::has_valid_connection();
				$status['settingsUrl'] = External_Connections::get_connect_url( $slug );
				break;
			case 'salesforce':
				// No overrides needed for now; keep defaults.
				break;
			// Add other service cases as needed.
		}

		return $status;
	}

	/**
	 * Get plugin status.
	 *
	 * @param string $plugin_slug Plugin slug.
	 * @param array  $status      Base status shape to mutate and return.
	 * @return array Plugin status data.
	 */
	private function get_plugin_status( $plugin_slug, array $status ) {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$integrations  = $this->get_supported_integrations();
		$plugin_config = $integrations[ $plugin_slug ];

		$installed_plugins = get_plugins();
		$is_installed      = isset( $installed_plugins[ $plugin_config['file'] ] );
		$is_active         = is_plugin_active( $plugin_config['file'] );

		// Override base shape for all plugins.
		$status['pluginFile']  = str_replace( '.php', '', $plugin_config['file'] );
		$status['isInstalled'] = $is_installed;
		$status['isActive']    = $is_active;
		$status['version']     = $is_installed ? $installed_plugins[ $plugin_config['file'] ]['Version'] : null;
		$status['settingsUrl'] = $is_active ? admin_url( $plugin_config['settings_url'] ) : null;

		// Override base shape for specific plugins.
		switch ( $plugin_slug ) {
			case 'akismet':
				$status['isConnected']                       = class_exists( 'Jetpack' ) && \Jetpack::is_akismet_active();
				$status['details']['formSubmissionsSpamUrl'] = Forms_Dashboard::get_forms_admin_url( 'spam' );
				$status['needsConnection']                   = true;
				break;
			case 'zero-bs-crm':
				if ( $is_active ) {
					$has_extension     = function_exists( 'zeroBSCRM_isExtensionInstalled' ) && zeroBSCRM_isExtensionInstalled( 'jetpackforms' ); // @phan-suppress-current-line PhanUndeclaredFunction -- We're checking the function exists first
					$status['details'] = array(
						'hasExtension'         => $has_extension,
						'canActivateExtension' => current_user_can( 'manage_options' ),
					);
				}
				break;
			case 'mailpoet':
				$status['needsConnection'] = true;
				// Determine if MailPoet setup is complete using the public API.
				if ( class_exists( \MailPoet\API\API::class ) ) { // @phan-suppress-current-line PhanUndeclaredClassReference
					$mailpoet_api = \MailPoet\API\API::MP( 'v1' ); // @phan-suppress-current-line PhanUndeclaredClassMethod
					if ( $mailpoet_api && method_exists( $mailpoet_api, 'isSetupComplete' ) ) {
						$status['isConnected'] = (bool) $mailpoet_api->isSetupComplete();
					}
				}
				// Add MailPoet lists to details
				$status['details']['lists'] = MailPoet_Integration::get_all_lists();
				break;
			case 'hostinger-reach':
				// Hostinger Reach is a plugin that requires additional setup/connection.
				$status['needsConnection'] = true;
				$status['isConnected']     = false;
				// Determine if Hostinger Reach is connected using its public handler.
				if ( $is_active
					// @phan-suppress-next-line PhanUndeclaredClassReference
					&& class_exists( \Hostinger\Reach\Api\Handlers\ReachApiHandler::class )
					// @phan-suppress-next-line PhanUndeclaredClassReference
					&& class_exists( \Hostinger\Reach\Functions::class )
					// @phan-suppress-next-line PhanUndeclaredClassReference
					&& class_exists( \Hostinger\Reach\Api\ApiKeyManager::class )
				) {
					$reach_handler = new \Hostinger\Reach\Api\Handlers\ReachApiHandler( // @phan-suppress-current-line PhanUndeclaredClassMethod
						new \Hostinger\Reach\Functions(), // @phan-suppress-current-line PhanUndeclaredClassMethod
						new \Hostinger\Reach\Api\ApiKeyManager() // @phan-suppress-current-line PhanUndeclaredClassMethod
					);
					if ( method_exists( $reach_handler, 'is_connected' ) ) {
						// @phan-suppress-next-line PhanUndeclaredClassMethod
						$status['isConnected'] = (bool) $reach_handler->is_connected();
					}
				}
				break;
		}

		return $status;
	}

	/**
	 * REST callback for DELETE /integrations/{slug}
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public function disable_integration( $request ) {
		$slug         = $request->get_param( 'slug' );
		$integrations = $this->get_supported_integrations();
		if ( ! isset( $integrations[ $slug ] ) ) {
			return new \WP_Error( 'rest_integration_not_found', __( 'Integration not found.', 'jetpack-forms' ), array( 'status' => 404 ) );
		}
		if ( $slug !== 'google-drive' ) {
			return new \WP_Error( 'rest_integration_invalid', __( 'This integration cannot be disabled.', 'jetpack-forms' ), array( 'status' => 404 ) );
		}
		$is_deleted = External_Connections::delete_connection( $slug );
		return rest_ensure_response( array( 'deleted' => $is_deleted ) );
	}

	/**
	 * Updates the read/unread status of a feedback item.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_read_status( $request ) {
		$post_id   = $request->get_param( 'id' );
		$is_unread = $request->get_param( 'is_unread' );

		$feedback_response = Feedback::get( $post_id );
		if ( ! $feedback_response ) {
			return new WP_Error(
				'rest_post_invalid_id',
				__( 'Invalid feedback ID.', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		$success = $is_unread ? $feedback_response->mark_as_unread() : $feedback_response->mark_as_read();

		Contact_Form_Plugin::recalculate_unread_count();
		if ( ! $success ) {
			return new WP_Error(
				'rest_cannot_update',
				__( 'Failed to update feedback read status.', 'jetpack-forms' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'id'        => $post_id,
				'is_unread' => $feedback_response->is_unread(),
				'count'     => Contact_Form_Plugin::get_unread_count(),
			)
		);
	}

	/**
	 * Return consolidated Forms config payload.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function get_forms_config( WP_REST_Request $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$config = array(
			// From jpFormsBlocks in class-contact-form-block.php.
			'formsResponsesUrl'       => Forms_Dashboard::get_forms_admin_url(),
			'isMailPoetEnabled'       => Jetpack_Forms::is_mailpoet_enabled(),
			'isHostingerReachEnabled' => Jetpack_Forms::is_hostinger_reach_enabled(),
			// From config in class-dashboard.php.
			'blogId'                  => get_current_blog_id(),
			'gdriveConnectSupportURL' => esc_url( Redirect::get_url( 'jetpack-support-contact-form-export' ) ),
			'pluginAssetsURL'         => Jetpack_Forms::assets_url(),
			'siteURL'                 => ( new Status() )->get_site_suffix(),
			'hasFeedback'             => ( new Forms_Dashboard() )->has_feedback(),
			'isIntegrationsEnabled'   => Jetpack_Forms::is_integrations_enabled(),
			'dashboardURL'            => Forms_Dashboard::get_forms_admin_url(),
			// New data.
			'canInstallPlugins'       => current_user_can( 'install_plugins' ),
			'canActivatePlugins'      => current_user_can( 'activate_plugins' ),
			'exportNonce'             => wp_create_nonce( 'feedback_export' ),
			'newFormNonce'            => wp_create_nonce( 'create_new_form' ),
			'emptyTrashDays'          => defined( 'EMPTY_TRASH_DAYS' ) ? EMPTY_TRASH_DAYS : 0,
		);

		return rest_ensure_response( $config );
	}
}

<?php
/**
 * Jetpack CRM Abilities Registration.
 *
 * Registers read-only Jetpack CRM abilities (contacts, deals, invoices) with
 * the WordPress Abilities API so AI agents can browse CRM data through the
 * standard `wp-abilities/v1` REST surface.
 *
 * @package automattic/jetpack-crm
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\CRM\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Registers Jetpack CRM abilities with the WordPress Abilities API.
 *
 * This first cut is read-only: contacts (filtered list + single id),
 * deals (a.k.a. quotes), and invoices. Writes (create/update/delete,
 * add-note) are intentionally deferred — they require a careful
 * design pass on the CRM's DAL3 add/update entry points and aren't
 * part of this PR.
 */
class CRM_Abilities extends Registrar {

	/**
	 * Capability gating read access to CRM admin data.
	 *
	 * The CRM grants `admin_zerobs_customers` to roles that can view the
	 * contacts/customer screens (`administrator`, `zerobs_admin`,
	 * `zerobs_customermgr`). Mirrors the cap used by the legacy admin
	 * pages and the `jpcrm_can_user_manage_contacts()` helper.
	 */
	private const CAP_VIEW_CRM = 'admin_zerobs_customers';

	/**
	 * Hard ceiling on `per_page` for list-shaped reads. Mirrors the
	 * 100-row default the underlying DAL uses but enforces it in the
	 * ability layer too so agents can't ask for more.
	 */
	private const MAX_PER_PAGE = 100;

	/**
	 * Default `per_page` for list-shaped reads when none is supplied.
	 */
	private const DEFAULT_PER_PAGE = 20;

	/**
	 * @inheritDoc
	 */
	public static function get_category_slug(): string {
		return 'jetpack-crm';
	}

	/**
	 * @inheritDoc
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack CRM" is a product name and should not be translated.
			'label'       => 'Jetpack CRM',
			'description' => __( 'Abilities for reading Jetpack CRM contacts, deals, and invoices.', 'zero-bs-crm' ),
		);
	}

	/**
	 * @inheritDoc
	 */
	public static function get_abilities(): array {
		$pagination_properties = array(
			'page'     => array(
				'type'        => 'integer',
				'minimum'     => 1,
				'default'     => 1,
				'description' => __( '1-indexed page of results.', 'zero-bs-crm' ),
			),
			'per_page' => array(
				'type'        => 'integer',
				'minimum'     => 1,
				'maximum'     => self::MAX_PER_PAGE,
				'default'     => self::DEFAULT_PER_PAGE,
				'description' => __( 'Number of results per page. Capped at 100.', 'zero-bs-crm' ),
			),
		);

		$contact_summary_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'                => array( 'type' => 'integer' ),
				'name'              => array( 'type' => 'string' ),
				'email'             => array( 'type' => 'string' ),
				'phone'             => array( 'type' => 'string' ),
				'status'            => array( 'type' => 'string' ),
				'owner'             => array( 'type' => 'integer' ),
				'tags'              => array(
					'type'  => 'array',
					'items' => array( 'type' => 'string' ),
				),
				'created_at'        => array(
					'type'        => array( 'integer', 'null' ),
					'description' => __( 'Unix timestamp when the contact was created.', 'zero-bs-crm' ),
				),
				'last_contacted_at' => array(
					'type'        => array( 'integer', 'null' ),
					'description' => __( 'Unix timestamp of the contact\'s last logged interaction.', 'zero-bs-crm' ),
				),
			),
		);

		$contact_detail_schema = array(
			'type'       => 'object',
			'properties' => array_merge(
				$contact_summary_schema['properties'],
				array(
					'notes'         => array(
						'type'  => 'array',
						'items' => array( 'type' => 'object' ),
					),
					'activity'      => array(
						'type'  => 'array',
						'items' => array( 'type' => 'object' ),
					),
					'custom_fields' => array( 'type' => 'object' ),
				)
			),
		);

		$deal_summary_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'                  => array( 'type' => 'integer' ),
				'title'               => array( 'type' => 'string' ),
				'value'               => array( 'type' => 'number' ),
				'currency'            => array( 'type' => 'string' ),
				'status'              => array( 'type' => 'string' ),
				'contact_id'          => array( 'type' => array( 'integer', 'null' ) ),
				'owner'               => array( 'type' => 'integer' ),
				'created_at'          => array( 'type' => array( 'integer', 'null' ) ),
				'expected_close_date' => array( 'type' => array( 'integer', 'null' ) ),
			),
		);

		$invoice_summary_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'         => array( 'type' => 'integer' ),
				'number'     => array( 'type' => 'string' ),
				'contact_id' => array( 'type' => array( 'integer', 'null' ) ),
				'total'      => array( 'type' => 'number' ),
				'currency'   => array( 'type' => 'string' ),
				'status'     => array( 'type' => 'string' ),
				'due_date'   => array( 'type' => array( 'integer', 'null' ) ),
				'issued_at'  => array( 'type' => array( 'integer', 'null' ) ),
				'paid_at'    => array( 'type' => array( 'integer', 'null' ) ),
			),
		);

		return array(
			'jetpack-crm/list-contacts' => array(
				'label'               => __( 'List CRM contacts', 'zero-bs-crm' ),
				'description'         => __(
					'Return Jetpack CRM contacts as an array of summaries. Combine search/status/contact_id filters to narrow the result. When contact_id is provided, returns at most one element — unknown ids yield an empty array. To fetch a contact with notes, activity, and custom fields, call jetpack-crm/get-contact.',
					'zero-bs-crm'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array_merge(
						array(
							'search'     => array(
								'type'        => 'string',
								'description' => __( 'Case-insensitive substring match against name and email.', 'zero-bs-crm' ),
								'minLength'   => 1,
							),
							'status'     => array(
								'type'        => 'string',
								'description' => __( 'Filter by CRM contact status (e.g. "Lead", "Customer").', 'zero-bs-crm' ),
								'minLength'   => 1,
							),
							'contact_id' => array(
								'type'        => 'integer',
								'minimum'     => 1,
								'description' => __( 'Return a single contact by id. Unknown ids yield an empty array.', 'zero-bs-crm' ),
							),
						),
						$pagination_properties
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $contact_summary_schema,
				),
				'execute_callback'    => array( __CLASS__, 'list_contacts' ),
				'permission_callback' => array( __CLASS__, 'can_view_crm' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-crm/get-contact'   => array(
				'label'               => __( 'Get CRM contact', 'zero-bs-crm' ),
				'description'         => __(
					'Return a single Jetpack CRM contact as a 0- or 1-element array including notes, activity log, and custom fields. Unknown ids yield an empty array, not an error. For paginated browsing or summary fields only, call jetpack-crm/list-contacts.',
					'zero-bs-crm'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'id' ),
					'properties'           => array(
						'id' => array(
							'type'        => 'integer',
							'minimum'     => 1,
							'description' => __( 'Contact id. Unknown ids yield an empty array.', 'zero-bs-crm' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $contact_detail_schema,
				),
				'execute_callback'    => array( __CLASS__, 'get_contact' ),
				'permission_callback' => array( __CLASS__, 'can_view_crm' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-crm/list-deals'    => array(
				'label'               => __( 'List CRM deals', 'zero-bs-crm' ),
				'description'         => __(
					'Return Jetpack CRM deals (quotes) as an array of summaries. Combine status/owner filters to narrow the result. Currency reflects the site\'s base currency.',
					'zero-bs-crm'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array_merge(
						array(
							'status' => array(
								'type'        => 'string',
								'description' => __( 'Filter by deal status (e.g. "Draft", "Sent", "Accepted").', 'zero-bs-crm' ),
								'minLength'   => 1,
							),
							'owner'  => array(
								'type'        => 'integer',
								'minimum'     => 1,
								'description' => __( 'Filter by owner WordPress user id.', 'zero-bs-crm' ),
							),
						),
						$pagination_properties
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $deal_summary_schema,
				),
				'execute_callback'    => array( __CLASS__, 'list_deals' ),
				'permission_callback' => array( __CLASS__, 'can_view_crm' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-crm/list-invoices' => array(
				'label'               => __( 'List CRM invoices', 'zero-bs-crm' ),
				'description'         => __(
					'Return Jetpack CRM invoices as an array of summaries. Combine status filter to narrow by lifecycle state. Currency reflects the site\'s base currency.',
					'zero-bs-crm'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array_merge(
						array(
							'status' => array(
								'type'        => 'string',
								'enum'        => array( 'paid', 'unpaid', 'overdue', 'draft' ),
								'description' => __( 'Filter by invoice lifecycle status.', 'zero-bs-crm' ),
							),
						),
						$pagination_properties
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $invoice_summary_schema,
				),
				'execute_callback'    => array( __CLASS__, 'list_invoices' ),
				'permission_callback' => array( __CLASS__, 'can_view_crm' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	/**
	 * Permission check for all CRM read abilities.
	 *
	 * Gated on `admin_zerobs_customers`, which the CRM grants to
	 * `administrator`, `zerobs_admin`, and `zerobs_customermgr` roles.
	 */
	public static function can_view_crm(): bool {
		return current_user_can( self::CAP_VIEW_CRM );
	}

	// -------------------- Execute callbacks --------------------

	/**
	 * Execute: list contacts (or fetch one by id).
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function list_contacts( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$dal = self::get_dal();
		if ( null === $dal ) {
			return new \WP_Error(
				'jetpack_crm_not_initialized',
				__( 'Jetpack CRM has not finished loading. Retry on a later request.', 'zero-bs-crm' )
			);
		}

		// Single-id short-circuit (consolidated-read contract).
		if ( isset( $input['contact_id'] ) ) {
			$id = (int) $input['contact_id'];
			if ( $id <= 0 ) {
				return array();
			}
			$row = $dal->contacts->getContact(
				$id,
				array(
					'withTags'         => true,
					'withCustomFields' => false,
				)
			);
			if ( ! is_array( $row ) ) {
				return array();
			}
			return array( self::shape_contact_summary( $row ) );
		}

		list( $page, $per_page ) = self::resolve_pagination( $input );

		$args = array(
			'page'             => max( 0, $page - 1 ),
			'perPage'          => $per_page,
			'withTags'         => true,
			'withCustomFields' => false,
		);
		if ( isset( $input['search'] ) && is_string( $input['search'] ) && '' !== $input['search'] ) {
			$args['searchPhrase'] = $input['search'];
		}
		if ( isset( $input['status'] ) && is_string( $input['status'] ) && '' !== $input['status'] ) {
			$args['hasStatus'] = $input['status'];
		}

		$rows = $dal->contacts->getContacts( $args );
		if ( ! is_array( $rows ) ) {
			return array();
		}

		$out = array();
		foreach ( $rows as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$out[] = self::shape_contact_summary( $row );
		}
		return $out;
	}

	/**
	 * Execute: fetch a single contact with notes, activity, and custom fields.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function get_contact( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( ! isset( $input['id'] ) ) {
			return new \WP_Error(
				'jetpack_crm_missing_id',
				__( 'A contact id is required. Call jetpack-crm/list-contacts to enumerate available ids.', 'zero-bs-crm' )
			);
		}
		$id = (int) $input['id'];
		if ( $id <= 0 ) {
			return new \WP_Error(
				'jetpack_crm_invalid_id',
				__( 'Contact id must be a positive integer.', 'zero-bs-crm' )
			);
		}

		$dal = self::get_dal();
		if ( null === $dal ) {
			return new \WP_Error(
				'jetpack_crm_not_initialized',
				__( 'Jetpack CRM has not finished loading. Retry on a later request.', 'zero-bs-crm' )
			);
		}

		$row = $dal->contacts->getContact(
			$id,
			array(
				'withTags'         => true,
				'withLogs'         => true,
				'withCustomFields' => true,
			)
		);
		if ( ! is_array( $row ) ) {
			return array();
		}

		$summary  = self::shape_contact_summary( $row );
		$activity = self::extract_activity( $row );
		$notes    = self::extract_notes( $row );

		$custom_fields = array();
		if ( isset( $row['customfields'] ) && is_array( $row['customfields'] ) ) {
			$custom_fields = $row['customfields'];
		} elseif ( isset( $row['custom_fields'] ) && is_array( $row['custom_fields'] ) ) {
			$custom_fields = $row['custom_fields'];
		}

		$summary['notes']         = $notes;
		$summary['activity']      = $activity;
		$summary['custom_fields'] = $custom_fields;

		return array( $summary );
	}

	/**
	 * Execute: list deals (quotes).
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function list_deals( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$dal = self::get_dal();
		if ( null === $dal ) {
			return new \WP_Error(
				'jetpack_crm_not_initialized',
				__( 'Jetpack CRM has not finished loading. Retry on a later request.', 'zero-bs-crm' )
			);
		}

		list( $page, $per_page ) = self::resolve_pagination( $input );

		$args = array(
			'page'    => max( 0, $page - 1 ),
			'perPage' => $per_page,
		);
		if ( isset( $input['status'] ) && is_string( $input['status'] ) && '' !== $input['status'] ) {
			$args['hasStatus'] = $input['status'];
		}
		if ( isset( $input['owner'] ) ) {
			$owner = (int) $input['owner'];
			if ( $owner > 0 ) {
				$args['ownedBy'] = $owner;
			}
		}

		$rows = $dal->quotes->getQuotes( $args );
		if ( ! is_array( $rows ) ) {
			return array();
		}

		$out = array();
		foreach ( $rows as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$out[] = self::shape_deal_summary( $row );
		}
		return $out;
	}

	/**
	 * Execute: list invoices.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function list_invoices( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$dal = self::get_dal();
		if ( null === $dal ) {
			return new \WP_Error(
				'jetpack_crm_not_initialized',
				__( 'Jetpack CRM has not finished loading. Retry on a later request.', 'zero-bs-crm' )
			);
		}

		list( $page, $per_page ) = self::resolve_pagination( $input );

		$args = array(
			'page'    => max( 0, $page - 1 ),
			'perPage' => $per_page,
		);
		if ( isset( $input['status'] ) && is_string( $input['status'] ) && '' !== $input['status'] ) {
			$args['hasStatus'] = $input['status'];
		}

		$rows = $dal->invoices->getInvoices( $args );
		if ( ! is_array( $rows ) ) {
			return array();
		}

		$out = array();
		foreach ( $rows as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$out[] = self::shape_invoice_summary( $row );
		}
		return $out;
	}

	// -------------------- Shape helpers --------------------

	/**
	 * Build the summary shape returned by list-contacts / get-contact entries.
	 *
	 * Accepts a raw DAL row (associative array). Missing keys yield empty
	 * defaults so the shape stays uniform across read paths.
	 *
	 * @param array $row Raw DAL contact row.
	 * @return array
	 */
	private static function shape_contact_summary( array $row ): array {
		$first = self::str_field( $row, 'fname' );
		$last  = self::str_field( $row, 'lname' );
		$name  = trim( $first . ' ' . $last );

		$phone = self::str_field( $row, 'hometel' );
		if ( '' === $phone ) {
			$phone = self::str_field( $row, 'mobtel' );
		}
		if ( '' === $phone ) {
			$phone = self::str_field( $row, 'worktel' );
		}

		$tags = array();
		if ( isset( $row['tags'] ) && is_array( $row['tags'] ) ) {
			foreach ( $row['tags'] as $tag ) {
				if ( is_array( $tag ) && isset( $tag['name'] ) && is_string( $tag['name'] ) ) {
					$tags[] = $tag['name'];
				} elseif ( is_string( $tag ) ) {
					$tags[] = $tag;
				}
			}
		}

		return array(
			'id'                => isset( $row['id'] ) ? (int) $row['id'] : 0,
			'name'              => '' !== $name ? $name : self::str_field( $row, 'email' ),
			'email'             => self::str_field( $row, 'email' ),
			'phone'             => $phone,
			'status'            => self::str_field( $row, 'status' ),
			'owner'             => isset( $row['owner'] ) ? (int) $row['owner'] : 0,
			'tags'              => $tags,
			'created_at'        => self::int_or_null( $row, 'created' ),
			'last_contacted_at' => self::int_or_null( $row, 'lastcontacted' ),
		);
	}

	/**
	 * Build the deal summary shape.
	 *
	 * @param array $row Raw DAL quote row.
	 * @return array
	 */
	private static function shape_deal_summary( array $row ): array {
		// Currency: CRM stores it per-quote or falls back to the site base.
		$currency = self::str_field( $row, 'currency' );
		if ( '' === $currency && function_exists( 'zeroBSCRM_getCurrency' ) ) {
			$currency = (string) zeroBSCRM_getCurrency();
		}

		return array(
			'id'                  => isset( $row['id'] ) ? (int) $row['id'] : 0,
			'title'               => self::str_field( $row, 'title' ),
			'value'               => isset( $row['value'] ) ? (float) $row['value'] : 0.0,
			'currency'            => $currency,
			'status'              => self::str_field( $row, 'status' ),
			'contact_id'          => isset( $row['contact_id'] ) ? (int) $row['contact_id'] : null,
			'owner'               => isset( $row['owner'] ) ? (int) $row['owner'] : 0,
			'created_at'          => self::int_or_null( $row, 'created' ),
			'expected_close_date' => self::int_or_null( $row, 'expectedclosedate' ),
		);
	}

	/**
	 * Build the invoice summary shape.
	 *
	 * @param array $row Raw DAL invoice row.
	 * @return array
	 */
	private static function shape_invoice_summary( array $row ): array {
		$currency = self::str_field( $row, 'currency' );
		if ( '' === $currency && function_exists( 'zeroBSCRM_getCurrency' ) ) {
			$currency = (string) zeroBSCRM_getCurrency();
		}

		$total = 0.0;
		if ( isset( $row['total'] ) ) {
			$total = (float) $row['total'];
		} elseif ( isset( $row['net'] ) ) {
			$total = (float) $row['net'];
		}

		// CRM invoice number lives in `id_override` (the human-facing ref)
		// with `id` as a fallback when no override is set.
		$number = self::str_field( $row, 'id_override' );
		if ( '' === $number && isset( $row['id'] ) ) {
			$number = (string) (int) $row['id'];
		}

		return array(
			'id'         => isset( $row['id'] ) ? (int) $row['id'] : 0,
			'number'     => $number,
			'contact_id' => isset( $row['contact_id'] ) ? (int) $row['contact_id'] : null,
			'total'      => $total,
			'currency'   => $currency,
			'status'     => self::str_field( $row, 'status' ),
			'due_date'   => self::int_or_null( $row, 'due_date' ),
			'issued_at'  => self::int_or_null( $row, 'date' ),
			'paid_at'    => self::int_or_null( $row, 'date_paid' ),
		);
	}

	/**
	 * Extract notes-shaped entries from a DAL contact detail row.
	 *
	 * @param array $row Raw DAL contact row (with logs).
	 * @return array<int,array<string,mixed>>
	 */
	private static function extract_notes( array $row ): array {
		$notes = array();
		if ( ! isset( $row['logs'] ) || ! is_array( $row['logs'] ) ) {
			return $notes;
		}
		foreach ( $row['logs'] as $log ) {
			if ( ! is_array( $log ) ) {
				continue;
			}
			$type = isset( $log['type'] ) ? (string) $log['type'] : '';
			if ( 'Note' !== $type ) {
				continue;
			}
			$notes[] = array(
				'id'      => isset( $log['id'] ) ? (int) $log['id'] : 0,
				'created' => isset( $log['created'] ) ? (int) $log['created'] : null,
				'note'    => isset( $log['longdesc'] ) ? (string) $log['longdesc'] : (string) ( $log['shortdesc'] ?? '' ),
			);
		}
		return $notes;
	}

	/**
	 * Extract activity entries (non-note logs) from a DAL contact detail row.
	 *
	 * @param array $row Raw DAL contact row (with logs).
	 * @return array<int,array<string,mixed>>
	 */
	private static function extract_activity( array $row ): array {
		$activity = array();
		if ( ! isset( $row['logs'] ) || ! is_array( $row['logs'] ) ) {
			return $activity;
		}
		foreach ( $row['logs'] as $log ) {
			if ( ! is_array( $log ) ) {
				continue;
			}
			$type = isset( $log['type'] ) ? (string) $log['type'] : '';
			if ( 'Note' === $type ) {
				continue;
			}
			$activity[] = array(
				'id'      => isset( $log['id'] ) ? (int) $log['id'] : 0,
				'created' => isset( $log['created'] ) ? (int) $log['created'] : null,
				'type'    => $type,
				'summary' => isset( $log['shortdesc'] ) ? (string) $log['shortdesc'] : '',
			);
		}
		return $activity;
	}

	// -------------------- Internal helpers --------------------

	/**
	 * Resolve `page` / `per_page` from input, applying defaults and clamping.
	 *
	 * @param array $input Validated input.
	 * @return array{0:int,1:int} Tuple of [ page, per_page ].
	 */
	private static function resolve_pagination( array $input ): array {
		$page = self::DEFAULT_PER_PAGE;
		if ( isset( $input['page'] ) ) {
			$page = (int) $input['page'];
		}
		if ( $page < 1 ) {
			$page = 1;
		}

		$per_page = self::DEFAULT_PER_PAGE;
		if ( isset( $input['per_page'] ) ) {
			$per_page = (int) $input['per_page'];
		}
		if ( $per_page < 1 ) {
			$per_page = self::DEFAULT_PER_PAGE;
		}
		if ( $per_page > self::MAX_PER_PAGE ) {
			$per_page = self::MAX_PER_PAGE;
		}

		return array( $page, $per_page );
	}

	/**
	 * Return the CRM data access layer, or null if it isn't initialized yet.
	 *
	 * @return \zbsDAL|null
	 */
	private static function get_dal() {
		if ( ! isset( $GLOBALS['zbs'] ) || ! is_object( $GLOBALS['zbs'] ) ) {
			return null;
		}
		if ( ! isset( $GLOBALS['zbs']->DAL ) || ! is_object( $GLOBALS['zbs']->DAL ) ) {
			return null;
		}
		return $GLOBALS['zbs']->DAL;
	}

	/**
	 * Read a string field from a DAL row, defaulting to ''.
	 *
	 * @param array  $row DAL row.
	 * @param string $key Field name.
	 * @return string
	 */
	private static function str_field( array $row, string $key ): string {
		if ( ! isset( $row[ $key ] ) ) {
			return '';
		}
		$value = $row[ $key ];
		if ( is_scalar( $value ) ) {
			return (string) $value;
		}
		return '';
	}

	/**
	 * Read an integer timestamp from a DAL row, returning null when missing
	 * or zero (the CRM uses 0 to mean "never").
	 *
	 * @param array  $row DAL row.
	 * @param string $key Field name.
	 * @return int|null
	 */
	private static function int_or_null( array $row, string $key ): ?int {
		if ( ! isset( $row[ $key ] ) ) {
			return null;
		}
		$value = (int) $row[ $key ];
		return $value > 0 ? $value : null;
	}
}

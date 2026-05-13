<?php
/**
 * Jetpack External Media Abilities Registration
 *
 * Registers Jetpack External Media abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-external-media
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9, but then we need a suppression for the WP 6.8 compat run. @todo Remove this line when we drop WP < 6.9.

namespace Automattic\Jetpack\External_Media\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;
use WP_REST_Request;

/**
 * Class External_Media_Abilities
 *
 * Registers Jetpack External Media abilities with the WordPress Abilities API.
 * Search and import callbacks delegate to the underlying
 * `wpcom/v2/external-media/*` REST controller (lives in the Jetpack plugin and
 * proxies through WordPress.com) so they inherit endpoint validation,
 * sanitization, and capability checks.
 */
class External_Media_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-external-media';

	/**
	 * The supported external media providers.
	 *
	 * Mirrors the regex enforced by the REST controller
	 * (`google_photos|openverse|pexels`). Keep these in sync.
	 *
	 * @var array<string, array{name: string, requires_auth: bool}>
	 */
	const PROVIDERS = array(
		'google_photos' => array(
			'name'          => 'Google Photos',
			'requires_auth' => true,
		),
		'pexels'        => array(
			'name'          => 'Pexels',
			'requires_auth' => false,
		),
		'openverse'     => array(
			'name'          => 'Openverse',
			'requires_auth' => false,
		),
	);

	/**
	 * Provider slugs accepted by `search-media` and `import-media`.
	 *
	 * Kept as a separate constant so the JSON schema `enum` can reference it
	 * statically (constants in array context can't use array_keys()).
	 */
	const PROVIDER_SLUGS = array( 'google_photos', 'pexels', 'openverse' );

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack External Media" is a product name and should not be translated.
			'label'       => 'Jetpack External Media',
			'description' => __( 'Abilities for searching and importing media from external sources (Google Photos, Pexels, Openverse) into the WordPress media library.', 'jetpack-external-media' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-external-media/list-providers' => self::spec_list_providers(),
			'jetpack-external-media/search-media'   => self::spec_search_media(),
			'jetpack-external-media/import-media'   => self::spec_import_media(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-external-media/list-providers.
	 */
	private static function spec_list_providers(): array {
		return array(
			'label'               => __( 'List external media providers', 'jetpack-external-media' ),
			'description'         => __( 'List configured external media providers (Google Photos, Pexels, Openverse). Returns an array of providers each shaped as `{slug, name, requires_auth, connected, supports_search, supports_import}`. Read-only and idempotent. Call before `search-media` to discover available `provider` slugs.', 'jetpack-external-media' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(),
				'additionalProperties' => false,
			),
			'execute_callback'    => array( __CLASS__, 'list_providers' ),
			'permission_callback' => array( __CLASS__, 'can_upload_files' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-external-media/search-media.
	 */
	private static function spec_search_media(): array {
		return array(
			'label'               => __( 'Search external media', 'jetpack-external-media' ),
			'description'         => __( 'Search an external media provider (Google Photos, Pexels, Openverse) for items matching a query. Read-only — does not import anything. Returns up to `per_page` items each shaped as `{id, title, thumbnail, full_url, author, source_url, license, width, height}`. Pair with `import-media` to copy a returned item into the WordPress media library. Call `list-providers` first to discover valid `provider` slugs.', 'jetpack-external-media' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'provider', 'query' ),
				'properties'           => array(
					'provider' => array(
						'type'        => 'string',
						'description' => __( 'Provider slug. Use `list-providers` to enumerate.', 'jetpack-external-media' ),
						'enum'        => self::PROVIDER_SLUGS,
					),
					'query'    => array(
						'type'        => 'string',
						'description' => __( 'Search query string.', 'jetpack-external-media' ),
						'minLength'   => 1,
					),
					'page'     => array(
						'type'        => 'integer',
						'description' => __( 'Page number for paginated results.', 'jetpack-external-media' ),
						'default'     => 1,
						'minimum'     => 1,
					),
					'per_page' => array(
						'type'        => 'integer',
						'description' => __( 'Number of items per page.', 'jetpack-external-media' ),
						'default'     => 20,
						'minimum'     => 1,
						'maximum'     => 50,
					),
				),
				'additionalProperties' => false,
			),
			'execute_callback'    => array( __CLASS__, 'search_media' ),
			'permission_callback' => array( __CLASS__, 'can_upload_files' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-external-media/import-media.
	 */
	private static function spec_import_media(): array {
		return array(
			'label'               => __( 'Import external media item', 'jetpack-external-media' ),
			'description'         => __( 'Import a single external media item into the WordPress media library by provider and external `id`. Creates a new attachment each call — not idempotent. Returns `{attachment_id, attachment_url, source: {provider, source_id}}`. Use the `id` field returned by `search-media` as the `id` input. Requires `upload_files` capability.', 'jetpack-external-media' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'provider', 'id' ),
				'properties'           => array(
					'provider' => array(
						'type'        => 'string',
						'description' => __( 'Provider slug. Use `list-providers` to enumerate.', 'jetpack-external-media' ),
						'enum'        => self::PROVIDER_SLUGS,
					),
					'id'       => array(
						'type'        => 'string',
						'description' => __( 'External item id as returned by `search-media`.', 'jetpack-external-media' ),
						'minLength'   => 1,
					),
				),
				'additionalProperties' => false,
			),
			'execute_callback'    => array( __CLASS__, 'import_media' ),
			'permission_callback' => array( __CLASS__, 'can_upload_files' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => false,
				),
				'show_in_rest' => true,
			),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Permission callback shared by every External Media ability.
	 *
	 * Matches the REST controller's coarse gate
	 * (`current_user_can( 'upload_files' )`); the delegated controller
	 * additionally enforces `create_posts` on the attachment post type for
	 * the import path.
	 *
	 * @return bool
	 */
	public static function can_upload_files() {
		return current_user_can( 'upload_files' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: list-providers.
	 *
	 * Returns the static provider catalog augmented with runtime
	 * connection state (currently only `google_photos` reports a
	 * connection check; others are public APIs and always `connected`).
	 *
	 * @param array|null $input Arguments from the ability input (unused).
	 * @return array<int, array<string, mixed>>
	 */
	public static function list_providers( $input = null ) {
		unset( $input ); // List has no inputs.

		$out = array();
		foreach ( self::PROVIDERS as $slug => $info ) {
			$out[] = array(
				'slug'            => $slug,
				'name'            => $info['name'],
				'requires_auth'   => $info['requires_auth'],
				'connected'       => $info['requires_auth'] ? self::is_provider_connected( $slug ) : true,
				'supports_search' => true,
				'supports_import' => true,
			);
		}

		return $out;
	}

	/**
	 * Execute: search-media.
	 *
	 * Delegates to `GET /wpcom/v2/external-media/list/<provider>` (registered
	 * by the Jetpack plugin), reshaping the heterogenous per-provider payload
	 * into a uniform `{id, title, thumbnail, full_url, author, source_url,
	 * license, width, height}` shape.
	 *
	 * @param array|null $input Ability input.
	 * @return array<int, array<string, mixed>>|WP_Error
	 */
	public static function search_media( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$provider = isset( $input['provider'] ) ? (string) $input['provider'] : '';
		$query    = isset( $input['query'] ) ? (string) $input['query'] : '';

		if ( ! isset( self::PROVIDERS[ $provider ] ) ) {
			return new WP_Error(
				'jetpack_external_media_invalid_provider',
				__( 'Unknown provider. Call jetpack-external-media/list-providers to enumerate available providers.', 'jetpack-external-media' )
			);
		}

		if ( '' === $query ) {
			return new WP_Error(
				'jetpack_external_media_missing_query',
				__( 'Search query is required.', 'jetpack-external-media' )
			);
		}

		// Normalize pagination defaults (schema defaults are not auto-injected).
		$per_page = isset( $input['per_page'] ) ? (int) $input['per_page'] : 20;
		$page     = isset( $input['page'] ) ? (int) $input['page'] : 1;
		if ( $per_page < 1 ) {
			$per_page = 20;
		}
		if ( $per_page > 50 ) {
			$per_page = 50;
		}
		if ( $page < 1 ) {
			$page = 1;
		}

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/external-media/list/' . $provider );
		$request->set_param( 'search', $query );
		$request->set_param( 'number', $per_page );
		// The REST controller does not implement page-numbered pagination — it
		// uses `page_handle` cursors set by the upstream service. We forward
		// `page` as a hint via `page_handle` when callers supply it >1 so
		// upstream pagination still works in test environments that translate
		// the param. For typical first-page queries this is a no-op.
		if ( $page > 1 ) {
			$request->set_param( 'page_handle', (string) $page );
		}

		$data = self::dispatch( $request );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		return self::normalize_search_results( $provider, $data );
	}

	/**
	 * Execute: import-media.
	 *
	 * Delegates to `POST /wpcom/v2/external-media/copy/<provider>`. The
	 * controller accepts an array of items shaped like its `media_schema`;
	 * we synthesize a minimal one-item payload from the search result the
	 * caller already has.
	 *
	 * @param array|null $input Ability input.
	 * @return array<string, mixed>|WP_Error
	 */
	public static function import_media( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$provider = isset( $input['provider'] ) ? (string) $input['provider'] : '';

		if ( ! isset( self::PROVIDERS[ $provider ] ) ) {
			return new WP_Error(
				'jetpack_external_media_invalid_provider',
				__( 'Unknown provider. Call jetpack-external-media/list-providers to enumerate available providers.', 'jetpack-external-media' )
			);
		}

		// Empty-but-not-zero check: the literal string '0' is a valid id, so
		// reject only missing keys / wrong types / empty strings — never use
		// empty(), which would falsely flag '0'.
		if ( ! isset( $input['id'] ) || ! is_string( $input['id'] ) || '' === $input['id'] ) {
			return new WP_Error(
				'jetpack_external_media_missing_id',
				__( 'External media `id` is required.', 'jetpack-external-media' )
			);
		}
		$id = (string) $input['id'];

		// To copy by id we first need the item's URL; resolve it by searching
		// the provider with the id as the query and selecting the matching
		// result. Cheap, and avoids requiring callers to pass the full guid.
		$resolved = self::resolve_media_item( $provider, $id );
		if ( is_wp_error( $resolved ) ) {
			return $resolved;
		}

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/external-media/copy/' . $provider );
		$request->set_body_params(
			array(
				'media' => array(
					array(
						'guid'    => array(
							'url'   => $resolved['url'],
							'name'  => $resolved['name'],
							'title' => $resolved['title'],
						),
						'title'   => $resolved['title'],
						'caption' => $resolved['caption'],
					),
				),
			)
		);

		$data = self::dispatch( $request );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		// The controller returns an array of per-item responses; we sent one
		// item, so unwrap the first entry. A failed item surfaces as a
		// WP_Error inside the array.
		if ( ! is_array( $data ) || empty( $data ) ) {
			return new WP_Error(
				'jetpack_external_media_data_unavailable',
				__( 'Import did not return an attachment. The external service may be unavailable.', 'jetpack-external-media' )
			);
		}

		$first = reset( $data );
		if ( is_wp_error( $first ) ) {
			return $first;
		}

		if ( ! is_array( $first ) || ! isset( $first['id'], $first['url'] ) ) {
			return new WP_Error(
				'jetpack_external_media_data_unavailable',
				__( 'Import returned an unexpected response shape.', 'jetpack-external-media' )
			);
		}

		return array(
			'attachment_id'  => (int) $first['id'],
			'attachment_url' => (string) $first['url'],
			'source'         => array(
				'provider'  => $provider,
				'source_id' => $id,
			),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Dispatch an internal REST request and unwrap the response.
	 *
	 * @param WP_REST_Request $request The REST request to dispatch.
	 * @return array|WP_Error Response data array, or WP_Error on failure.
	 */
	private static function dispatch( WP_REST_Request $request ) {
		if ( ! function_exists( 'rest_do_request' ) ) {
			return new WP_Error(
				'jetpack_external_media_not_initialized',
				__( 'REST API is not available.', 'jetpack-external-media' )
			);
		}
		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}
		$data = $response->get_data();

		// `rest_do_request` returns the response data unwrapped, but a missing
		// route surfaces as a 404 with `rest_no_route`; tests that don't load
		// the Jetpack plugin's REST controller will hit this branch.
		if ( null === $data ) {
			return new WP_Error(
				'jetpack_external_media_data_unavailable',
				__( 'No data returned from the external media endpoint. The Jetpack plugin must be loaded for this ability to work.', 'jetpack-external-media' )
			);
		}

		return $data;
	}

	/**
	 * Check whether the current user has an active connection to a provider.
	 *
	 * Currently only `google_photos` exposes a connection check via the
	 * `wpcom/v2/external-media/connection/google_photos` endpoint; we
	 * dispatch internally and treat any non-error response as connected.
	 *
	 * @param string $provider Provider slug.
	 * @return bool
	 */
	private static function is_provider_connected( string $provider ): bool {
		if ( 'google_photos' !== $provider ) {
			return false;
		}
		if ( ! function_exists( 'rest_do_request' ) ) {
			return false;
		}

		$request  = new WP_REST_Request( 'GET', '/wpcom/v2/external-media/connection/' . $provider );
		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return false;
		}
		$data = $response->get_data();
		// Treat any non-empty payload as "connected"; the wpcom payload
		// includes `connect_URL`/`ID`/etc when a connection exists.
		return is_array( $data ) || is_object( $data );
	}

	/**
	 * Reshape a heterogenous provider list payload into the uniform shape
	 * documented in the search-media spec.
	 *
	 * Pexels and Openverse use slightly different keys than Google Photos;
	 * the wpcom upstream usually returns `media` arrays with `ID`, `URL`,
	 * `thumbnails`, `title`, `caption`, `author`, `width`, `height` and
	 * (for free-stock sources) a `license` / `link` field. Missing keys
	 * degrade to empty strings rather than null so the shape is stable.
	 *
	 * @param string $provider Provider slug (preserved for forward-compat;
	 *                         currently unused as the normalization is
	 *                         identical across providers, but kept in the
	 *                         signature so per-provider shape drift can be
	 *                         handled here without touching callers).
	 * @param mixed  $data     Raw response from the REST controller.
	 * @return array<int, array<string, mixed>>
	 */
	private static function normalize_search_results( string $provider, $data ): array {
		unset( $provider );

		// Endpoint sometimes returns `{ media: [...] }`, sometimes a plain array.
		$items = array();
		if ( is_array( $data ) ) {
			if ( isset( $data['media'] ) && is_array( $data['media'] ) ) {
				$items = $data['media'];
			} else {
				$items = $data;
			}
		}

		$out = array();
		foreach ( $items as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$thumbnail = '';
			if ( isset( $item['thumbnails'] ) && is_array( $item['thumbnails'] ) ) {
				// Pick the first thumbnail URL.
				$thumbnail = (string) reset( $item['thumbnails'] );
			} elseif ( isset( $item['thumbnail'] ) ) {
				$thumbnail = (string) $item['thumbnail'];
			}

			$out[] = array(
				'id'         => isset( $item['ID'] ) ? (string) $item['ID'] : ( isset( $item['id'] ) ? (string) $item['id'] : '' ),
				'title'      => isset( $item['title'] ) ? (string) $item['title'] : '',
				'thumbnail'  => $thumbnail,
				'full_url'   => isset( $item['URL'] ) ? (string) $item['URL'] : ( isset( $item['url'] ) ? (string) $item['url'] : '' ),
				'author'     => isset( $item['author'] ) ? (string) $item['author'] : '',
				'source_url' => isset( $item['link'] ) ? (string) $item['link'] : ( isset( $item['source_url'] ) ? (string) $item['source_url'] : '' ),
				'license'    => isset( $item['license'] ) ? (string) $item['license'] : '',
				'width'      => isset( $item['width'] ) ? (int) $item['width'] : 0,
				'height'     => isset( $item['height'] ) ? (int) $item['height'] : 0,
			);
		}

		return $out;
	}

	/**
	 * Resolve a media item to the fields needed by the `/copy` endpoint.
	 *
	 * The `/copy` endpoint requires a `guid.url` to download; we don't ask
	 * callers to pass the URL because (a) the ability surface is supposed
	 * to wrap intent, not the REST internals, and (b) external ids are the
	 * stable handle the search response advertises. We look the id up via a
	 * `/list/<provider>` call using the id as the search term and pick the
	 * matching item.
	 *
	 * Hookable for tests: filter `jetpack_external_media_resolve_item` to
	 * inject a deterministic record without round-tripping through the
	 * REST controller.
	 *
	 * @param string $provider Provider slug.
	 * @param string $id       External id from `search-media`.
	 * @return array{url: string, name: string, title: string, caption: string}|WP_Error
	 */
	private static function resolve_media_item( string $provider, string $id ) {
		/**
		 * Filters the resolved media item used by `import-media`.
		 *
		 * Return an array with `url`, `name`, `title`, `caption` to short-circuit
		 * the lookup. Return a WP_Error to abort the import.
		 *
		 * @since 0.9.0
		 *
		 * @param array|null|WP_Error $resolved Pre-resolved item, null to fall through to the REST lookup.
		 * @param string              $provider Provider slug.
		 * @param string              $id       External media id.
		 */
		$resolved = apply_filters( 'jetpack_external_media_resolve_item', null, $provider, $id );
		if ( is_wp_error( $resolved ) ) {
			return $resolved;
		}
		if ( is_array( $resolved ) && isset( $resolved['url'] ) ) {
			return array(
				'url'     => (string) $resolved['url'],
				'name'    => isset( $resolved['name'] ) ? (string) $resolved['name'] : (string) $id,
				'title'   => isset( $resolved['title'] ) ? (string) $resolved['title'] : '',
				'caption' => isset( $resolved['caption'] ) ? (string) $resolved['caption'] : '',
			);
		}

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/external-media/list/' . $provider );
		$request->set_param( 'search', $id );

		$data = self::dispatch( $request );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$items = array();
		if ( is_array( $data ) ) {
			$items = isset( $data['media'] ) && is_array( $data['media'] ) ? $data['media'] : $data;
		}

		foreach ( $items as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$item_id = isset( $item['ID'] ) ? (string) $item['ID'] : ( isset( $item['id'] ) ? (string) $item['id'] : '' );
			if ( $item_id !== $id ) {
				continue;
			}
			$url = isset( $item['URL'] ) ? (string) $item['URL'] : ( isset( $item['url'] ) ? (string) $item['url'] : '' );
			if ( '' === $url ) {
				return new WP_Error(
					'jetpack_external_media_data_unavailable',
					__( 'External media item is missing a download URL.', 'jetpack-external-media' )
				);
			}
			return array(
				'url'     => $url,
				'name'    => isset( $item['name'] ) ? (string) $item['name'] : (string) $id,
				'title'   => isset( $item['title'] ) ? (string) $item['title'] : '',
				'caption' => isset( $item['caption'] ) ? (string) $item['caption'] : '',
			);
		}

		return new WP_Error(
			'jetpack_external_media_not_found',
			__( 'No external media item matched the provided id. Call jetpack-external-media/search-media to discover valid ids.', 'jetpack-external-media' )
		);
	}
}

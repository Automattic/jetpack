<?php
/**
 * The AI Hub's skill catalog, read from the public skills site and cached.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Fetches and caches the skill index and skill bodies.
 */
class Jetpack_AI_Skills_Catalog {

	/**
	 * The catalog site's WP REST API, through the WordPress.com public API.
	 *
	 * @var string
	 */
	const API_BASE = 'https://public-api.wordpress.com/wp/v2/sites/agentskills.wordpress.com';

	/**
	 * The host a skill's link must point at.
	 *
	 * @var string
	 */
	const CATALOG_HOST = 'agentskills.wordpress.com';

	/**
	 * The catalog's "Applies to" terms, by host: WordPress.com sites (Simple
	 * and Atomic) get `wpcom` skills, self-hosted sites `jetpack` ones.
	 *
	 * @var int[]
	 */
	const HOST_TERMS = array(
		'jetpack' => 788021843,
		'wpcom'   => 788021842,
	);

	/**
	 * Transient holding the index. Bump the suffix when its shape changes.
	 *
	 * @var string
	 */
	const INDEX_TRANSIENT = 'jetpack_ai_skills_index_v4';

	/**
	 * Transient prefix for one skill's body.
	 *
	 * @var string
	 */
	const BODY_TRANSIENT_PREFIX = 'jetpack_ai_skill_body_v1_';

	/**
	 * How long a successful fetch is kept.
	 *
	 * @var int
	 */
	const CACHE_TTL = DAY_IN_SECONDS;

	/**
	 * How long a failed fetch is kept, so a down catalog isn't retried on every load.
	 *
	 * @var int
	 */
	const FAILURE_CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * Marks a cached body fetch that failed.
	 *
	 * @var string
	 */
	const UNAVAILABLE = 'unavailable';

	/**
	 * The skills that apply to this site's host, without bodies.
	 *
	 * @return array {
	 *     @type array[] $categories Each with `slug` and `name`, in catalog order.
	 *     @type array[] $skills     Each with `slug`, `title`, `description`, `summary`, `prerequisites`,
	 *                               `tryPrompt`, `categories` (slugs) and `url`.
	 * }
	 */
	public static function get_index() {
		$cached = get_transient( self::INDEX_TRANSIENT );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$host  = ( new Host() )->is_wpcom_platform() ? 'wpcom' : 'jetpack';
		$index = self::fetch_index( self::HOST_TERMS[ $host ] );
		set_transient(
			self::INDEX_TRANSIENT,
			$index ?? self::empty_index(),
			null === $index ? self::FAILURE_CACHE_TTL : self::CACHE_TTL
		);

		return $index ?? self::empty_index();
	}

	/**
	 * One skill's instructions, as plain text.
	 *
	 * @param string $slug The skill's slug.
	 * @return string|WP_Error The body, or an error when the skill is unknown or the fetch failed.
	 */
	public static function get_body( $slug ) {
		// Only skills in the index, so callers can't make the site fetch or cache arbitrary paths.
		if ( ! in_array( $slug, wp_list_pluck( self::get_index()['skills'], 'slug' ), true ) ) {
			return new WP_Error( 'jetpack_ai_skill_not_found', __( 'Skill not found.', 'jetpack' ), array( 'status' => 404 ) );
		}

		$transient = self::BODY_TRANSIENT_PREFIX . $slug;
		$cached    = get_transient( $transient );
		if ( is_string( $cached ) && self::UNAVAILABLE !== $cached ) {
			return $cached;
		}

		$body = self::UNAVAILABLE === $cached ? null : self::fetch_body( $slug );
		if ( null === $body ) {
			if ( false === $cached ) {
				set_transient( $transient, self::UNAVAILABLE, self::FAILURE_CACHE_TTL );
			}
			return new WP_Error( 'jetpack_ai_skill_unavailable', __( 'The skill’s instructions could not be loaded.', 'jetpack' ), array( 'status' => 502 ) );
		}

		set_transient( $transient, $body, self::CACHE_TTL );
		return $body;
	}

	/**
	 * The index's shape with nothing in it.
	 *
	 * @return array
	 */
	private static function empty_index() {
		return array(
			'categories' => array(),
			'skills'     => array(),
		);
	}

	/**
	 * Fetch the index from the catalog: the skills that apply to one host.
	 *
	 * @param int $host_term The host's "Applies to" term ID.
	 * @return array|null The index, or null when the request failed.
	 */
	private static function fetch_index( $host_term ) {
		$posts = self::request(
			'/posts',
			array(
				'per_page'               => 100,
				'agent_skill_applies_to' => $host_term,
				// Without this the API returns every skill's full body.
				'_fields'                => 'slug,title.rendered,excerpt.rendered,categories,link,meta.agent_skill_prerequisites,meta.agent_skill_try_prompt',
			)
		);
		$terms = self::request(
			'/categories',
			array(
				'per_page'   => 100,
				'hide_empty' => 'true',
				'_fields'    => 'id,slug,name',
			)
		);
		if ( null === $posts || null === $terms ) {
			return null;
		}

		$terms_by_id = array();
		foreach ( $terms as $term ) {
			if ( is_array( $term ) && ! empty( $term['id'] ) && ! empty( $term['slug'] ) ) {
				$terms_by_id[ (int) $term['id'] ] = array(
					'slug' => sanitize_title( $term['slug'] ),
					'name' => self::to_text( $term['name'] ?? $term['slug'] ),
				);
			}
		}

		$skills = array();
		$used   = array();
		foreach ( $posts as $post ) {
			if ( ! is_array( $post ) ) {
				continue;
			}
			$slug  = sanitize_title( $post['slug'] ?? '' );
			$title = self::to_text( $post['title']['rendered'] ?? '' );
			if ( '' === $slug || '' === $title ) {
				continue;
			}

			$categories = array();
			foreach ( (array) ( $post['categories'] ?? array() ) as $term_id ) {
				if ( isset( $terms_by_id[ (int) $term_id ] ) ) {
					$categories[]           = $terms_by_id[ (int) $term_id ]['slug'];
					$used[ (int) $term_id ] = true;
				}
			}

			$meta        = is_array( $post['meta'] ?? null ) ? $post['meta'] : array();
			$description = self::to_text( $post['excerpt']['rendered'] ?? '' );
			$skills[]    = array(
				'slug'          => $slug,
				'title'         => $title,
				'description'   => $description,
				'summary'       => self::first_sentence( $description ),
				'prerequisites' => self::to_text( $meta['agent_skill_prerequisites'] ?? '' ),
				'tryPrompt'     => self::to_text( $meta['agent_skill_try_prompt'] ?? '' ),
				'categories'    => $categories,
				'url'           => self::catalog_url( $post['link'] ?? '' ),
			);
		}

		return array(
			'categories' => array_values( array_intersect_key( $terms_by_id, $used ) ),
			'skills'     => $skills,
		);
	}

	/**
	 * Fetch one skill's body from the catalog.
	 *
	 * @param string $slug The skill's slug.
	 * @return string|null The body as plain text, or null when the request failed.
	 */
	private static function fetch_body( $slug ) {
		$posts = self::request(
			'/posts',
			array(
				'slug'    => $slug,
				'_fields' => 'content.rendered',
			)
		);
		if ( empty( $posts[0]['content']['rendered'] ) || ! is_string( $posts[0]['content']['rendered'] ) ) {
			return null;
		}

		// The body is markdown inside a <pre>, with <br> for each line break.
		$html = preg_replace( '#<br\s*/?>|</p>#i', "\n", $posts[0]['content']['rendered'] );
		return trim( html_entity_decode( wp_strip_all_tags( $html ), ENT_QUOTES, 'UTF-8' ) );
	}

	/**
	 * GET a catalog route and decode its JSON list.
	 *
	 * @param string $path  Route under the catalog's API base.
	 * @param array  $query Query args.
	 * @return array|null The decoded list, or null on any failure.
	 */
	private static function request( $path, $query ) {
		$response = wp_remote_get( add_query_arg( $query, self::API_BASE . $path ), array( 'timeout' => 5 ) );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		return is_array( $body ) && wp_is_numeric_array( $body ) ? $body : null;
	}

	/**
	 * Rendered HTML to plain text. Keeps non-breaking spaces, which stop one-word last lines.
	 *
	 * @param mixed $html The rendered value.
	 * @return string
	 */
	private static function to_text( $html ) {
		return is_string( $html ) ? trim( html_entity_decode( wp_strip_all_tags( $html ), ENT_QUOTES, 'UTF-8' ) ) : '';
	}

	/**
	 * The first sentence, which in the catalog's excerpts says when to use the skill.
	 *
	 * @param string $text Plain text.
	 * @return string
	 */
	private static function first_sentence( $text ) {
		return preg_match( '/^.+?[.!?](?=\s+[\p{Lu}“"]|$)/su', $text, $matches ) ? $matches[0] : $text;
	}

	/**
	 * A skill's link, only when it points at the catalog site.
	 *
	 * @param mixed $url The link.
	 * @return string The link, or '' for anything else.
	 */
	private static function catalog_url( $url ) {
		$url = is_string( $url ) ? esc_url_raw( $url, array( 'https' ) ) : '';
		return self::CATALOG_HOST === wp_parse_url( $url, PHP_URL_HOST ) ? $url : '';
	}
}

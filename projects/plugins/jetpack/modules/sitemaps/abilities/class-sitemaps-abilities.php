<?php
/**
 * Jetpack Sitemaps Abilities Registration
 *
 * Registers Jetpack Sitemaps abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack;

/**
 * Registers Jetpack Sitemaps abilities with the WordPress Abilities API.
 *
 * Exposes a zero-arg sitemap status read (`get-status`) and a zero-arg rebuild
 * dispatch (`request-rebuild`) so AI agents can inspect sitemap freshness and
 * trigger a regeneration through the standard `wp-abilities/v1` REST surface.
 *
 * Both abilities only register while the Sitemaps module is active — the
 * surrounding `modules/sitemaps.php` is only loaded by Jetpack when the module
 * is on, so the `Sitemaps_Abilities::init()` call at the bottom of that file
 * is the gate.
 */
class Sitemaps_Abilities extends Registrar {

	private const MODULE_SLUG = 'sitemaps';

	/**
	 * Cron hook name used by the Sitemaps module to drive incremental builds.
	 *
	 * Kept as a const here rather than imported from `Jetpack_Sitemap_Manager`
	 * because the manager registers it as an action name only — there is no
	 * canonical PHP constant to reference, and the value is part of the
	 * module's stable public surface (it shows up in `wp cron list`).
	 */
	private const CRON_HOOK = 'jp_sitemap_cron_hook';

	/**
	 * Transient written by `Jetpack_Sitemap_State::check_out()` while a build
	 * step is in progress. Presence of this transient is the canonical
	 * "build currently running" signal; its 15-minute TTL means the signal
	 * self-clears if a build crashes without unlocking.
	 */
	private const STATE_LOCK_TRANSIENT = 'jetpack-sitemap-state-lock';

	/**
	 * {@inheritDoc}
	 *
	 * Sitemaps abilities live under the WordPress core `site` category — it is
	 * registered by the Abilities API itself, so we reference it by slug and
	 * never register it ourselves (see the no-op `register_category()` below).
	 */
	public static function get_category_slug(): string {
		return 'site';
	}

	/**
	 * {@inheritDoc}
	 *
	 * Unused: the `site` category is owned by WordPress core, so
	 * `register_category()` is a no-op and this definition is never passed to
	 * `wp_register_ability_category()`. It remains only to satisfy the abstract
	 * Registrar contract.
	 */
	public static function get_category_definition(): array {
		return array();
	}

	/**
	 * No-op: the `site` ability category is registered by the WordPress core
	 * Abilities API. Re-registering it here would clobber the core definition,
	 * so this registrar only references the category by slug.
	 *
	 * @return void
	 */
	public static function register_category() {}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-sitemaps/get-status'      => array(
				'label'               => __( 'Get Jetpack Sitemaps status', 'jetpack' ),
				'description'         => __( 'Return the current state of the Jetpack-generated XML sitemaps as { active, url, post_count, page_count, news_sitemap_enabled, sitemaps }. `active` reflects whether the Sitemaps module is on. `url` is the public sitemap.xml entry point. `post_count` / `page_count` are the published `post` / `page` counts (the same baseline the WordPress core sitemap uses). `news_sitemap_enabled` reflects the `jetpack_news_sitemap_include_in_robotstxt` filter (default true). `sitemaps` is the list of child sitemaps actually present in the served sitemap.xml index — each entry is `{ loc, lastmod }`, where `lastmod` is the W3C datetime string the sitemap exposes (or null when that entry omits one). `sitemaps` is an empty array until a master sitemap has been generated. These abilities are only registered while the Sitemaps module is active; if they are absent from wp_get_abilities(), activate the Sitemaps module first.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'active'               => array( 'type' => 'boolean' ),
						'url'                  => array( 'type' => 'string' ),
						'post_count'           => array( 'type' => 'integer' ),
						'page_count'           => array( 'type' => 'integer' ),
						'news_sitemap_enabled' => array( 'type' => 'boolean' ),
						'sitemaps'             => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'loc'     => array( 'type' => 'string' ),
									'lastmod' => array( 'type' => array( 'string', 'null' ) ),
								),
							),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_status' ),
				'permission_callback' => array( __CLASS__, 'can_view_sitemaps' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool', // default is already "tool", but can be explicit.
					),
				),
			),

			'jetpack-sitemaps/request-rebuild' => array(
				'label'               => __( 'Request a Jetpack Sitemaps rebuild', 'jetpack' ),
				'description'         => __( 'Dispatch a full sitemap regeneration by scheduling the existing `jp_sitemap_cron_hook` cron event. Returns { dispatched, status, next_scheduled_at } where status is one of "queued" (a single-event cron tick was just scheduled), "running" (a build is already in flight per the `jetpack-sitemap-state-lock` transient), or "already_running" (alias of "running"; surfaced so callers can branch on either spelling). `next_scheduled_at` is the next `jp_sitemap_cron_hook` tick as an ISO 8601 UTC string with an explicit `Z` zone designator (e.g. `2026-05-19T19:33:20Z`), or null when nothing is scheduled (e.g. status=running with no future tick queued) — it tells the caller when the build they queued (or the one already pending) will actually run. Idempotent — calling this while a build is already in flight or already queued returns dispatched=false and the matching status rather than stacking duplicate cron events.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'dispatched'        => array( 'type' => 'boolean' ),
						'status'            => array(
							'type' => 'string',
							'enum' => array( 'queued', 'running', 'already_running' ),
						),
						'next_scheduled_at' => array( 'type' => array( 'string', 'null' ) ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'request_rebuild' ),
				'permission_callback' => array( __CLASS__, 'can_manage_sitemaps' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool', // default is already "tool", but can be explicit.
					),
				),
			),
		);
	}

	/**
	 * Permission check: can the current user read sitemap status?
	 *
	 * Sitemap status is metadata about publicly-served XML — anyone who can
	 * manage content (`edit_posts`) is allowed to see it. Reads do not modify
	 * state and do not expose secrets.
	 */
	public static function can_view_sitemaps(): bool {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Permission check: can the current user dispatch a sitemap rebuild?
	 *
	 * Rebuild scheduling writes to cron + transient state and can run for
	 * minutes on large sites, so it is gated on `manage_options` (admin only).
	 */
	public static function can_manage_sitemaps(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Execute: status read.
	 *
	 * Surfaces an opinionated, agent-friendly projection of the module's state:
	 * - `active` from `Jetpack::is_module_active`.
	 * - `url` from `jetpack_sitemap_uri()`, the same helper the public sitemap
	 *   router uses.
	 * - `post_count` / `page_count` from `wp_count_posts()->publish`, the
	 *   same baseline used by the WordPress core sitemap. Cheap; no joins.
	 * - `news_sitemap_enabled` from the `jetpack_news_sitemap_include_in_robotstxt`
	 *   filter (the same filter that controls news-sitemap robots.txt inclusion).
	 * - `sitemaps` from the served master sitemap document itself (see
	 *   `get_sitemap_entries()`) — the real child-sitemap list with each
	 *   entry's own `lastmod`, rather than a synthetic last-build timestamp.
	 *
	 * @param array|null $input Ability input (no parameters accepted).
	 * @return array
	 */
	public static function get_status( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		return array(
			'active'               => Jetpack::is_module_active( self::MODULE_SLUG ),
			'url'                  => static::get_master_sitemap_url(),
			'post_count'           => static::count_published( 'post' ),
			'page_count'           => static::count_published( 'page' ),
			'news_sitemap_enabled' => static::is_news_sitemap_enabled(),
			'sitemaps'             => static::get_sitemap_entries(),
		);
	}

	/**
	 * Execute: rebuild dispatch.
	 *
	 * Three-state idempotent dispatch:
	 *
	 * 1. If the state lock transient is set, a build step is currently
	 *    running. Return `dispatched=false`, `status=running`. We also surface
	 *    `already_running` as the alias the plan documents; this function
	 *    returns `running` as the canonical value so callers that branch on
	 *    one or the other both work — the output_schema enum permits both.
	 * 2. Else if a cron event is already scheduled in the future for our hook,
	 *    a build is queued. Return `dispatched=false`, `status=queued`.
	 * 3. Otherwise schedule a single-event cron tick to fire immediately and
	 *    return `dispatched=true`, `status=queued`.
	 *
	 * Every branch also returns `next_scheduled_at` (see
	 * `get_next_scheduled_at()`) so the caller learns when the queued/pending
	 * build will actually run without a follow-up status read.
	 *
	 * @param array|null $input Ability input (no parameters accepted).
	 * @return array
	 */
	public static function request_rebuild( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		if ( static::is_build_running() ) {
			return array(
				'dispatched'        => false,
				'status'            => 'running',
				'next_scheduled_at' => static::get_next_scheduled_at(),
			);
		}

		if ( static::is_build_queued() ) {
			return array(
				'dispatched'        => false,
				'status'            => 'queued',
				'next_scheduled_at' => static::get_next_scheduled_at(),
			);
		}

		static::schedule_rebuild();

		return array(
			'dispatched'        => true,
			'status'            => 'queued',
			'next_scheduled_at' => static::get_next_scheduled_at(),
		);
	}

	/**
	 * Public sitemap URL for the master sitemap.
	 *
	 * Extracted as a protected seam so tests can override without booting the
	 * rewrite/permalink stack.
	 */
	protected static function get_master_sitemap_url(): string {
		if ( function_exists( 'jetpack_sitemap_uri' ) ) {
			return (string) jetpack_sitemap_uri( 'sitemap.xml' );
		}
		// Defensive: when the sitemaps module file is loaded the helper
		// exists. This branch only runs if a caller invokes the ability
		// outside the normal bootstrap path.
		return (string) home_url( '/sitemap.xml' );
	}

	/**
	 * Raw master-sitemap XML — the exact document the public `sitemap.xml`
	 * router serves, read straight from storage via the librarian (no HTTP
	 * loopback). Returns an empty string when no master sitemap has been
	 * generated yet, or when the Sitemaps module helpers are unavailable.
	 *
	 * Extracted as a protected seam so tests can feed a known document without
	 * a librarian / wp_posts.
	 */
	protected static function get_master_sitemap_xml(): string {
		if (
			! class_exists( 'Jetpack_Sitemap_Librarian' )
			|| ! function_exists( 'jp_sitemap_filename' )
			|| ! defined( 'JP_MASTER_SITEMAP_TYPE' )
		) {
			return '';
		}

		$librarian = new \Jetpack_Sitemap_Librarian();

		// jp_sitemap_filename() is documented `@param string $number`; for the
		// master type it returns 'sitemap.xml' and ignores the number, but it
		// must be non-null and string-typed to satisfy the contract (the
		// int-`0` router call site predates this and is Phan-baselined).
		return (string) $librarian->get_sitemap_text(
			\jp_sitemap_filename( JP_MASTER_SITEMAP_TYPE, '0' ),
			JP_MASTER_SITEMAP_TYPE
		);
	}

	/**
	 * The child-sitemap entries actually present in the served master
	 * sitemap, as a list of `[ 'loc' => string, 'lastmod' => string|null ]`.
	 *
	 * Parses the same `<sitemapindex>` document `sitemap.xml` serves rather
	 * than deriving freshness from the `jetpack-sitemap-state` option: that
	 * option can read its initial/reset shape (no `max` projection) even while
	 * a fully-built sitemap.xml is being served, so it is not a reliable
	 * "what does the sitemap actually contain" source.
	 *
	 * Returns an empty array when no master sitemap exists yet or the stored
	 * document does not parse.
	 *
	 * @return array<int, array{loc:string, lastmod:string|null}>
	 */
	protected static function get_sitemap_entries(): array {
		$xml = static::get_master_sitemap_xml();
		if ( '' === $xml ) {
			return array();
		}

		$previous = libxml_use_internal_errors( true );
		$document = new \DOMDocument();
		// Source is Jetpack's own stored sitemap (not user input) and PHP 8+
		// disables external-entity loading by default; LIBXML_NONET is belt-
		// and-suspenders against any network/entity fetch during parsing.
		$loaded = $document->loadXML( $xml, LIBXML_NONET );
		libxml_clear_errors();
		libxml_use_internal_errors( $previous );

		if ( ! $loaded ) {
			return array();
		}

		$entries = array();
		foreach ( $document->getElementsByTagName( 'sitemap' ) as $sitemap_node ) {
			$loc_nodes = $sitemap_node->getElementsByTagName( 'loc' );
			if ( 0 === $loc_nodes->length ) {
				continue;
			}

			$loc = trim( $loc_nodes->item( 0 )->textContent );
			if ( '' === $loc ) {
				continue;
			}

			$lastmod_nodes = $sitemap_node->getElementsByTagName( 'lastmod' );
			$lastmod       = $lastmod_nodes->length > 0
				? trim( $lastmod_nodes->item( 0 )->textContent )
				: '';

			$entries[] = array(
				'loc'     => $loc,
				'lastmod' => '' === $lastmod ? null : $lastmod,
			);
		}

		return $entries;
	}

	/**
	 * Whether news-sitemap inclusion is enabled.
	 *
	 * Mirrors the filter chain in `Jetpack_Sitemap_Manager::callback_action_do_robotstxt`
	 * but only resolves the modern filter — the deprecated 7.4.0 alias is
	 * already merged into the modern filter by the time it runs in production.
	 */
	protected static function is_news_sitemap_enabled(): bool {
		/** This filter is documented in modules/sitemaps/sitemaps.php */
		return (bool) apply_filters( 'jetpack_news_sitemap_include_in_robotstxt', true );
	}

	/**
	 * Count published posts of a given post type.
	 *
	 * Wraps `wp_count_posts()` so tests can override without a real WP_Posts
	 * factory.
	 *
	 * @param string $post_type Post type slug.
	 */
	protected static function count_published( string $post_type ): int {
		$counts = wp_count_posts( $post_type );
		if ( ! is_object( $counts ) || ! isset( $counts->publish ) ) {
			return 0;
		}
		return (int) $counts->publish;
	}

	/**
	 * Whether a sitemap build step is currently running.
	 *
	 * The Sitemaps module sets a 15-minute transient lock at the start of
	 * `Jetpack_Sitemap_State::check_out()` and deletes it on `unlock()` /
	 * `reset()`. Presence of the transient is the canonical "in flight" signal.
	 */
	protected static function is_build_running(): bool {
		return true === get_transient( self::STATE_LOCK_TRANSIENT );
	}

	/**
	 * Whether a sitemap build is already scheduled for a future cron tick.
	 *
	 * Uses `wp_next_scheduled` so we don't stack duplicate single-event cron
	 * entries when the recurring `jp_sitemap_cron_hook` is already pending.
	 */
	protected static function is_build_queued(): bool {
		return false !== wp_next_scheduled( self::CRON_HOOK );
	}

	/**
	 * Schedule a single-event cron tick to drive the next build step.
	 *
	 * Matches the dispatch pattern used by
	 * `Jetpack_Sitemap_Manager::callback_action_purge_data` — `wp_schedule_single_event`
	 * with an immediate execution time. The recurring `sitemap-interval`
	 * schedule still fires on its normal cadence; this just front-runs the
	 * next tick.
	 */
	protected static function schedule_rebuild(): void {
		wp_schedule_single_event( time(), self::CRON_HOOK );
	}

	/**
	 * When the next `jp_sitemap_cron_hook` build tick is scheduled, as an
	 * ISO 8601 UTC string (e.g. `2026-05-19T19:33:20Z`), or null when nothing
	 * is scheduled.
	 *
	 * Returned alongside the dispatch result so callers immediately know when
	 * the build they queued (or the one already pending) will actually run,
	 * without a second round-trip. Null in the `running` case when the lock is
	 * held but no future tick is queued.
	 *
	 * ISO 8601 with the explicit `Z` zone designator (not `human_time_diff()`,
	 * not a bare "Y-m-d H:i:s") so the timezone is unambiguous and the value is
	 * locale-stable and machine-parseable — the same format the `sitemaps[]`
	 * `lastmod` values use in `get-status`.
	 */
	protected static function get_next_scheduled_at(): ?string {
		$timestamp = wp_next_scheduled( self::CRON_HOOK );
		if ( false === $timestamp ) {
			return null;
		}
		return gmdate( 'Y-m-d\TH:i:s\Z', $timestamp );
	}
}

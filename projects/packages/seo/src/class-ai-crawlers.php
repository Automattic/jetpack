<?php
/**
 * AI crawler access controls.
 *
 * Lets a site owner allow or block individual AI crawlers (training and
 * answer-engine bots) by appending per-user-agent `Disallow` rules to the
 * WordPress-generated robots.txt.
 *
 * The option `jetpack_seo_blocked_crawlers` holds the crawlers the owner blocked, per
 * group. Every other crawler is allowed, so robots.txt doesn't change when the SEO page
 * reaches a site (JETPACK-3135).
 *
 * Caveat: the `robots_txt` filter only feeds WordPress's *virtual* robots.txt.
 * A detected static file in the WordPress installation is not modified — a
 * limitation surfaced in the GEO tab (see {@see self::has_static_robots_txt()}).
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Emits robots.txt directives that block opted-out AI crawlers.
 */
class Ai_Crawlers {

	/**
	 * Option holding the blocked crawlers as `array( 'answer' => …, 'training' => … )`, each
	 * `'all'` (every crawler in the group, including ones added to the catalog later) or a
	 * list of slugs. A missing group or an empty list blocks nothing. Registered with
	 * `show_in_rest` by {@see Dashboard_Data::register_rest_settings()} so the GEO tab can save it.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_seo_blocked_crawlers';

	/**
	 * Option the GEO tab saved before {@see self::OPTION}: `slug => bool`, holding only changes
	 * from the old defaults (training crawlers blocked, answer engines allowed). Deleted once
	 * {@see self::migrate_legacy_overrides()} has copied it.
	 *
	 * @var string
	 */
	const LEGACY_OPTION = 'jetpack_seo_ai_crawler_overrides';

	/**
	 * Priority of {@see self::migrate_legacy_overrides()} on the `default_option_` filter.
	 *
	 * @var int
	 */
	const MIGRATION_PRIORITY = 20;

	/**
	 * The crawler groups, matching each catalog entry's `type`.
	 *
	 * @var string[]
	 */
	const GROUPS = array( 'answer', 'training' );

	/**
	 * The `robots_txt` priority: after WordPress.com Simple appends bare `Disallow`
	 * lines at 11, which would otherwise land in the last AI crawler group.
	 *
	 * @var int
	 */
	const ROBOTS_TXT_PRIORITY = 12;

	/**
	 * Wire the robots.txt filter.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'robots_txt', array( __CLASS__, 'append_directives' ), self::ROBOTS_TXT_PRIORITY, 2 );
	}

	/**
	 * The known AI crawler catalog: slug => [ label, user_agent, type ].
	 *
	 * `slug` is the stable key persisted in {@see self::OPTION} and sent by the GEO
	 * tab; `user_agent` is the token written to the `User-agent:` robots line;
	 * `label` is the human name shown in the UI; `type` is `answer` (fetches to
	 * cite in live AI answers) or `training` (collects to train models).
	 *
	 * @return array<string, array<string, string>>
	 */
	public static function get_catalog() {
		// Labels are the name a user is most likely to recognize, with the exact
		// robots.txt user-agent token in parentheses so a technical user can verify
		// the emitted directive (and to disambiguate the search/training pairs, e.g.
		// ChatGPT's GPTBot vs OAI-SearchBot).
		$catalog = array(
			// Answer-engine crawlers fetch pages so AI assistants can cite them in
			// live answers. Blocking them costs AI visibility.
			'oai-searchbot'      => array(
				'label'      => __( 'ChatGPT Search (OAI-SearchBot)', 'jetpack-seo' ),
				'user_agent' => 'OAI-SearchBot',
				'type'       => 'answer',
			),
			'claude-searchbot'   => array(
				'label'      => __( 'Claude Search (Claude-SearchBot)', 'jetpack-seo' ),
				'user_agent' => 'Claude-SearchBot',
				'type'       => 'answer',
			),
			'perplexitybot'      => array(
				'label'      => __( 'Perplexity (PerplexityBot)', 'jetpack-seo' ),
				'user_agent' => 'PerplexityBot',
				'type'       => 'answer',
			),
			'amzn-searchbot'     => array(
				'label'      => __( 'Amazon Alexa (Amzn-SearchBot)', 'jetpack-seo' ),
				'user_agent' => 'Amzn-SearchBot',
				'type'       => 'answer',
			),
			// Training crawlers collect content to train AI models. Blocking them doesn't
			// affect search results or Google's AI Overviews. Google-Extended also covers
			// Gemini app answers.
			'gptbot'             => array(
				'label'      => __( 'ChatGPT (GPTBot)', 'jetpack-seo' ),
				'user_agent' => 'GPTBot',
				'type'       => 'training',
			),
			'claudebot'          => array(
				'label'      => __( 'Claude (ClaudeBot)', 'jetpack-seo' ),
				'user_agent' => 'ClaudeBot',
				'type'       => 'training',
			),
			'google-extended'    => array(
				'label'      => __( 'Google Gemini (Google-Extended)', 'jetpack-seo' ),
				'user_agent' => 'Google-Extended',
				'type'       => 'training',
			),
			'applebot-extended'  => array(
				'label'      => __( 'Apple Intelligence (Applebot-Extended)', 'jetpack-seo' ),
				'user_agent' => 'Applebot-Extended',
				'type'       => 'training',
			),
			'meta-externalagent' => array(
				'label'      => __( 'Meta AI (meta-externalagent)', 'jetpack-seo' ),
				'user_agent' => 'meta-externalagent',
				'type'       => 'training',
			),
			'bytespider'         => array(
				'label'      => __( 'ByteDance (Bytespider)', 'jetpack-seo' ),
				'user_agent' => 'Bytespider',
				'type'       => 'training',
			),
			'ccbot'              => array(
				'label'      => __( 'Common Crawl (CCBot)', 'jetpack-seo' ),
				'user_agent' => 'CCBot',
				'type'       => 'training',
			),
			'amazonbot'          => array(
				// Amazon's own docs: Amazonbot "may be used to train Amazon AI
				// models" (Amzn-SearchBot is the answer-engine bot above).
				'label'      => __( 'Amazon (Amazonbot)', 'jetpack-seo' ),
				'user_agent' => 'Amazonbot',
				'type'       => 'training',
			),
		);

		return $catalog;
	}

	/**
	 * Whether WordPress.com's site-wide data-sharing opt-out is enabled.
	 *
	 * Its `robots_txt` filter remains authoritative over per-bot settings.
	 *
	 * @return bool
	 */
	public static function has_data_sharing_opt_out() {
		return (bool) get_option( 'wpcom_data_sharing_opt_out' );
	}

	/**
	 * The catalog slugs WordPress.com's data-sharing opt-out blocks while it's on.
	 *
	 * Mirrors the user-agent list in jetpack-mu-wpcom's blog-privacy `robots_txt` filter.
	 *
	 * @return string[]
	 */
	public static function get_data_sharing_blocked_slugs() {
		return array(
			'amazonbot',
			'applebot-extended',
			'bytespider',
			'ccbot',
			'claudebot',
			'google-extended',
			'gptbot',
			'meta-externalagent',
			'perplexitybot',
		);
	}

	/**
	 * The crawlers the owner blocked, per group.
	 *
	 * @return array<string, string|string[]> `'all'` or a list of slugs for each group.
	 */
	public static function get_blocked() {
		return self::sanitize_blocked( get_option( self::OPTION, array() ) );
	}

	/**
	 * Normalizes a stored or submitted {@see self::OPTION} value: both groups present, each
	 * `'all'` or a list of slugs. Drops unknown slugs and slugs from the other group, and
	 * saves a list naming every crawler in its group as `'all'`.
	 *
	 * @param mixed      $value   The value to normalize.
	 * @param array|null $catalog Optional {@see self::get_catalog()} result, to avoid building it again.
	 * @return array<string, string|string[]>
	 */
	public static function sanitize_blocked( $value, $catalog = null ) {
		$value   = is_array( $value ) ? $value : array();
		$catalog = is_array( $catalog ) ? $catalog : self::get_catalog();
		$groups  = array_fill_keys( self::GROUPS, array() );
		foreach ( $catalog as $slug => $info ) {
			if ( isset( $groups[ $info['type'] ] ) ) {
				$groups[ $info['type'] ][] = $slug;
			}
		}

		$blocked = array();
		foreach ( $groups as $type => $slugs ) {
			$group = $value[ $type ] ?? array();
			if ( 'all' === $group ) {
				$blocked[ $type ] = 'all';
				continue;
			}
			$list             = is_array( $group )
				? array_values( array_intersect( $slugs, array_filter( $group, 'is_string' ) ) )
				: array();
			$blocked[ $type ] = ( $slugs && count( $list ) === count( $slugs ) ) ? 'all' : $list;
		}

		return $blocked;
	}

	/**
	 * Run {@see self::migrate_legacy_overrides()} the first time {@see self::OPTION} is read while missing.
	 *
	 * @return void
	 */
	public static function register_legacy_migration() {
		// After register_setting()'s default (priority 10), which would replace the migrated value.
		add_filter( 'default_option_' . self::OPTION, array( __CLASS__, 'migrate_legacy_overrides' ), self::MIGRATION_PRIORITY );
	}

	/**
	 * `default_option_` callback: copies {@see self::LEGACY_OPTION} into {@see self::OPTION}, then deletes it.
	 *
	 * A training crawler saved as allowed means the owner worked on that group, so its unsaved
	 * siblings stay blocked. With no old option there is nothing to write.
	 *
	 * @param mixed $default_value The value `get_option()` would return for the missing option.
	 * @return mixed The migrated value, or `$default_value` when there is nothing to migrate.
	 */
	public static function migrate_legacy_overrides( $default_value ) {
		// The catalog loads translations, which must wait for `init`.
		if ( ! did_action( 'init' ) ) {
			return $default_value;
		}

		$legacy = get_option( self::LEGACY_OPTION );
		if ( ! is_array( $legacy ) ) {
			return $default_value;
		}

		$catalog          = self::get_catalog();
		$answer_blocked   = array();
		$training_allowed = array();
		foreach ( $legacy as $slug => $value ) {
			$type = $catalog[ $slug ]['type'] ?? null;
			if ( 'answer' === $type && $value ) {
				$answer_blocked[] = $slug;
			} elseif ( 'training' === $type && ! $value ) {
				$training_allowed[] = $slug;
			}
		}

		$training = array_keys( wp_list_filter( $catalog, array( 'type' => 'training' ) ) );
		$blocked  = self::sanitize_blocked(
			array(
				'answer'   => $answer_blocked,
				'training' => $training_allowed ? array_diff( $training, $training_allowed ) : array(),
			),
			$catalog
		);
		// add_option() applies this filter again. Re-armed after, for other sites read in this request.
		remove_filter( 'default_option_' . self::OPTION, array( __CLASS__, 'migrate_legacy_overrides' ), self::MIGRATION_PRIORITY );
		$added = add_option( self::OPTION, $blocked, '', true );
		self::register_legacy_migration();
		if ( $added ) {
			delete_option( self::LEGACY_OPTION );
		}

		return $blocked;
	}

	/**
	 * Whether a given crawler is currently blocked. Unknown slugs return false.
	 *
	 * @param string $slug Catalog slug.
	 * @return bool
	 */
	public static function is_blocked( $slug ) {
		return in_array( $slug, self::get_blocked_slugs(), true );
	}

	/**
	 * The catalog slugs currently blocked. While WordPress.com's data-sharing opt-out
	 * is on, its list replaces the owner's choices, as it does in robots.txt.
	 *
	 * @return string[]
	 */
	public static function get_blocked_slugs() {
		if ( self::has_data_sharing_opt_out() ) {
			return self::get_data_sharing_blocked_slugs();
		}

		$catalog = self::get_catalog();
		$blocked = self::sanitize_blocked( get_option( self::OPTION, array() ), $catalog );
		$slugs   = array();
		foreach ( $catalog as $slug => $info ) {
			$group = $blocked[ $info['type'] ] ?? array();
			if ( 'all' === $group || in_array( $slug, $group, true ) ) {
				$slugs[] = $slug;
			}
		}
		return $slugs;
	}

	/**
	 * Whether the site allows search-engine (and therefore AI-crawler) indexing.
	 *
	 * When `blog_public` is off, WordPress disallows everything in robots.txt, so
	 * per-crawler controls are moot — the GEO tab surfaces this instead of showing
	 * toggles that can't take effect.
	 *
	 * @return bool
	 */
	public static function search_engines_allowed() {
		return (int) get_option( 'blog_public', 1 ) === 1;
	}

	/**
	 * Whether the site is served from a WordPress.com staging subdomain
	 * (`*.wpcomstaging.com`) where the platform blocks all crawling regardless of
	 * the site's own settings — so AI-crawler controls can't take effect.
	 *
	 * @return bool
	 */
	public static function is_crawl_restricted_subdomain() {
		$host   = (string) wp_parse_url( home_url(), PHP_URL_HOST );
		$suffix = '.wpcomstaging.com';
		return strlen( $host ) > strlen( $suffix )
			&& substr( $host, -strlen( $suffix ) ) === $suffix;
	}

	/**
	 * Whether a static `robots.txt` file exists in the WordPress installation
	 * directory. These controls only change WordPress's virtual robots.txt and
	 * cannot modify that file.
	 *
	 * @return bool
	 */
	public static function has_static_robots_txt() {
		return Static_Files::exists( 'robots.txt' );
	}

	/**
	 * Whether this is a path-based multisite network.
	 *
	 * Such networks share one origin-level robots.txt, so per-site controls
	 * cannot be represented safely.
	 *
	 * @return bool
	 */
	public static function is_path_based_multisite() {
		return is_multisite() && ! is_subdomain_install();
	}

	/**
	 * Append `Disallow: /` blocks for each blocked AI crawler to robots.txt.
	 *
	 * @param string $output The robots.txt content assembled so far.
	 * @param bool   $public Whether the site is public (`blog_public`). Unused: the
	 *                       per-bot blocks apply either way.
	 * @return string The robots.txt content with AI-crawler directives appended.
	 */
	public static function append_directives( $output, $public ) {
		unset( $public );

		// WordPress.com's existing privacy filter owns the site-wide opt-out. Defer
		// to it instead of emitting duplicate directives from this per-bot filter.
		if ( self::is_path_based_multisite() || self::has_data_sharing_opt_out() ) {
			return $output;
		}

		$catalog = self::get_catalog();
		$blocked = self::get_blocked_slugs();
		if ( empty( $blocked ) ) {
			return $output;
		}

		$lines = array( '', '# AI crawlers blocked via Jetpack SEO.' );
		foreach ( $blocked as $slug ) {
			$lines[] = 'User-agent: ' . $catalog[ $slug ]['user_agent'];
			$lines[] = 'Disallow: /';
			$lines[] = '';
		}

		return $output . implode( "\n", $lines ) . "\n";
	}

	/**
	 * The GEO tab's crawler bootstrap payload: the catalog (camelCased for JS), the
	 * crawlers the owner blocked, the crawlers the data-sharing opt-out blocks, and the
	 * environment flags that decide whether the controls render or are replaced by an explanation.
	 *
	 * @return array
	 */
	public static function get_bootstrap_data() {
		$catalog = array();
		foreach ( self::get_catalog() as $slug => $info ) {
			$catalog[] = array(
				'slug'      => $slug,
				'label'     => $info['label'],
				'userAgent' => $info['user_agent'],
				'type'      => $info['type'],
			);
		}

		return array(
			'catalog'              => $catalog,
			'blocked'              => self::get_blocked(),
			'searchEnginesVisible' => self::search_engines_allowed(),
			'restrictedSubdomain'  => self::is_crawl_restricted_subdomain(),
			'staticRobotsTxt'      => self::has_static_robots_txt(),
			'dataSharingOptOut'    => self::has_data_sharing_opt_out(),
			'dataSharingBlocked'   => self::get_data_sharing_blocked_slugs(),
			'pathBasedMultisite'   => self::is_path_based_multisite(),
			'privacySettingsUrl'   => self::privacy_settings_url(),
			'robotsTxtUrl'         => home_url( '/robots.txt' ),
		);
	}

	/**
	 * URL of the site visibility settings (private, Coming Soon, "Prevent third-party
	 * sharing"), linked from the dashboard wherever one of them governs a toggle.
	 *
	 * Points at wp-admin → Settings → Reading, which is the same-origin home of those
	 * options on the sites where they exist (WordPress.com). Left as a package method
	 * so a Calypso deep link can replace it without touching the client.
	 *
	 * @return string
	 */
	public static function privacy_settings_url() {
		return admin_url( 'options-reading.php' );
	}
}

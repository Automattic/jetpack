<?php
/**
 * AI crawler access controls.
 *
 * Lets a site owner allow or block individual AI crawlers (training and
 * answer-engine bots) by appending per-user-agent `Disallow` rules to the
 * WordPress-generated robots.txt.
 *
 * Persistence uses a STORE-INTENT model rather than a literal blocked list. The
 * durable option `jetpack_seo_ai_crawler_overrides` holds only *deviations* from
 * each bot's default policy (training crawlers blocked, answer-engine crawlers
 * allowed); a bot with no stored override falls back to its default.
 * This keeps the stored map sparse and means newly added training crawlers are
 * covered automatically without a migration.
 *
 * Caveat: the `robots_txt` filter only feeds WordPress's *virtual* robots.txt.
 * A detected static file in the WordPress installation is not modified — a
 * limitation surfaced in the AI tab (see {@see self::has_static_robots_txt()}).
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Emits robots.txt directives that block opted-out AI crawlers.
 */
class Ai_Crawlers {

	/**
	 * Option holding the sparse map of per-crawler overrides
	 * (`slug => bool`, true = blocked). Only entries that deviate from the bot's
	 * default policy are stored. Mirrored in the plugin's settings endpoint
	 * whitelist (`jp_group => 'seo-tools'`).
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_seo_ai_crawler_overrides';

	/**
	 * Wire the robots.txt filter.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'robots_txt', array( __CLASS__, 'append_directives' ), 10, 2 );
	}

	/**
	 * The known AI crawler catalog: slug => [ label, user_agent, type ].
	 *
	 * `slug` is the stable key persisted in the override map and sent by the AI
	 * tab; `user_agent` is the token written to the `User-agent:` robots line;
	 * `label` is the human name shown in the UI; `type` is `answer` (fetches to
	 * cite in live AI answers) or `training` (collects to train models; some, like
	 * Google Gemini, also ground AI answers but are filed here). Training crawlers
	 * are blocked by default; answer-engine crawlers are allowed.
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
			// live answers. Allowed by default — blocking them costs AI visibility.
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
			// Training crawlers collect content to train AI models. Blocked by
			// default. Some (e.g. Google Gemini) are also used to ground live AI
			// answers, so blocking them protects privacy but can cost that
			// visibility — filed here as training and blocked by default so the
			// owner actively opts in.
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
	 * Whether a catalog bot is blocked when the owner hasn't set an override for
	 * it: training crawlers are blocked by default; answer-engine crawlers are
	 * allowed.
	 *
	 * @param string $slug Catalog slug.
	 * @return bool
	 */
	private static function is_blocked_by_default( $slug ) {
		$catalog = self::get_catalog();
		return isset( $catalog[ $slug ] ) && 'training' === $catalog[ $slug ]['type'];
	}

	/**
	 * Whether WordPress.com's site-wide data-sharing opt-out is enabled.
	 *
	 * Its later `robots_txt` filter remains authoritative over per-bot settings.
	 *
	 * @return bool
	 */
	public static function has_data_sharing_opt_out() {
		return (bool) get_option( 'wpcom_data_sharing_opt_out' );
	}

	/**
	 * Whether the existing data-sharing policy forces a catalog bot to be blocked.
	 *
	 * @param string $slug Catalog slug.
	 * @return bool
	 */
	private static function is_blocked_by_data_sharing_policy( $slug ) {
		return self::has_data_sharing_opt_out()
			&& in_array(
				$slug,
				array(
					'amazonbot',
					'applebot-extended',
					'bytespider',
					'ccbot',
					'claudebot',
					'google-extended',
					'gptbot',
					'meta-externalagent',
					'perplexitybot',
				),
				true
			);
	}

	/**
	 * The resolved, sparse override map: `slug => bool` (true = blocked).
	 *
	 * Reads the stored option, drops unknown slugs, casts values to bool, and
	 * drops any entry that equals the bot's default policy — so the returned map
	 * contains only real deviations. A bot absent from this map falls back to its
	 * default in {@see self::is_blocked()}.
	 *
	 * @return array<string, bool>
	 */
	public static function get_overrides() {
		$stored = get_option( self::OPTION, array() );
		if ( ! is_array( $stored ) ) {
			return array();
		}

		$catalog   = self::get_catalog();
		$overrides = array();
		foreach ( $stored as $slug => $blocked ) {
			if ( ! isset( $catalog[ $slug ] ) ) {
				continue;
			}
			$blocked = (bool) $blocked;
			// Only keep entries that actually deviate from the default policy
			// (training blocked, answer-engine allowed) — resolved from the
			// catalog we already hold rather than re-fetching it per slug.
			if ( $blocked === ( 'training' === $catalog[ $slug ]['type'] ) ) {
				continue;
			}
			$overrides[ $slug ] = $blocked;
		}

		return $overrides;
	}

	/**
	 * Whether a given crawler is currently blocked, applying an override when one
	 * exists and otherwise the bot's default policy. Unknown slugs return false.
	 *
	 * @param string $slug Catalog slug.
	 * @return bool
	 */
	public static function is_blocked( $slug ) {
		$catalog = self::get_catalog();
		if ( ! isset( $catalog[ $slug ] ) ) {
			return false;
		}
		if ( self::is_blocked_by_data_sharing_policy( $slug ) ) {
			return true;
		}

		$overrides = self::get_overrides();
		return array_key_exists( $slug, $overrides )
			? $overrides[ $slug ]
			: self::is_blocked_by_default( $slug );
	}

	/**
	 * The catalog slugs currently blocked (override or default).
	 *
	 * @return string[]
	 */
	public static function get_blocked_slugs() {
		// Resolve the override map and catalog once, then fold in the per-type
		// default — rather than calling is_blocked() per slug (which would re-read
		// the option and rebuild the catalog on every robots.txt render).
		$overrides = self::get_overrides();
		$blocked   = array();
		foreach ( self::get_catalog() as $slug => $info ) {
			$is_blocked = self::is_blocked_by_data_sharing_policy( $slug )
				|| ( array_key_exists( $slug, $overrides )
					? $overrides[ $slug ]
					: ( 'training' === $info['type'] ) );
			if ( $is_blocked ) {
				$blocked[] = $slug;
			}
		}
		return $blocked;
	}

	/**
	 * Whether the site allows search-engine (and therefore AI-crawler) indexing.
	 *
	 * When `blog_public` is off, WordPress disallows everything in robots.txt, so
	 * per-crawler controls are moot — the AI tab surfaces this instead of showing
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
		return file_exists( ABSPATH . 'robots.txt' );
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
	 * @param bool   $public Whether the site is public (`blog_public`). When
	 *                       false WordPress already disallows everything, but the
	 *                       explicit per-bot blocks are still valid and harmless.
	 * @return string The robots.txt content with AI-crawler directives appended.
	 */
	public static function append_directives( $output, $public ) {
		unset( $public );

		// WordPress.com's existing privacy filter owns the site-wide opt-out and
		// runs later at priority 12. Defer to it instead of emitting duplicate
		// directives from this per-bot filter.
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
	 * The AI tab's crawler bootstrap payload: the catalog (camelCased for JS), the
	 * current sparse override map, and the environment flags that decide whether
	 * the controls render or are replaced by an explanation.
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
			'overrides'            => (object) self::get_overrides(),
			'searchEnginesVisible' => self::search_engines_allowed(),
			'restrictedSubdomain'  => self::is_crawl_restricted_subdomain(),
			'staticRobotsTxt'      => self::has_static_robots_txt(),
			'dataSharingOptOut'    => self::has_data_sharing_opt_out(),
			'pathBasedMultisite'   => self::is_path_based_multisite(),
			'privacySettingsUrl'   => self::privacy_settings_url(),
			'robotsTxtUrl'         => home_url( '/robots.txt' ),
		);
	}

	/**
	 * URL of the settings screen holding "Prevent third-party sharing", linked from
	 * the AI tab when that setting is governing crawler access.
	 *
	 * Points at wp-admin → Settings → Reading, which is the same-origin home of the
	 * option on the sites where it exists (WordPress.com). Left as a package method
	 * so a Calypso deep link can replace it without touching the client.
	 *
	 * @return string
	 */
	public static function privacy_settings_url() {
		return admin_url( 'options-reading.php' );
	}
}

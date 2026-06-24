<?php
/**
 * AI crawler access controls.
 *
 * Lets a site owner block individual AI crawlers (training and answer-engine
 * bots) from accessing the site by appending per-user-agent `Disallow` rules to
 * the WordPress-generated robots.txt. The blocked list is the durable option
 * `jetpack_seo_blocked_ai_crawlers` (round-tripped through the existing
 * `/jetpack/v4/settings` endpoint by the AI tab); this catalog is the source of
 * truth for which slugs map to which user-agent token.
 *
 * Caveat: the `robots_txt` filter only feeds WordPress's *virtual* robots.txt.
 * A site serving a physical robots.txt file bypasses it entirely — a real
 * limitation to weigh for the production feature (Phase 1: AI Crawler
 * Management).
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Emits robots.txt directives that block opted-out AI crawlers.
 */
class Ai_Crawlers {

	/**
	 * Option holding the list of blocked AI crawler slugs (array of slugs from
	 * the catalog below). Mirrored as a literal in the plugin's settings
	 * endpoint whitelist (`jp_group => 'seo-tools'`).
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_seo_blocked_ai_crawlers';

	/**
	 * Wire the robots.txt filter.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'robots_txt', array( __CLASS__, 'append_directives' ), 10, 2 );
	}

	/**
	 * The known AI crawler catalog: slug => [ label, user_agent, type, doc_url ].
	 *
	 * `slug` is the stable key persisted in the option and sent by the AI tab;
	 * `user_agent` is the token written to the `User-agent:` robots line (and shown
	 * in the "Learn what X does" link text); `label` is the human name shown in the
	 * UI; `type` is `answer` (fetches to cite in live AI answers) or `training`
	 * (collects to train models), which drives the AI tab's two sections and the
	 * per-type default; `doc_url` is the operator's own documentation page for that
	 * bot (empty when none exists, e.g. Bytespider). Kept deliberately small and
	 * recognizable — the better-known crawlers.
	 *
	 * @return array<string, array{label: string, user_agent: string, type: string, doc_url: string}>
	 */
	public static function get_catalog() {
		return array(
			// Answer-engine crawlers fetch pages so AI assistants can cite them in
			// live answers. Allowed by default — blocking them costs AI visibility.
			'oai-searchbot'      => array(
				'label'      => __( 'ChatGPT Search (OpenAI)', 'jetpack-seo' ),
				'user_agent' => 'OAI-SearchBot',
				'type'       => 'answer',
				'doc_url'    => 'https://developers.openai.com/api/docs/bots',
			),
			'claude-searchbot'   => array(
				'label'      => __( 'Claude Search (Anthropic)', 'jetpack-seo' ),
				'user_agent' => 'Claude-SearchBot',
				'type'       => 'answer',
				'doc_url'    => 'https://support.claude.com/en/articles/8896518',
			),
			'perplexitybot'      => array(
				'label'      => __( 'Perplexity', 'jetpack-seo' ),
				'user_agent' => 'PerplexityBot',
				'type'       => 'answer',
				'doc_url'    => 'https://docs.perplexity.ai/guides/bots',
			),
			'amzn-searchbot'     => array(
				'label'      => __( 'Amazon (Alexa)', 'jetpack-seo' ),
				'user_agent' => 'Amzn-SearchBot',
				'type'       => 'answer',
				'doc_url'    => 'https://developer.amazon.com/amazonbot',
			),
			// Training crawlers collect content to train AI models. Blocked by
			// default — blocking protects content with no AI-visibility downside.
			'gptbot'             => array(
				'label'      => __( 'ChatGPT (OpenAI)', 'jetpack-seo' ),
				'user_agent' => 'GPTBot',
				'type'       => 'training',
				'doc_url'    => 'https://developers.openai.com/api/docs/bots',
			),
			'claudebot'          => array(
				'label'      => __( 'Claude (Anthropic)', 'jetpack-seo' ),
				'user_agent' => 'ClaudeBot',
				'type'       => 'training',
				'doc_url'    => 'https://support.claude.com/en/articles/8896518',
			),
			'google-extended'    => array(
				'label'      => __( 'Google AI (Gemini)', 'jetpack-seo' ),
				'user_agent' => 'Google-Extended',
				'type'       => 'training',
				'doc_url'    => 'https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers',
			),
			'applebot-extended'  => array(
				'label'      => __( 'Apple Intelligence', 'jetpack-seo' ),
				'user_agent' => 'Applebot-Extended',
				'type'       => 'training',
				'doc_url'    => 'https://support.apple.com/en-us/119829',
			),
			'meta-externalagent' => array(
				'label'      => __( 'Meta AI', 'jetpack-seo' ),
				'user_agent' => 'meta-externalagent',
				'type'       => 'training',
				'doc_url'    => 'https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/',
			),
			'bytespider'         => array(
				// ByteDance publishes no official English documentation page for
				// Bytespider, so no "Learn what it does" link is shown for it.
				'label'      => __( 'ByteDance', 'jetpack-seo' ),
				'user_agent' => 'Bytespider',
				'type'       => 'training',
				'doc_url'    => '',
			),
			'ccbot'              => array(
				'label'      => __( 'Common Crawl', 'jetpack-seo' ),
				'user_agent' => 'CCBot',
				'type'       => 'training',
				'doc_url'    => 'https://commoncrawl.org/ccbot',
			),
			'amazonbot'          => array(
				// Amazon's own docs: Amazonbot "may be used to train Amazon AI
				// models" (Amzn-SearchBot is the answer-engine bot above).
				'label'      => __( 'Amazon', 'jetpack-seo' ),
				'user_agent' => 'Amazonbot',
				'type'       => 'training',
				'doc_url'    => 'https://developer.amazon.com/amazonbot',
			),
		);
	}

	/**
	 * Return the sanitized list of currently blocked crawler slugs, limited to
	 * slugs that exist in the catalog (unknown slugs are ignored).
	 *
	 * @return string[]
	 */
	public static function get_blocked_slugs() {
		$stored = get_option( self::OPTION, null );
		// Unconfigured (option never saved): fall back to the privacy-protective
		// default — training crawlers blocked, answer engines allowed.
		if ( null === $stored ) {
			return self::default_blocked_slugs();
		}
		if ( ! is_array( $stored ) ) {
			return array();
		}
		return array_values( array_intersect( $stored, array_keys( self::get_catalog() ) ) );
	}

	/**
	 * The slugs blocked by default before the owner has configured anything: every
	 * training crawler. Answer-engine crawlers stay allowed so the site can still
	 * be cited in AI answers.
	 *
	 * @return string[]
	 */
	public static function default_blocked_slugs() {
		$blocked = array();
		foreach ( self::get_catalog() as $slug => $info ) {
			if ( 'training' === $info['type'] ) {
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
	 * Whether a physical `robots.txt` exists at the web root. The web server
	 * serves that file directly, bypassing WordPress's virtual robots.txt — so our
	 * `robots_txt` filter (and therefore these settings) never run. Common on
	 * local, sandbox, and staging sites.
	 *
	 * @return bool
	 */
	public static function has_static_robots_txt() {
		return file_exists( ABSPATH . 'robots.txt' );
	}

	/**
	 * Append `Disallow: /` blocks for each opted-out AI crawler to robots.txt.
	 *
	 * @param string $output The robots.txt content assembled so far.
	 * @param bool   $public Whether the site is public (`blog_public`). When
	 *                       false WordPress already disallows everything, but the
	 *                       explicit per-bot blocks are still valid and harmless.
	 * @return string The robots.txt content with AI-crawler directives appended.
	 */
	public static function append_directives( $output, $public ) {
		unset( $public );

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
}

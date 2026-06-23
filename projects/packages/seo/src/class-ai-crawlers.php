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
	 * The known AI crawler catalog: slug => [ label, user_agent ].
	 *
	 * `slug` is the stable key persisted in the option and sent by the AI tab;
	 * `user_agent` is the token written to the `User-agent:` robots line;
	 * `label` is the human name shown in the UI. Kept deliberately small and
	 * recognizable — the better-known training and answer-engine crawlers.
	 *
	 * @return array<string, array{label: string, user_agent: string}>
	 */
	public static function get_catalog() {
		return array(
			'gptbot'             => array(
				'label'      => __( 'ChatGPT (OpenAI)', 'jetpack-seo' ),
				'user_agent' => 'GPTBot',
			),
			'oai-searchbot'      => array(
				'label'      => __( 'ChatGPT Search (OpenAI)', 'jetpack-seo' ),
				'user_agent' => 'OAI-SearchBot',
			),
			'claudebot'          => array(
				'label'      => __( 'Claude (Anthropic)', 'jetpack-seo' ),
				'user_agent' => 'ClaudeBot',
			),
			'perplexitybot'      => array(
				'label'      => __( 'Perplexity', 'jetpack-seo' ),
				'user_agent' => 'PerplexityBot',
			),
			'google-extended'    => array(
				'label'      => __( 'Google AI (Gemini)', 'jetpack-seo' ),
				'user_agent' => 'Google-Extended',
			),
			'applebot-extended'  => array(
				'label'      => __( 'Apple Intelligence', 'jetpack-seo' ),
				'user_agent' => 'Applebot-Extended',
			),
			'meta-externalagent' => array(
				'label'      => __( 'Meta AI', 'jetpack-seo' ),
				'user_agent' => 'meta-externalagent',
			),
			'amazonbot'          => array(
				'label'      => __( 'Amazon', 'jetpack-seo' ),
				'user_agent' => 'Amazonbot',
			),
			'bytespider'         => array(
				'label'      => __( 'ByteDance (Bytespider)', 'jetpack-seo' ),
				'user_agent' => 'Bytespider',
			),
			'ccbot'              => array(
				'label'      => __( 'Common Crawl', 'jetpack-seo' ),
				'user_agent' => 'CCBot',
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
		$stored = get_option( self::OPTION, array() );
		if ( ! is_array( $stored ) ) {
			return array();
		}
		return array_values( array_intersect( $stored, array_keys( self::get_catalog() ) ) );
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

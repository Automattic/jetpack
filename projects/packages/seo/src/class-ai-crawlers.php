<?php
/**
 * AI crawler management.
 *
 * Filters the generated robots.txt output to append allow/block directives
 * for the major LLM crawlers. The free-tier feature the PRD leans on as
 * the strategic differentiator against Yoast Premium's Bot Blocker.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Appends per-crawler rules to robots.txt.
 */
class AI_Crawlers {

	const OPTION = 'jetpack_seo_ai_crawlers';

	/**
	 * Canonical list of known AI crawler user-agents. Exposed so the REST
	 * layer and the React screen agree on the supported set.
	 *
	 * @return string[]
	 */
	public static function get_known_bots() {
		return array(
			'GPTBot',
			'ClaudeBot',
			'Google-Extended',
			'PerplexityBot',
			'CCBot',
			'anthropic-ai',
		);
	}

	/**
	 * Read the stored allow/block config merged with defaults.
	 *
	 * @return array<string, string>
	 */
	public static function get_state() {
		$stored = get_option( self::OPTION, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		$state = array();
		foreach ( self::get_known_bots() as $bot ) {
			$value = $stored[ $bot ] ?? 'allow';
			if ( ! in_array( $value, array( 'allow', 'block' ), true ) ) {
				$value = 'allow';
			}
			$state[ $bot ] = $value;
		}
		return $state;
	}

	/**
	 * Persist the allow/block state.
	 *
	 * @param array $input Partial or full crawler → 'allow'|'block' map.
	 * @return array The normalized state that was saved.
	 */
	public static function save_state( array $input ) {
		$state = self::get_state();
		foreach ( self::get_known_bots() as $bot ) {
			if ( isset( $input[ $bot ] ) && in_array( $input[ $bot ], array( 'allow', 'block' ), true ) ) {
				$state[ $bot ] = $input[ $bot ];
			}
		}
		update_option( self::OPTION, $state );
		return $state;
	}

	/**
	 * Wire the robots_txt filter.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'robots_txt', array( __CLASS__, 'filter_robots_txt' ), 20, 2 );
	}

	/**
	 * Append User-agent / Disallow blocks for each bot the user has chosen to block.
	 *
	 * @param string $output The robots.txt body being generated.
	 * @param bool   $public Whether the site is publicly crawlable.
	 * @return string
	 */
	public static function filter_robots_txt( $output, $public ) {
		if ( ! $public ) {
			// When the site is set to private, WordPress already blocks everyone.
			return $output;
		}

		$state   = self::get_state();
		$blocked = array_filter(
			$state,
			static function ( $value ) {
				return 'block' === $value;
			}
		);
		if ( empty( $blocked ) ) {
			return $output;
		}

		$append = "\n# Jetpack SEO — AI crawler rules\n";
		foreach ( array_keys( $blocked ) as $bot ) {
			$append .= "User-agent: $bot\n";
			$append .= "Disallow: /\n\n";
		}
		return rtrim( $output ) . "\n" . $append;
	}
}

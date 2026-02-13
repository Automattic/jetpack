<?php
/**
 * AI Experiments orchestrator.
 *
 * Manages experiment toggles and delegates to feature classes.
 * Each experiment is gated by a filter: jetpack_ai_experiments_{$slug}.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Device_Detection\User_Agent_Info;

/**
 * Orchestrator for the AI Experiments module.
 */
class Jetpack_AI_Experiments {

	/**
	 * Registered experiments: slug => default enabled state.
	 *
	 * @var array<string, bool>
	 */
	private static $experiments = array(
		'ai_bot_header' => true,
	);

	/**
	 * Initialize the module. Iterates experiments and wires enabled ones.
	 */
	public static function init() {
		foreach ( self::$experiments as $slug => $default ) {
			if ( ! self::is_enabled( $slug ) ) {
				continue;
			}

			switch ( $slug ) {
				case 'ai_bot_header':
					add_action( 'send_headers', array( __CLASS__, 'add_ai_bot_header' ) );
					break;
			}
		}
	}

	/**
	 * Check whether an experiment is enabled.
	 *
	 * @param string $experiment Experiment slug.
	 * @return bool
	 */
	public static function is_enabled( $experiment ) {
		$default = isset( self::$experiments[ $experiment ] ) ? self::$experiments[ $experiment ] : false;

		/**
		 * Filter to enable or disable an AI experiment.
		 *
		 * The dynamic portion of the hook name, `$experiment`, refers to the experiment slug.
		 *
		 * @param bool $enabled Whether the experiment is enabled.
		 */
		return (bool) apply_filters( "jetpack_ai_experiments_{$experiment}", $default );
	}

	/**
	 * Detect whether the current request is from an AI bot/agent.
	 *
	 * Delegates to User_Agent_Info::is_agent() from the device-detection package
	 * when available, with a hardcoded fallback for environments without it.
	 *
	 * @return bool
	 */
	public static function is_ai_bot() {
		if ( class_exists( User_Agent_Info::class ) && method_exists( User_Agent_Info::class, 'is_agent' ) ) {
			return User_Agent_Info::is_agent();
		}

		return self::is_ai_bot_fallback();
	}

	/**
	 * Fallback AI bot detection for environments without the device-detection package.
	 *
	 * @return bool
	 */
	private static function is_ai_bot_fallback() {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			return false;
		}

		$ua       = sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) );
		$patterns = array(
			'claudebot',
			'claude-web',
			'anthropic-ai',
			'chatgpt-user',
			'gptbot',
			'oai-searchbot',
			'google-extended',
			'gemini',
			'perplexitybot',
			'cohere-ai',
			'bytespider',
			'ccbot',
		);

		$ua_lower = strtolower( $ua );
		foreach ( $patterns as $pattern ) {
			if ( false !== strpos( $ua_lower, $pattern ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Send X-AI-Bot response header indicating whether the request is from an AI agent.
	 */
	public static function add_ai_bot_header() {
		if ( headers_sent() ) {
			return;
		}

		header( 'X-AI-Bot: ' . ( self::is_ai_bot() ? 'true' : 'false' ) );
	}
}

<?php
/**
 * AI Answers feature — behavior meta and enabled flag.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Registers behavior meta on the Gutenberg Guidelines CPT and exposes the
 * jetpack_search_ai_answers_enabled option.
 */
class AI_Answers {
	const BEHAVIOR_META_KEY   = '_guideline_block_jetpack_search-ai-summary';
	const BEHAVIOR_OPTION_KEY = 'jetpack_search_ai_behavior_instructions';

	/**
	 * Hook up meta/setting registration.
	 */
	public function init() {
		add_action( 'rest_api_init', array( $this, 'register_behavior_meta' ) );
	}

	/**
	 * Register the behavior instructions storage for the REST API.
	 *
	 * When the Gutenberg Guidelines CPT is present, registers the block-specific
	 * meta key on it. Otherwise registers a site option exposed via /wp/v2/settings.
	 */
	public function register_behavior_meta() {
		if ( post_type_exists( 'wp_guideline' ) ) {
			register_post_meta(
				'wp_guideline',
				self::BEHAVIOR_META_KEY,
				array(
					'single'            => true,
					'type'              => 'string',
					'show_in_rest'      => true,
					'default'           => '',
					'sanitize_callback' => 'sanitize_textarea_field',
					'auth_callback'     => function () {
						return current_user_can( 'manage_options' );
					},
				)
			);
			return;
		}

		register_setting(
			'options',
			self::BEHAVIOR_OPTION_KEY,
			array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'sanitize_textarea_field',
				'show_in_rest'      => true,
			)
		);
	}

	/**
	 * Retrieve the behavior instructions.
	 *
	 * Reads from the Gutenberg Guidelines CPT when available, otherwise falls
	 * back to the site option.
	 *
	 * @return string Behavior instructions, or empty string if none saved.
	 */
	public static function get_behavior_instructions() {
		if ( post_type_exists( 'wp_guideline' ) ) {
			$posts = get_posts(
				array(
					'post_type'      => 'wp_guideline',
					'posts_per_page' => 1,
					'post_status'    => 'publish',
				)
			);
			if ( ! empty( $posts ) ) {
				$guidelines = get_post_meta( $posts[0]->ID, self::BEHAVIOR_META_KEY, true );
				return is_string( $guidelines ) ? $guidelines : '';
			}
		}
		return (string) get_option( self::BEHAVIOR_OPTION_KEY, '' );
	}

	/**
	 * Whether AI Answers is enabled for the current site.
	 */
	public static function is_enabled() {
		return (bool) apply_filters(
			'jetpack_search_ai_answers_enabled',
			(bool) get_option( 'jetpack_search_ai_answers_enabled', false )
		);
	}
}

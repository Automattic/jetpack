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
	const BEHAVIOR_META_KEY = '_guideline_block_jetpack_search-ai-summary';

	/**
	 * Hook up meta registration.
	 */
	public function init() {
		add_action( 'rest_api_init', array( $this, 'register_behavior_meta' ) );
	}

	/**
	 * Register the block-specific meta key on the Gutenberg Guidelines CPT so it is
	 * included in REST responses.
	 */
	public function register_behavior_meta() {
		if ( ! post_type_exists( 'wp_guideline' ) ) {
			return;
		}
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
	}

	/**
	 * Retrieve the behavior instructions from the Gutenberg Guidelines singleton.
	 *
	 * @return string Behavior instructions, or empty string if none saved.
	 */
	public static function get_behavior_instructions() {
		$posts = get_posts(
			array(
				'post_type'      => 'wp_guideline',
				'posts_per_page' => 1,
				'post_status'    => 'publish',
			)
		);
		if ( empty( $posts ) ) {
			return '';
		}
		$guidelines = get_post_meta( $posts[0]->ID, self::BEHAVIOR_META_KEY, true );
		return is_string( $guidelines ) ? $guidelines : '';
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

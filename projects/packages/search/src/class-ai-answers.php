<?php
/**
 * AI Answers feature — CPT and postmeta registration.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Registers the jetpack_search_topic CPT and exposes the jetpack_search_ai_answers_enabled filter.
 *
 * Behavior instructions are stored via the Gutenberg Guidelines API
 * (/wp/v2/guidelines, `guideline_categories.blocks["jetpack/search-ai-summary"].guidelines`).
 */
class AI_Answers {
	const TOPIC_CPT         = 'jetpack_search_topic';
	const BEHAVIOR_META_KEY = '_guideline_block_jetpack_search-ai-summary';

	/**
	 * Hook up CPT registration.
	 */
	public function init() {
		add_action( 'init', array( $this, 'register_post_types' ) );
		add_action( 'rest_api_init', array( $this, 'register_behavior_meta' ) );
	}

	/**
	 * Register the block-specific meta key on the Gutenberg Guidelines CPT so it is
	 * included in REST responses (Gutenberg only auto-registers meta for blocks that have
	 * content-role attributes in the block registry; ours won't be there yet).
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
	 * Register topic CPT and its postmeta.
	 */
	public function register_post_types() {
		register_post_type(
			self::TOPIC_CPT,
			array(
				'labels'          => array(
					'name'          => 'Search Topics',
					'singular_name' => 'Search Topic',
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => false,
				'show_in_rest'    => true,
				'rest_base'       => 'jetpack-search-topics',
				'supports'        => array( 'title', 'editor' ),
				'capability_type' => 'post',
				'map_meta_cap'    => true,
			)
		);

		register_post_meta(
			self::TOPIC_CPT,
			'_jstopic_keywords',
			array(
				'single'            => true,
				'type'              => 'string',
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_post_meta(
			self::TOPIC_CPT,
			'_jstopic_url',
			array(
				'single'            => true,
				'type'              => 'string',
				'show_in_rest'      => true,
				'sanitize_callback' => 'esc_url_raw',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
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

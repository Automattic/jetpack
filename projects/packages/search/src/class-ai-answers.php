<?php
/**
 * AI Answers feature — CPT and postmeta registration.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Registers the jetpack_search_behavior and jetpack_search_topic CPTs
 * and exposes the jetpack_search_ai_answers_enabled filter.
 */
class AI_Answers {
	const BEHAVIOR_CPT = 'jp_search_behavior';
	const TOPIC_CPT    = 'jetpack_search_topic';

	/**
	 * Hook up CPT registration.
	 */
	public function init() {
		add_action( 'init', array( $this, 'register_post_types' ) );
	}

	/**
	 * Register both CPTs and their postmeta.
	 */
	public function register_post_types() {
		register_post_type(
			self::BEHAVIOR_CPT,
			array(
				'labels'          => array(
					'name'          => 'Search Behavior',
					'singular_name' => 'Search Behavior',
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => false,
				'show_in_rest'    => true,
				'rest_base'       => 'jetpack-search-behavior',
				'supports'        => array( 'editor' ),
				'capability_type' => 'post',
				'map_meta_cap'    => true,
			)
		);

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

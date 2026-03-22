<?php
/**
 * Title optimization ability registration and execution.
 *
 * The UI calls the wp-orchestrator endpoint directly (POST /wpcom/v2/ai/agent)
 * with agent_id "wp-orchestrator" and ability "wpcom/optimize-title".  This
 * class registers the ability with the WordPress Abilities API so the
 * orchestrator can discover it, and provides an execute callback for any
 * server-side (non-orchestrator) invocation.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Ability API added in WP 6.9, but we keep compatibility with older WP in CI.

namespace Automattic\Jetpack\Extensions\AIAssistant;

use WP_Error;

/**
 * Registers and executes the title optimization ability.
 */
class Title_Optimization_Ability {
	/**
	 * Ability category slug.
	 *
	 * @var string
	 */
	const CATEGORY_SLUG = 'jetpack-ai';

	/**
	 * Ability name.
	 *
	 * @var string
	 */
	const ABILITY_NAME = 'wpcom/optimize-title';

	/**
	 * Feature name used by the orchestrator.
	 *
	 * @var string
	 */
	const FEATURE_NAME = 'jetpack-ai-title-optimization';

	/**
	 * Initialize ability registration.
	 *
	 * @return void
	 */
	public static function init() {
		// wp_register_ability() requires doing_action('wp_abilities_api_init') — it
		// returns null if called after the action completes. Always hook the action;
		// if it already fired this request, the hook won't run (which is fine since
		// the ability was already registered by a previous call).
		add_action( 'wp_abilities_api_categories_init', array( __CLASS__, 'register_category' ) );
		add_action( 'wp_abilities_api_init', array( __CLASS__, 'register_ability' ) );
	}

	/**
	 * Register the ability category.
	 *
	 * @return void
	 */
	public static function register_category() {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		// Avoid re-registering if another call path already registered the category.
		if ( function_exists( 'wp_get_ability_categories' ) ) {
			$existing = wp_get_ability_categories();
			foreach ( $existing as $cat ) {
				$slug = method_exists( $cat, 'get_slug' ) ? $cat->get_slug() : '';
				if ( self::CATEGORY_SLUG === $slug ) {
					return;
				}
			}
		}

		wp_register_ability_category(
			self::CATEGORY_SLUG,
			array(
				// "Jetpack AI" is a product name and should not be translated.
				'label'       => 'Jetpack AI',
				'description' => __( 'Abilities for Jetpack AI features.', 'jetpack' ),
			)
		);
	}

	/**
	 * Register the title optimization ability.
	 *
	 * @return void
	 */
	public static function register_ability() {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		// Avoid re-registering if another call path already registered the ability.
		if ( function_exists( 'wp_get_abilities' ) ) {
			$existing = wp_get_abilities();
			foreach ( $existing as $ability ) {
				$name = method_exists( $ability, 'get_name' ) ? $ability->get_name() : '';
				if ( self::ABILITY_NAME === $name ) {
					return;
				}
			}
		}

		wp_register_ability(
			self::ABILITY_NAME,
			array(
				'label'               => __( 'Optimize title', 'jetpack' ),
				'description'         => __( 'Generate optimized title options based on post content and optional keywords.', 'jetpack' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'content' ),
					'properties'           => array(
						'content'  => array(
							'type'        => 'string',
							'description' => __( 'The post content used to generate title suggestions.', 'jetpack' ),
						),
						'keywords' => array(
							'type'        => 'string',
							'description' => __( 'Optional keywords to include in title optimization.', 'jetpack' ),
						),
						'post_id'  => array(
							'type'        => 'integer',
							'description' => __( 'Optional post ID associated with the request.', 'jetpack' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'execute' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => false,
					),
					'show_in_rest' => true,
					'instructions' => 'When the user asks to optimize, improve, or suggest titles for their post, you MUST use the wpcom/optimize-title tool to extract the post content. Then generate exactly 3 title suggestions. After generating suggestions, call the wpcom/select-title tool with the titles array so the user sees an interactive picker. Each title object must have "title" and "explanation" fields.',
				),
			)
		);
	}

	/**
	 * Permission check callback for ability execution.
	 *
	 * @return bool
	 */
	public static function permission_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Execute the title optimization ability.
	 *
	 * This is the execute callback invoked when the ability is called
	 * server-side (e.g. via the WordPress Abilities API).  It validates
	 * and sanitises the input, then returns the structured message array
	 * that the orchestrator uses to generate title suggestions.
	 *
	 * @param array $input Ability input.
	 * @return array|WP_Error
	 */
	public static function execute( $input ) {
		$content = isset( $input['content'] ) ? sanitize_textarea_field( $input['content'] ) : '';
		if ( '' === trim( $content ) ) {
			return new WP_Error(
				'jetpack_ai_title_optimization_invalid_content',
				__( 'Content is required to optimize a title.', 'jetpack' )
			);
		}

		$keywords = isset( $input['keywords'] ) ? sanitize_text_field( $input['keywords'] ) : '';
		$post_id  = isset( $input['post_id'] ) ? absint( $input['post_id'] ) : 0;

		$result = array(
			'role'    => 'jetpack-ai',
			'context' => array(
				'type'     => 'title-optimization',
				'content'  => $content,
				'keywords' => $keywords,
			),
		);

		if ( $post_id > 0 ) {
			$result['context']['post_id'] = $post_id;
		}

		return $result;
	}
}

<?php
/**
 * Anchor.fm integration.
 *
 * @since 9.3.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\WritingPrompts;

use Automattic\Jetpack\Blocks;

const FEATURE_NAME = 'writing-prompts';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers Anchor.fm integration for the block editor.
 */
function register_extension() {
	Blocks::jetpack_register_block( BLOCK_NAME );
}

/**
 * Checks URL params to determine the Anchor integration action to perform.
 */
function inject_writing_prompts() {
	if (
		! function_exists( 'get_current_screen' )
		|| \get_current_screen() === null
	) {
		return;
	}

	// Return early if we are not in the block editor.
	if ( ! wp_should_load_block_editor_scripts_and_styles() ) {
		return;
	}

	$post = get_post();
	if ( ! $post || ! $post->ID ) {
		return;
	}

	$prompts = array(
		__(
			'What’s the most time you’ve ever spent apart from your
		favorite person? Tell us about it',
			'jetpack'
		),
		__( 'What’s the most time you’ve ever spent apart from your favorite person? Tell us about it', 'jetpack' ),
		__( 'You need to make a major change in your life. Do you make it all at once, cold turkey style, or incrementally?', 'jetpack' ),
		__( 'Your home is on fire. Grab five items (assume all people and animals are safe). What did you grab?', 'jetpack' ),
		__( 'You’re given a plot of land and have the financial resources to do what you please. What’s the plan?', 'jetpack' ),
		__( '“And they lived happily ever after.” Think about this line for a few minutes. Are you living happily ever after? If not, what will it take for you to get there?', 'jetpack' ),
		__( 'Write about the last disagreement you had with a friend or family member — from their perspective.', 'jetpack' ),
		__( 'You have the choice to erase one incident from your past, as though it never happened. What would you erase and why?', 'jetpack' ),
		__( 'You’ve being exiled to a private island, and your captors will only supply you with five foods. What do you pick?', 'jetpack' ),
		__( 'Describe an item you were incredibly attached to as a child. What became of it?', 'jetpack' ),
	);

	$random_prompt = $prompts[ wp_rand( 0, count( $prompts ) - 1 ) ];

	wp_localize_script( 'jetpack-blocks-editor', 'Jetpack_WritingPrompts', array( 'prompt' => esc_html( $random_prompt ) ) );
}

add_action( 'init', __NAMESPACE__ . '\register_extension' );
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\inject_writing_prompts' );

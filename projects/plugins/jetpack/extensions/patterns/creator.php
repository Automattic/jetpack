<?php
/**
 * Creator pattern (Sharing + Like + Related Posts)
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Patterns\Creator;

/**
 * Register a pattern demonstrating our popular creator modules.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function register_pattern() {
	$pattern_contents = sprintf(
		'<!-- wp:group {"metadata":{"name":"%1$s"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:separator {"className":"is-style-wide"} -->
<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>
<!-- /wp:separator -->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between"}} -->
<div class="wp-block-group"><!-- wp:jetpack/related-posts {"postLayout":"list","displayDate":false,"postsToShow":2} -->
<div class="wp-block-jetpack-related-posts"><!-- wp:heading {"placeholder":"Add a headline","className":"is-style-default"} -->
<h2 class="wp-block-heading is-style-default">%2$s</h2>
<!-- /wp:heading --></div>
<!-- /wp:jetpack/related-posts -->

<!-- wp:group {"layout":{"type":"flex","orientation":"vertical","justifyContent":"left"}} -->
<div class="wp-block-group"><!-- wp:heading -->
<h2 class="wp-block-heading">%3$s</h2>
<!-- /wp:heading -->

<!-- wp:jetpack/sharing-buttons {"styleType":"icon"} -->
<ul class="wp-block-jetpack-sharing-buttons has-normal-icon-size jetpack-sharing-buttons__services-list" id="jetpack-sharing-serivces-list"><!-- wp:jetpack/sharing-button {"service":"facebook","label":"Facebook"} /-->

<!-- wp:jetpack/sharing-button {"service":"x","label":"X"} /-->

<!-- wp:jetpack/sharing-button {"service":"mastodon","label":"Mastodon"} /--></ul>
<!-- /wp:jetpack/sharing-buttons -->

<!-- wp:jetpack/like /--></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:separator {"className":"is-style-wide"} -->
<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>
<!-- /wp:separator --></div>
<!-- /wp:group -->',
		esc_html__( 'Jetpack’s creator tools', 'jetpack' ),
		esc_html__( 'Related Posts', 'jetpack' ),
		esc_html__( 'Share & Like', 'jetpack' )
	);

	register_block_pattern(
		'jetpack-creator',
		array(
			'title'      => __( 'Registration Form', 'jetpack' ),
			'blockTypes' => array( 'jetpack/contact-form' ),
			'categories' => array( 'jetpack' ),
			'keywords'   => array(
				__( 'like', 'jetpack' ),
				__( 'share', 'jetpack' ),
				__( 'related', 'jetpack' ),
			),
			'content'    => $pattern_contents,
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_pattern' );

<?php
/**
 * Premium Content Block.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

require_once __DIR__ . '/_inc/access-check.php';
require_once __DIR__ . '/logged-out-view/logged-out-view.php';
require_once __DIR__ . '/subscriber-view/subscriber-view.php';
require_once __DIR__ . '/buttons/buttons.php';
require_once __DIR__ . '/login-button/login-button.php';

const FEATURE_NAME = 'premium-content/container';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	// Determine required `context` key based on Gutenberg version.
	$deprecated = function_exists( 'gutenberg_get_post_from_context' );
	$provides   = $deprecated ? 'providesContext' : 'provides_context';

	Blocks::jetpack_register_block(
		FEATURE_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			'plan_check'      => true,
			'attributes'      => array(
				'isPremiumContentChild' => array(
					'type'    => 'boolean',
					'default' => true,
				),
			),
			$provides         => array(
				'premium-content/planId' => 'selectedPlanId',
				'isPremiumContentChild'  => 'isPremiumContentChild',
			),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	if ( ! pre_render_checks() ) {
		return '';
	}

	if (
		! membership_checks()
		// Only display Stripe nudge if Upgrade nudge isn't displaying
		&& required_plan_checks()
	) {
		$stripe_nudge = render_stripe_nudge();
		return $stripe_nudge . $content;
	}

	Jetpack_Gutenberg::load_styles_as_required( FEATURE_NAME );
	return $content;
}

/**
 * Server-side rendering for the stripe connection nudge.
 *
 * @return string Final content to render.
 */
function render_stripe_nudge() {
	if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
		// The Premium Content block should not be supported on Jetpack sites;
		// check just in case.
		return '';
	}

	jetpack_require_lib( 'memberships' );
	$blog_id = get_current_blog_id();
	$settings = (array) get_memberships_settings_for_site($blog_id);

	jetpack_require_lib('components');
	return \Jetpack_Components::render_frontend_nudge(
		array(
			'checkoutUrl' => $settings['connect_url'],
			'description' => _('Connect to Stripe to use this block on your site.', 'jetpack'),
			'buttonText'  => _('Connect', 'jetpack'),
		)
	);
}

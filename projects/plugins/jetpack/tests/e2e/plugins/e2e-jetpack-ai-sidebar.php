<?php
/**
 * Plugin Name: E2E Jetpack AI Sidebar
 * Description: Enables the Jetpack AI Sidebar preview in the E2E environment.
 * Version: 1.0
 * Text Domain: e2e-jetpack-ai-sidebar
 */

// In-development page-editor and semantic-ability flags use this same internal-testing gate.
// The suite verifies the connected transport and editor effects, not production rollout eligibility.
// This MU plugin is installed only in Jetpack's disposable Docker E2E environment.
if ( ! defined( 'A8C_PROXIED_REQUEST' ) ) {
	define( 'A8C_PROXIED_REQUEST', true );
}

add_filter( 'jetpack_ai_sidebar_enabled', '__return_true' );

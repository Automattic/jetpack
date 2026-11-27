<?php
/**
 * Proposals: the only file in the feature that adds hooks. The classes are autoloaded and side-effect free.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposals;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposals_Preview;

Feature_Flags::register(
	Proposals::FLAG,
	array(
		'default'     => false,
		'description' => 'Let agents stage changes that a person previews, then approves in chat.',
		'owner'       => 'jetpack-mu-wpcom',
	)
);

/**
 * Add the feature's hooks for this request.
 *
 * Previews only boot for requests carrying the proposal query var, so other requests pay nothing.
 */
function jetpack_proposals_init(): void {
	if ( ! Proposals::is_enabled() ) {
		return;
	}

	add_filter( 'option_jetpack_sync_settings_post_types_blacklist', array( Proposals::class, 'exclude_from_sync' ) );
	add_filter( 'default_option_jetpack_sync_settings_post_types_blacklist', array( Proposals::class, 'exclude_from_sync' ) );

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Presence check only.
	if ( ! isset( $_GET[ Proposals::QUERY_VAR ] ) ) {
		return;
	}

	// REST requests are served and exit during parse_request at priority 10, and wp-admin never parses one.
	add_action( 'parse_request', array( Proposals_Preview::class, 'boot' ), 20 );
}
jetpack_proposals_init();

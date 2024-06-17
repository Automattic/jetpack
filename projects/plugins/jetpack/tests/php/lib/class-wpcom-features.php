<?php
/**
 * WPCOM_Features file.
 *
 * @package Jetpack
 */

if ( class_exists( 'WPCOM_Features' ) ) {
	return;
}

/**
 * Class WPCOM_Features.
 */
class WPCOM_Features {
	const ATOMIC             = 'atomic';
	const EMAIL_SUBSCRIPTION = 'email-subscription';
	const MANAGE_PLUGINS     = 'manage-plugins';
}

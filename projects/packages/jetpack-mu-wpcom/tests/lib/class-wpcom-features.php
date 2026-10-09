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
	const BACKUPS_SELF_SERVE      = 'backups-self-serve';
	const GLOBAL_STYLES           = 'global-styles';
	const PRIORITY_SUPPORT        = 'priority_support';
	const REAL_TIME_COLLABORATION = 'real-time-collaboration';
	const SCAN                    = 'scan';
	const SCAN_SELF_SERVE         = 'scan-self-serve';
}

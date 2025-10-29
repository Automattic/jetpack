import { __ } from '@wordpress/i18n';

export const SECURITY_SLUG = 'security';
export const SECURITY = 'Security';
export const COMPLETE_SLUG = 'complete';
export const COMPLETE = 'Complete';

export const getTranslatableFeatureLabels = () => ( {
	FREE: __( 'Free', 'jetpack-my-jetpack' ),
	START_FOR_FREE: __( 'Start for Free', 'jetpack-my-jetpack' ),
	INCLUDED: __( 'Included', 'jetpack-my-jetpack' ),
	NOT_INCLUDED: __( 'Not included', 'jetpack-my-jetpack' ),
	/* translators: "Security" here shouldn't be translated as its the name of the bundle */
	GET_SECURITY: __( 'Get Security', 'jetpack-my-jetpack' ),
	/* translators: "Complete" here shouldn't be translated as its the name of the bundle */
	GET_COMPLETE: __( 'Get Complete', 'jetpack-my-jetpack' ),

	// Bundle feature labels
	PRIORITY_SUPPORT: __( 'Priority support', 'jetpack-my-jetpack' ),
	REAL_TIME_BACKUPS: __( 'Real-time backups and restores', 'jetpack-my-jetpack' ),
	DETAILED_STATS: __( 'Detailed stats and insights', 'jetpack-my-jetpack' ),
	MALWARE_SCANNING: __( 'Malware scanning and protection', 'jetpack-my-jetpack' ),
	VIDEO_HOSTING_1TB: __( 'Video hosting (1TB, ad-free)', 'jetpack-my-jetpack' ),
	INSTANT_SITE_SEARCH: __( 'Instant site search', 'jetpack-my-jetpack' ),
	SOCIAL_TOOLS: __( 'Social tools', 'jetpack-my-jetpack' ),
} );

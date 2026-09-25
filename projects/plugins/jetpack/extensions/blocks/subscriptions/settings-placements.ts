import { __ } from '@wordpress/i18n';

interface Placement {
	appSource?: string;
	label: string;
	option: string;
	templatePart?: string;
}

const getSettingsPlacements = (): Placement[] => [
	{
		appSource: 'subscribe-overlay',
		templatePart: 'jetpack-subscribe-overlay',
		option: 'jetpack_subscribe_overlay_enabled',
		label: __( 'Subscription overlay on homepage', 'jetpack' ),
	},
	{
		appSource: 'subscribe-modal',
		templatePart: 'jetpack-subscribe-modal',
		option: 'sm_enabled',
		label: __( 'Subscription pop-up in post', 'jetpack' ),
	},
	{
		appSource: 'subscribe-floating-button',
		templatePart: 'jetpack-subscribe-floating-button',
		option: 'jetpack_subscribe_floating_button_enabled',
		label: __( 'Floating button on bottom corner', 'jetpack' ),
	},
	{
		appSource: 'subscribe-block-post-end',
		option: 'jetpack_subscriptions_subscribe_post_end_enabled',
		label: __( 'Subscribe block at the end of each post', 'jetpack' ),
	},
	{
		appSource: 'subscribe-block-navigation',
		option: 'jetpack_subscriptions_subscribe_navigation_enabled',
		label: __( 'Add the Subscribe block to the navigation', 'jetpack' ),
	},
];

export const getPlacementByAppSource = ( appSource: string ): Placement | undefined =>
	getSettingsPlacements().find( placement => placement.appSource === appSource );

export const getPlacementByTemplatePart = ( slug: string ): Placement | undefined =>
	getSettingsPlacements().find( placement => placement.templatePart === slug );

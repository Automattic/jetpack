import { __ } from '@wordpress/i18n';

interface Placement {
	appSource?: string;
	label: string;
	option: string;
	templatePart?: string;
	templates?: string[]; // Optional array of template slugs where this placement is available.
}

const getSettingsPlacements = (): Placement[] => [
	{
		appSource: 'subscribe-overlay',
		templatePart: 'jetpack-subscribe-overlay',
		option: 'jetpack_subscribe_overlay_enabled',
		label: __( 'Subscription overlay on homepage', 'jetpack' ),
		templates: [ 'front-page', 'home' ],
	},
	{
		appSource: 'subscribe-modal',
		templatePart: 'jetpack-subscribe-modal',
		option: 'sm_enabled',
		label: __( 'Subscription pop-up in post', 'jetpack' ),
		templates: [ 'single-post' ],
	},
	{
		appSource: 'subscribe-floating-button',
		templatePart: 'jetpack-subscribe-floating-button',
		option: 'jetpack_subscribe_floating_button_enabled',
		label: __( 'Floating button on bottom corner', 'jetpack' ),
		templates: [ '*' ],
	},
];

export const getPlacementByAppSource = ( appSource: string ): Placement | undefined =>
	getSettingsPlacements().find( placement => placement.appSource === appSource );

export const getPlacementByTemplatePart = ( slug: string ): Placement | undefined =>
	getSettingsPlacements().find( placement => placement.templatePart === slug );

export const getPlacementsForTemplate = ( slug: string ): Placement[] =>
	getSettingsPlacements().filter(
		placement => placement.templates?.includes( '*' ) || placement.templates?.includes( slug )
	);

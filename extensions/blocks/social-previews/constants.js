/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { FacebookPreview, TwitterPreview, SearchPreview } from '@automattic/social-previews';

export const AVAILABLE_SERVICES = [
	{
		title: __( 'Google Search', 'jetpack' ),
		icon: 'google',
		name: 'google',
		preview: SearchPreview,
	},
	{
		title: __( 'Facebook', 'jetpack' ),
		icon: 'facebook',
		name: 'facebook',
		preview: FacebookPreview,
	},
	{
		title: __( 'Twitter', 'jetpack' ),
		icon: 'twitter',
		name: 'twitter',
		preview: TwitterPreview,
	},
];

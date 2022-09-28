import { FacebookPreview, TwitterPreview, SearchPreview } from '@automattic/social-previews';
import { __ } from '@wordpress/i18n';

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
		preview: props => <FacebookPreview type="article" { ...props } />,
	},
	{
		title: __( 'Twitter', 'jetpack' ),
		icon: 'twitter',
		name: 'twitter',
		preview: props => <TwitterPreview { ...props } />,
	},
];

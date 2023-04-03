import { SocialServiceIcon } from '@automattic/jetpack-components';
import { FacebookPreview, TwitterPreview, SearchPreview } from '@automattic/social-previews';
import { __ } from '@wordpress/i18n';

export const AVAILABLE_SERVICES = [
	{
		title: __( 'Google Search', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="google" { ...props } />,
		name: 'google',
		preview: SearchPreview,
	},
	{
		title: __( 'Twitter', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="twitter" { ...props } />,
		name: 'twitter',
		preview: props => <TwitterPreview { ...props } />,
	},
	{
		title: __( 'Facebook', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="facebook" { ...props } />,
		name: 'facebook',
		preview: props => <FacebookPreview type="article" { ...props } />,
	},
	{
		title: __( 'Instagram', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="instagram" { ...props } />,
		name: 'instagram',
		preview: () => null,
	},
	{
		title: __( 'LinkedIn', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="linkedin" { ...props } />,
		name: 'linkedin',
		preview: () => null,
	},
	{
		title: __( 'Tumblr', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="tumblr" { ...props } />,
		name: 'tumblr',
		preview: () => null,
	},
	{
		title: __( 'Mastodon', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="mastodon" { ...props } />,
		name: 'mastadon',
		preview: () => null,
	},
];

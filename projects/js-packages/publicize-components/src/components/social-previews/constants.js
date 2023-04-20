import { SocialServiceIcon } from '@automattic/jetpack-components';
import { FacebookPreview, SearchPreview } from '@automattic/social-previews';
import { __ } from '@wordpress/i18n';
import { LinkedIn } from './linkedin';
import { Twitter } from './twitter';

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
		preview: props => <Twitter { ...props } />,
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
		preview: props => <LinkedIn { ...props } />,
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

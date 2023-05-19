import { SocialServiceIcon } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import FacebookPreview from './facebook';
import GoogleSearch from './google-search';
import { LinkedIn } from './linkedin';
import TumblrPreview from './tumblr';
import Twitter from './twitter';

export const AVAILABLE_SERVICES = [
	{
		title: __( 'Google Search', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="google" { ...props } />,
		name: 'google',
		preview: GoogleSearch,
	},
	{
		title: __( 'Twitter', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="twitter" { ...props } />,
		name: 'twitter',
		preview: Twitter,
	},
	{
		title: __( 'Facebook', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="facebook" { ...props } />,
		name: 'facebook',
		preview: FacebookPreview,
	},
	/* {
		title: __( 'Instagram', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="instagram" { ...props } />,
		name: 'instagram',
		preview: () => null,
	}, */
	{
		title: __( 'LinkedIn', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="linkedin" { ...props } />,
		name: 'linkedin',
		preview: LinkedIn,
	},
	{
		title: __( 'Tumblr', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="tumblr" { ...props } />,
		name: 'tumblr',
		preview: TumblrPreview,
	},
	/* {
		title: __( 'Mastodon', 'jetpack' ),
		icon: props => <SocialServiceIcon serviceName="mastodon" { ...props } />,
		name: 'mastadon',
		preview: () => null,
	}, */
];

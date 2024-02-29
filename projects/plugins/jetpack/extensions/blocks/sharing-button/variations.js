import { __ } from '@wordpress/i18n';
import SocialIcon from 'social-logos';
import SMSIcon from './components/sms-icon';

export const variations = [
	{
		name: 'print',
		attributes: { service: 'print', label: 'Print' },
		title: 'Print',
		icon: <SocialIcon icon={ 'print' } />,
	},
	{
		name: 'facebook',
		attributes: { service: 'facebook', label: 'Facebook' },
		title: 'Facebook',
		icon: <SocialIcon icon={ 'facebook' } />,
	},
	{
		name: 'linkedin',
		attributes: { service: 'linkedin', label: 'LinkedIn' },
		title: 'LinkedIn',
		isDefault: true,
		icon: <SocialIcon icon={ 'linkedin' } />,
	},
	{
		name: 'mail',
		attributes: { service: 'mail', label: 'Mail' },
		title: 'Mail',
		keywords: [ 'email', 'e-mail' ],
		icon: <SocialIcon icon={ 'mail' } />,
	},
	{
		name: 'mastodon',
		attributes: { service: 'mastodon', label: 'Mastodon' },
		title: 'Mastodon',
		icon: <SocialIcon icon={ 'mastodon' } />,
	},
	{
		name: 'pinterest',
		attributes: { service: 'pinterest', label: 'Pinterest' },
		title: 'Pinterest',
		icon: <SocialIcon icon={ 'pinterest' } />,
	},
	{
		name: 'pocket',
		attributes: { service: 'pocket', label: 'Pocket' },
		title: 'Pocket',
		icon: <SocialIcon icon={ 'pocket' } />,
	},
	{
		name: 'reddit',
		attributes: { service: 'reddit', label: 'Reddit' },
		title: 'Reddit',
		icon: <SocialIcon icon={ 'reddit' } />,
	},
	{
		name: 'telegram',
		attributes: { service: 'telegram', label: 'Telegram' },
		title: 'Telegram',
		icon: <SocialIcon icon={ 'telegram' } />,
	},
	{
		name: 'tumblr',
		attributes: { service: 'tumblr', label: 'Tumblr' },
		title: 'Tumblr',
		icon: <SocialIcon icon={ 'tumblr' } />,
	},
	{
		name: 'whatsapp',
		attributes: { service: 'whatsapp', label: 'WhatsApp' },
		title: 'WhatsApp',
		icon: <SocialIcon icon={ 'whatsapp' } />,
	},
	{
		name: 'x',
		attributes: { service: 'x', label: 'X' },
		keywords: [ 'twitter', 'x' ],
		title: 'X',
		icon: <SocialIcon icon={ 'x' } />,
	},
	{
		name: 'twitter',
		attributes: { service: 'twitter', label: 'Twitter' },
		keywords: [ 'twitter' ],
		title: 'Twitter',
		icon: <SocialIcon icon={ 'twitter' } />,
	},
	{
		name: 'nextdoor',
		attributes: { service: 'nextdoor', label: 'Nextdoor' },
		title: 'Nextdoor',
		icon: <SocialIcon icon={ 'nextdoor' } />,
	},
	{
		name: 'sms',
		/* translators: sms sharing button label*/
		attributes: { service: 'sms', label: __( 'SMS', 'jetpack' ) },
		title: 'SMS',
		icon: <SMSIcon />,
	},
];

variations.forEach( variation => {
	if ( variation.isActive ) {
		return;
	}
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.service === variationAttributes.service;
} );

export const getIconByService = service =>
	variations.find( variation => variation.attributes.service === service )?.icon;

export default variations;

// TODO: possibly add these in the future
// {
// 	name: 'threads',
// 	attributes: { service: 'threads' },
// 	title: 'Threads',
// 	icon: ThreadsIcon,
// },
// {
// 	name: 'tiktok',
// 	attributes: { service: 'tiktok' },
// 	title: 'TikTok',
// 	icon: TiktokIcon,
// },
// {
// 	name: 'instagram',
// 	attributes: { service: 'instagram' },
// 	title: 'Instagram',
// 	icon: InstagramIcon,
// },
// {
// 	name: 'twitch',
// 	attributes: { service: 'twitch' },
// 	title: 'Twitch',
// 	icon: <SocialIcon icon={ 'twitch' } />,
// },
// {
// 	name: 'patreon',
// 	attributes: { service: 'patreon' },
// 	title: 'Patreon',
// 	icon: <SocialIcon icon={ 'patreon' } />,
// },
// {
// 	name: 'skype',
// 	attributes: { service: 'skype' },
// 	title: 'Skype',
// 	icon: <SocialIcon icon={ 'skype' } />,
// },

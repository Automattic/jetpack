import SocialIcon from 'social-logos';

export const variations = [
	{
		name: 'print',
		attributes: { service: 'print', label: 'Print' },
		title: 'Print',
		icon: <SocialIcon icon={ 'print' } size={ 24 } />,
	},
	{
		name: 'facebook',
		attributes: { service: 'facebook', label: 'Facebook' },
		title: 'Facebook',
		icon: <SocialIcon icon={ 'facebook' } size={ 24 } />,
	},
	{
		name: 'linkedin',
		attributes: { service: 'linkedin', label: 'LinkedIn' },
		title: 'LinkedIn',
		isDefault: true,
		icon: <SocialIcon icon={ 'linkedin' } size={ 24 } />,
	},
	{
		name: 'mail',
		attributes: { service: 'mail', label: 'Mail' },
		title: 'Mail',
		keywords: [ 'email', 'e-mail' ],
		icon: <SocialIcon icon={ 'mail' } size={ 24 } />,
	},
	{
		name: 'mastodon',
		attributes: { service: 'mastodon', label: 'Mastodon' },
		title: 'Mastodon',
		icon: <SocialIcon icon={ 'mastodon' } size={ 24 } />,
	},
	{
		name: 'pinterest',
		attributes: { service: 'pinterest', label: 'Pinterest' },
		title: 'Pinterest',
		icon: <SocialIcon icon={ 'pinterest' } size={ 24 } />,
	},
	{
		name: 'pocket',
		attributes: { service: 'pocket', label: 'Pocket' },
		title: 'Pocket',
		icon: <SocialIcon icon={ 'pocket' } size={ 24 } />,
	},
	{
		name: 'reddit',
		attributes: { service: 'reddit', label: 'Reddit' },
		title: 'Reddit',
		icon: <SocialIcon icon={ 'reddit' } size={ 24 } />,
	},
	{
		name: 'telegram',
		attributes: { service: 'telegram', label: 'Telegram' },
		title: 'Telegram',
		icon: <SocialIcon icon={ 'telegram' } size={ 24 } />,
	},
	{
		name: 'threads',
		attributes: { service: 'threads', label: 'Threads' },
		title: 'Threads',
		icon: <SocialIcon icon={ 'threads' } size={ 24 } />,
	},
	{
		name: 'tumblr',
		attributes: { service: 'tumblr', label: 'Tumblr' },
		title: 'Tumblr',
		icon: <SocialIcon icon={ 'tumblr' } size={ 24 } />,
	},
	{
		name: 'whatsapp',
		attributes: { service: 'whatsapp', label: 'WhatsApp' },
		title: 'WhatsApp',
		icon: <SocialIcon icon={ 'whatsapp' } size={ 24 } />,
	},
	{
		name: 'x',
		attributes: { service: 'x', label: 'X' },
		keywords: [ 'twitter', 'x' ],
		title: 'X',
		icon: <SocialIcon icon={ 'x' } size={ 24 } />,
	},
	{
		name: 'twitter',
		attributes: { service: 'twitter', label: 'Twitter' },
		keywords: [ 'twitter' ],
		title: 'Twitter',
		icon: <SocialIcon icon={ 'twitter' } size={ 24 } />,
	},
	{
		name: 'nextdoor',
		attributes: { service: 'nextdoor', label: 'Nextdoor' },
		title: 'Nextdoor',
		icon: <SocialIcon icon={ 'nextdoor' } size={ 24 } />,
	},
];

variations.forEach( variation => {
	if ( variation.isActive ) {
		return;
	}
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.service === variationAttributes.service;
} );

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
// 	icon: <SocialIcon icon={ 'twitch' } size={ 24 } />,
// },
// {
// 	name: 'patreon',
// 	attributes: { service: 'patreon' },
// 	title: 'Patreon',
// 	icon: <SocialIcon icon={ 'patreon' } size={ 24 } />,
// },
// {
// 	name: 'skype',
// 	attributes: { service: 'skype' },
// 	title: 'Skype',
// 	icon: <SocialIcon icon={ 'skype' } size={ 24 } />,
// },

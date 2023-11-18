import SocialIcon from 'social-logos';

const variations = [
	{
		name: 'print',
		attributes: { service: 'print' },
		title: 'Print',
		icon: <SocialIcon icon={ 'print' } size={ 32 } />,
	},
	{
		name: 'facebook',
		attributes: { service: 'facebook' },
		title: 'Facebook',
		icon: <SocialIcon icon={ 'facebook' } size={ 32 } />,
	},
	{
		name: 'linkedin',
		attributes: { service: 'linkedin' },
		title: 'LinkedIn',
		icon: <SocialIcon icon={ 'linkedin' } size={ 32 } />,
	},
	{
		name: 'mail',
		attributes: { service: 'mail' },
		title: 'Mail',
		keywords: [ 'email', 'e-mail' ],
		icon: <SocialIcon icon={ 'mail' } size={ 32 } />,
	},
	{
		name: 'mastodon',
		attributes: { service: 'mastodon' },
		title: 'Mastodon',
		icon: <SocialIcon icon={ 'mastodon' } size={ 32 } />,
	},
	{
		name: 'patreon',
		attributes: { service: 'patreon' },
		title: 'Patreon',
		icon: <SocialIcon icon={ 'patreon' } size={ 32 } />,
	},
	{
		name: 'pinterest',
		attributes: { service: 'pinterest' },
		title: 'Pinterest',
		icon: <SocialIcon icon={ 'pinterest' } size={ 32 } />,
	},
	{
		name: 'pocket',
		attributes: { service: 'pocket' },
		title: 'Pocket',
		icon: <SocialIcon icon={ 'pocket' } size={ 32 } />,
	},
	{
		name: 'reddit',
		attributes: { service: 'reddit' },
		title: 'Reddit',
		icon: <SocialIcon icon={ 'reddit' } size={ 32 } />,
	},
	{
		name: 'skype',
		attributes: { service: 'skype' },
		title: 'Skype',
		icon: <SocialIcon icon={ 'skype' } size={ 32 } />,
	},
	{
		name: 'telegram',
		attributes: { service: 'telegram' },
		title: 'Telegram',
		icon: <SocialIcon icon={ 'telegram' } size={ 32 } />,
	},
	{
		name: 'tumblr',
		attributes: { service: 'tumblr' },
		title: 'Tumblr',
		icon: <SocialIcon icon={ 'tumblr' } size={ 32 } />,
	},
	{
		name: 'twitch',
		attributes: { service: 'twitch' },
		title: 'Twitch',
		icon: <SocialIcon icon={ 'twitch' } size={ 32 } />,
	},
	{
		name: 'vimeo',
		attributes: { service: 'vimeo' },
		title: 'Vimeo',
		icon: <SocialIcon icon={ 'vimeo' } size={ 32 } />,
	},
	{
		name: 'whatsapp',
		attributes: { service: 'whatsapp' },
		title: 'WhatsApp',
		icon: <SocialIcon icon={ 'whatsapp' } size={ 32 } />,
	},
	{
		name: 'x',
		attributes: { service: 'x' },
		keywords: [ 'twitter' ],
		title: 'X',
		icon: <SocialIcon icon={ 'x' } size={ 32 } />,
	},
	{
		name: 'nextdoor',
		attributes: { service: 'nextdoor' },
		title: 'Nextdoor',
		icon: <SocialIcon icon={ 'nextdoor' } size={ 32 } />,
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

// TODO: add these in the future
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

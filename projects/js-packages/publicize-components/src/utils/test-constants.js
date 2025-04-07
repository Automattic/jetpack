export const SUPPORTED_SERVICES_MOCK = [
	{
		id: 'facebook',
		label: 'Facebook',
		description: 'Share to your pages',
		url: 'https://test_url.com',
		supports: {
			additional_users: true,
			additional_users_only: true,
		},
	},
	{
		id: 'linkedin',
		label: 'LinkedIn',
		description: 'Share to your account and company pages',
		url: 'https://test_url.com',
		supports: {
			additional_users: true,
			additional_users_only: false,
		},
	},
	{
		id: 'instagram-business',
		label: 'Instagram Business',
		description: 'Share to your Instagram Business account.',
		url: 'https://test_url.com',
		supports: {
			additional_users: true,
			additional_users_only: true,
		},
	},
];

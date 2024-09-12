export const SUPPORTED_SERVICES_MOCK = [
	{
		ID: 'facebook',
		label: 'Facebook',
		type: 'publicize',
		description: 'Share to your pages',
		genericon: {
			class: 'facebook-alt',
			unicode: '\\f203',
		},
		connect_URL: 'https://test_url.com',
		multiple_external_user_ID_support: true,
		external_users_only: true,
		jetpack_support: true,
		jetpack_module_required: 'publicize',
		examples: [ null, null ],
	},
	{
		ID: 'instagram-business',
		label: 'Instagram Business',
		type: 'publicize',
		description: 'Share to your Instagram Business account.',
		genericon: {
			class: 'image',
			unicode: '\\f218',
		},
		connect_URL: 'https://test_url.com',
		multiple_external_user_ID_support: true,
		external_users_only: true,
		jetpack_support: true,
		jetpack_module_required: 'publicize',
		examples: [ null, null ],
	},
];

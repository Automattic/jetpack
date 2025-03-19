const VULNERABLE_PLUGIN_THREAT = {
	id: 'plugin_woocommerce_3.4.5',
	signature: null,
	title: 'Vulnerable Plugin: WooCommerce (version 3.4.5)',
	description: 'The plugin WooCommerce (version 3.4.5) has 2 known vulnerabilities.',
	firstDetected: null,
	fixedIn: null,
	severity: null,
	fixable: null,
	fixer: null,
	status: null,
	filename: null,
	context: null,
	vulnerabilities: [
		{
			id: '1d0470df-4671-47ac-8d87-a165e8f7d502',
			title: 'WooCommerce <= 3.2.3 - Authenticated PHP Object Injection',
			description:
				'Versions 3.2.3 and earlier are affected by an issue where cached queries within shortcodes could lead to object injection. This is related to the recent WordPress 4.8.3 security release. This issue can only be exploited by users who can edit content and add shortcodes, but we still recommend all users running WooCommerce 3.x upgrade to 3.2 to mitigate this issue.',
			introducedIn: '3.2.3',
			fixedIn: '3.2.4',
			source: 'https://example.com',
		},
		{
			id: '1d0470df-4671-47ac-8d87-a165e8f7d502',
			title: 'WooCommerce <= 3.4.4 - Potential Object Injection',
			description:
				'According to WooCommerce: "Versions 3.4.4 and earlier are affected by an issue where a function that updates attributes could lead to object injection. This is related to the WordPress 4.8.3 security release. This issue can only be exploited by users who can edit attributes and should not be possible to exploit through the WordPress administrative screens, but we still recommend all users running WooCommerce 3.x upgrade to 3.4.5 to mitigate this issue. Thanks to slavco for responsibly disclosing the vulnerability to us."',
			introducedIn: '3.2.3',
			fixedIn: '3.2.4',
			source: 'https://example.com',
		},
	],
};

const FILE_THREAT = {
	id: 185869885,
	signature: 'EICAR_AV_Test',
	title: 'Malicious code found in file: index.php',
	description:
		"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
	firstDetected: '2024-10-07T20:45:06.000Z',
	fixedIn: null,
	severity: 8,
	fixable: { fixer: 'rollback', target: 'January 26, 2024, 6:49 am', extensionStatus: '' },
	fixer: { status: 'not_started' },
	status: 'current',
	filename: '/var/www/html/wp-content/index.php',
	context: {
		'1': 'echo <<<HTML',
		'2': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
		'3': 'HTML;',
		marks: {},
	},
};

export const storybookThreat = {
	argTypes: {
		threatPreset: {
			name: 'Threat Type',
			description: 'Select a threat type to display.',
			control: {
				type: 'select',
			},
			options: { 'Vulnerable Plugin': VULNERABLE_PLUGIN_THREAT, 'File Threat': FILE_THREAT },
		},
		threatFixerProps: {
			name: 'Auto-Fixer State',
			description: 'Select a fixer state to add to the displayed threat.',
			control: {
				type: 'select',
			},
			options: {
				None: null,
				Available: {
					fixer: { status: 'not_started' },
				},
				'In Progress': {
					fixer: { status: 'in_progress' },
				},
				Fixed: {
					status: 'fixed',
					fixer: { status: 'fixed' },
				},
				Error: {
					fixer: { error: 'error' },
				},
				Stale: {
					fixer: { status: 'in_progress', lastUpdated: new Date( '1999-01-01' ).toISOString() },
				},
			},
		},
		connection: {
			name: 'Jetpack Connection',
			description: 'Select a connection state to add to ThreatsContext.',
			control: {
				type: 'select',
			},
			options: {
				connected: {
					connected: true,
					connecting: false,
					connect: () => {},
				},
				disconnected: {
					connected: false,
					connecting: false,
					connect: () => {},
				},
				custom: null,
			},
		},
		credentials: {
			name: 'Site Credentials',
			description: 'Select a credentials state to add to ThreatsContext.',
			control: {
				type: 'select',
			},
			options: {
				connected: {
					available: true,
					fetching: false,
					redirectUrl: '#',
				},
				disconnected: {
					available: false,
					fetching: false,
					redirectUrl: '#',
				},
				custom: null,
			},
		},
		actionsEnabled: {
			name: 'Enable Threat Actions',
			description: "Enable the user's ability to auto-fix, ignore, and unignore threats.",
			control: {
				type: 'boolean',
			},
		},
		referToCodeable: {
			name: 'Refer to Codeable',
			description: 'Whether to refer to Codeable when auto-fix unavailable.',
			control: {
				type: 'boolean',
			},
		},
	},
	args: {
		threatPreset: VULNERABLE_PLUGIN_THREAT,
		threatFixerProps: null,
		connection: {
			connected: true,
			connecting: false,
			connect: () => {},
		},
		credentials: {
			available: true,
			fetching: false,
			redirectUrl: '#',
		},
		actionsEnabled: true,
		referToCodeable: true,
	},
};

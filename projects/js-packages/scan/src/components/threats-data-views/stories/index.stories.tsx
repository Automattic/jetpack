import ThreatsDataViews from '../index.js';

export default {
	title: 'JS Packages/Components/Threats Data Views',
	component: ThreatsDataViews,
	parameters: {
		backgrounds: {
			default: 'light',
			values: [ { name: 'light', value: 'white' } ],
		},
	},
	decorators: [
		Story => (
			<div style={ { maxWidth: '100%', backgroundColor: 'white' } }>
				<Story />
			</div>
		),
	],
};

export const Default = args => <ThreatsDataViews { ...args } />;
Default.args = {
	data: [
		{
			id: 185869885,
			signature: 'EICAR_AV_Test',
			title: 'Malicious code found in file: index.php',
			description:
				"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
			firstDetected: '2024-10-07T20:45:06.000Z',
			fixedIn: null,
			severity: 8,
			fixable: { fixer: 'delete' },
			fixer: { status: 'not_started' },
			status: 'current',
			filename: '/var/www/html/wp-content/index.php',
			context: {
				'1': 'echo <<<HTML',
				'2': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
				'3': 'HTML;',
				marks: {},
			},
		},
		{
			id: 185869883,
			signature: 'Suspicious.Files',
			title: 'Malicious code found in file: fuzzy.php',
			description:
				'Our security scanners detected that this file is identical to a previously identified malicious file',
			firstDetected: '2024-10-07T20:45:06.000Z',
			fixedIn: null,
			severity: 4,
			fixable: false,
			status: 'ignored',
			filename: '/var/www/html/wp-content/fuzzy.php',
			context: '',
		},
		{
			id: 185868972,
			signature: 'EICAR_AV_Test_Suspicious',
			title: 'Malicious code found in file: jptt_eicar.php',
			description:
				"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
			firstDetected: '2024-10-07T20:40:15.000Z',
			fixedIn: null,
			severity: 1,
			fixable: false,
			status: 'current',
			filename: '/var/www/html/wp-content/uploads/jptt_eicar.php',
			context: {
				'6': 'echo <<<HTML',
				'7': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-SUSPICIOUS-ANTIVIRUS-TEST-FILE!$H+H*',
				'8': 'HTML;',
				'9': 'echo <<<HTML',
				'10': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-SUSPICIOUS-ANTIVIRUS-TEST-FILE!$H+H*',
				'11': 'HTML;',
				marks: {},
			},
		},
		{
			id: 184847701,
			signature: 'Vulnerable.WP.Extension',
			title: 'Vulnerable Plugin: WP Super Cache (version 1.6.3)',
			description:
				'The plugin WP Super Cache (version 1.6.3) has a known vulnerability. The WP Super Cache plugin before version 1.7.2 is vulnerable to an authenticated RCE in the settings page.',
			firstDetected: '2024-10-02T17:34:59.000Z',
			fixedIn: '1.12.4',
			severity: 3,
			fixable: { fixer: 'update', target: '1.12.4', extensionStatus: 'inactive' },
			fixer: { status: 'in_progress', lastUpdated: new Date().toISOString() },
			status: 'current',
			filename: null,
			context: null,
			source: 'https://wpscan.com/vulnerability/733d8a02-0d44-4b78-bbb2-37e447acd2f3',
			extension: {
				name: 'WP Super Cache',
				slug: 'wp-super-cache',
				version: '1.6.3',
				type: 'plugins',
			},
		},
		{
			id: 185868945,
			signature: 'Core.File.Modification',
			title: 'Compromised WordPress core file: index.php',
			description:
				'Core WordPress files are not normally changed. If you did not make these changes you should review the code.',
			firstDetected: '2024-10-07T20:40:05.000Z',
			severity: 4,
			status: 'current',
			fixable: {
				fixer: 'replace',
				file: '/var/www/html/wp-admin/index.php',
				extensionStatus: '',
			},
			filename: '/var/www/html/wp-admin/index.php',
			diff: "--- /tmp/wordpress/6.6.2/wordpress/wp-admin/index.php\t2024-10-07 20:40:04.887546480 +0000\n+++ /var/www/html/wp-admin/index.php\t2024-10-07 20:39:58.775512965 +0000\n@@ -210,3 +210,4 @@\n wp_print_community_events_templates();\n \n require_once ABSPATH . 'wp-admin/admin-footer.php';\n+if ( true === false ) exit();\n\\ No newline at end of file\n",
		},
		{
			id: 13216959,
			signature: 'Vulnerable.WP.Core',
			title: 'Vulnerable WordPress Version (6.4.3)',
			description: 'The installed version of WordPress (6.4.3) has a known vulnerability. ',
			firstDetected: '2024-07-15T21:56:50.000Z',
			severity: 4,
			fixedOn: '2024-07-15T22:01:42.000Z',
			status: 'fixed',
			fixable: false,
			version: '6.4.3',
			source: '',
		},
		{
			id: '7275a176-d579-471a-8492-df8edbdf27de',
			title: 'WooCommerce <= 3.4.5 - Authenticated Stored XSS',
			description:
				'The WooCommerce WordPress plugin was affected by an Authenticated Stored XSS security vulnerability.',
			firstDetected: '2024-07-15T21:56:50.000Z',
			fixedIn: '3.4.6',
			status: 'current',
			source: 'https://wpscan.com/vulnerability/7275a176-d579-471a-8492-df8edbdf27de',
			extension: {
				name: 'WooCommerce',
				slug: 'woocommerce',
				version: '3.4.5',
				type: 'plugins',
			},
		},
	],
	filters: [
		{
			field: 'status',
			operator: 'isAny',
			value: [ 'current' ],
		},
	],
	onFixThreats: () =>
		alert( 'Threat fix action callback triggered! This is handled by the component consumer.' ), // eslint-disable-line no-alert
	onIgnoreThreats: () =>
		alert( 'Ignore threat action callback triggered! This is handled by the component consumer.' ), // eslint-disable-line no-alert
	onUnignoreThreats: () =>
		// eslint-disable-next-line no-alert
		alert(
			'Unignore threat action callback triggered! This is handled by the component consumer.'
		),
};

export const FixerStatuses = args => <ThreatsDataViews { ...args } />;
FixerStatuses.args = {
	data: [
		{
			id: 13216959,
			signature: 'Vulnerable.WP.Core',
			title: 'Vulnerable WordPress Version (6.4.3)',
			description: 'This threat has an auto-fixer available. ',
			firstDetected: '2024-07-15T21:56:50.000Z',
			severity: 4,
			fixer: null,
			fixedOn: '2024-07-15T22:01:42.000Z',
			status: 'current',
			fixable: { fixer: 'update', target: '6.4.4', extensionStatus: 'inactive' },
			version: '6.4.3',
			source: '',
		},
		{
			id: 12345678910,
			signature: 'Vulnerable.WP.Extension',
			title: 'Vulnerable Plugin: Example Plugin (version 1.2.3)',
			description: 'This threat has an in-progress auto-fixer.',
			firstDetected: '2024-10-02T17:34:59.000Z',
			fixedIn: '1.2.4',
			severity: 3,
			fixable: { fixer: 'update', target: '1.12.4', extensionStatus: 'inactive' },
			fixer: { status: 'in_progress', lastUpdated: new Date().toISOString() },
			status: 'current',
			source: 'https://wpscan.com/vulnerability/733d8a02-0d44-4b78-bbb2-37e447acd2f3',
			extension: {
				name: 'Example Plugin',
				slug: 'example-plugin',
				version: '1.2.3',
				type: 'plugins',
			},
		},
		{
			id: 12345678911,
			signature: 'Vulnerable.WP.Extension',
			title: 'Vulnerable Theme: Example Theme (version 2.2.2)',
			description: 'This threat has an in-progress auto-fixer that is taking too long.',
			firstDetected: '2024-10-02T17:34:59.000Z',
			fixedIn: '2.22.22',
			severity: 3,
			fixable: { fixer: 'update', target: '1.12.4', extensionStatus: 'inactive' },
			fixer: { status: 'in_progress', lastUpdated: new Date( '1999-01-01' ).toISOString() },
			status: 'current',
			source: 'https://wpscan.com/vulnerability/733d8a02-0d44-4b78-bbb2-37e447acd2f3',
			extension: {
				name: 'Example Theme',
				slug: 'example-theme',
				version: '2.2.2',
				type: 'themes',
			},
		},
		{
			id: 12345678912,
			signature: 'Vulnerable.WP.Extension',
			title: 'Vulnerable Theme: Example Theme II (version 3.3.3)',
			description: 'This threat has a fixer with an error status.',
			firstDetected: '2024-10-02T17:34:59.000Z',
			fixedIn: '3.4.5',
			severity: 3,
			fixable: { fixer: 'update', target: '1.12.4', extensionStatus: 'inactive' },
			fixer: { status: 'error', error: 'error' },
			status: 'current',
			source: 'https://wpscan.com/vulnerability/733d8a02-0d44-4b78-bbb2-37e447acd2f3',
			extension: {
				name: 'Example Theme II',
				slug: 'example-theme-2',
				version: '3.3.3',
				type: 'themes',
			},
		},
		{
			id: 185868972,
			signature: 'EICAR_AV_Test_Suspicious',
			title: 'Malicious code found in file: jptt_eicar.php',
			description: 'This threat has no auto-fixer available.',
			firstDetected: '2024-10-07T20:40:15.000Z',
			fixedIn: null,
			severity: 1,
			fixable: false,
			status: 'current',
			filename: '/var/www/html/wp-content/uploads/jptt_eicar.php',
			context: {
				'6': 'echo <<<HTML',
				'7': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-SUSPICIOUS-ANTIVIRUS-TEST-FILE!$H+H*',
				'8': 'HTML;',
				'9': 'echo <<<HTML',
				'10': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-SUSPICIOUS-ANTIVIRUS-TEST-FILE!$H+H*',
				'11': 'HTML;',
				marks: {},
			},
		},
	],
	filters: [
		{
			field: 'status',
			operator: 'isAny',
			value: [ 'current' ],
		},
	],
	onFixThreats: () =>
		alert( 'Fix threat action callback triggered! This is handled by the component consumer.' ), // eslint-disable-line no-alert
	onIgnoreThreats: () =>
		alert( 'Ignore threat action callback triggered! This is handled by the component consumer.' ), // eslint-disable-line no-alert
	onUnignoreThreats: () =>
		// eslint-disable-next-line no-alert
		alert(
			'Unignore threat action callback triggered! This is handled by the component consumer.'
		),
};

export const FreeResults = args => <ThreatsDataViews { ...args } />;
FreeResults.args = {
	data: [
		{
			id: '1d0470df-4671-47ac-8d87-a165e8f7d502',
			title: 'WooCommerce <= 3.2.3 - Authenticated PHP Object Injection',
			description:
				'Versions 3.2.3 and earlier are affected by an issue where cached queries within shortcodes could lead to object injection. This is related to the recent WordPress 4.8.3 security release.This issue can only be exploited by users who can edit content and add shortcodes, but we still recommend all users running WooCommerce 3.x upgrade to 3.2 to mitigate this issue.',
			fixedIn: '3.2.4',
			source: 'https://wpscan.com/vulnerability/1d0470df-4671-47ac-8d87-a165e8f7d502',
			extension: {
				name: 'WooCommerce',
				slug: 'woocommerce',
				version: '3.2.3',
				type: 'plugins',
			},
		},
		{
			id: '7275a176-d579-471a-8492-df8edbdf27de',
			subtitle: 'WooCommerce 3.4.5',
			title: 'WooCommerce <= 3.4.5 - Authenticated Stored XSS',
			description:
				'The WooCommerce WordPress plugin was affected by an Authenticated Stored XSS security vulnerability.',
			fixedIn: '3.4.6',
			source: 'https://wpscan.com/vulnerability/7275a176-d579-471a-8492-df8edbdf27de',
			extension: {
				name: 'WooCommerce',
				slug: 'woocommerce',
				version: '3.4.5',
				type: 'plugins',
			},
		},
		{
			id: '733d8a02-0d44-4b78-bbb2-37e447acd2f3',
			title: 'WP Super Cache < 1.7.2 - Authenticated Remote Code Execution (RCE)',
			description:
				'The plugin was affected by an authenticated (admin+) RCE in the settings page due to input validation failure and weak $cache_path check in the WP Super Cache Settings -> Cache Location option. Direct access to the wp-cache-config.php file is not prohibited, so this vulnerability can be exploited for a web shell injection.\r\n\r\nAnother possible attack vector: from XSS (via another plugin affected by XSS) to RCE.',
			fixedIn: '1.7.2',
			source: 'https://wpscan.com/vulnerability/733d8a02-0d44-4b78-bbb2-37e447acd2f3',
			extension: {
				name: 'WP Super Cache',
				slug: 'wp-super-cache',
				version: '1.6.3',
				type: 'plugins',
			},
		},
	],
};

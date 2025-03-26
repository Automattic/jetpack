import { render, screen } from '@testing-library/react';
import ThreatsDataViews from '../index.js';

const data = [
	// Scan API Data
	{
		id: 185869885,
		signature: 'EICAR_AV_Test',
		title: 'Malicious code found in file: index.php',
		description:
			"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
		firstDetected: '2024-10-07T20:45:06.000Z',
		fixedIn: null,
		fixedOn: '2024-10-07T20:45:06.000Z',
		fixable: { fixer: 'rollback', target: 'January 26, 2024, 6:49 am', extensionStatus: '' },
		fixer: {
			status: 'in_progress',
			startedAt: '2024-10-07T20:45:06.000Z',
			lastUpdated: '2024-10-07T20:45:06.000Z',
		},
		severity: 8,
		status: 'current',
		filename: '/var/www/html/wp-content/index.php',
		context: {
			1: 'echo <<<HTML',
			2: 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
			3: 'HTML;',
			marks: {},
		},
	},
	// Protect Report Data
	{
		id: '1d0470df-4671-47ac-8d87-a165e8f7d502',
		title: 'WooCommerce <= 3.2.3 - Authenticated PHP Object Injection',
		description:
			'Versions 3.2.3 and earlier are affected by an issue where cached queries within shortcodes could lead to object injection. This is related to the recent WordPress 4.8.3 security release.This issue can only be exploited by users who can edit content and add shortcodes, but we still recommend all users running WooCommerce 3.x upgrade to 3.2 to mitigate this issue.',
		source: 'https://wpscan.com/vulnerability/1d0470df-4671-47ac-8d87-a165e8f7d502',
		extension: {
			name: 'WooCommerce',
			slug: 'woocommerce',
			version: '3.2.3',
			type: 'plugins',
		},
		fixedIn: '3.2.4',
	},
];

describe( 'ThreatsDataViews', () => {
	it( 'renders threat data', () => {
		render( <ThreatsDataViews data={ data } /> );
		expect( screen.getByText( 'Malicious code found in file: index.php' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'WooCommerce <= 3.2.3 - Authenticated PHP Object Injection' )
		).toBeInTheDocument();
	} );
} );

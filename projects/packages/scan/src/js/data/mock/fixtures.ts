import type {
	SiteScanCountsResponse,
	SiteScanHistoryResponse,
	SiteScanResponse,
	Threat,
} from '../types';

/**
 * Fixture threats used by `?jps-mock=1`. Spread across severities, types,
 * signatures, and fix states so the DataViews chrome (filters, sort,
 * status pills, fix buttons) all render with real-looking data — useful
 * for design reviews on a JN site without a Scan plan.
 */
const mockThreats: Threat[] = [
	{
		id: 'mock-threat-1',
		title: 'WooCommerce <= 3.2.3 — Authenticated PHP Object Injection',
		description:
			'Versions 3.2.3 and earlier are affected by an issue where cached queries within shortcodes could lead to object injection.',
		status: 'current',
		severity: 9,
		signature: 'CVE-2017-1000564',
		firstDetected: '2026-04-30T12:00:00.000Z',
		fixable: {
			fixer: 'update',
			target: '3.2.4',
		},
		extension: {
			slug: 'woocommerce',
			name: 'WooCommerce',
			version: '3.2.3',
			type: 'plugins',
		},
	},
	{
		id: 'mock-threat-2',
		title: 'Malicious code in: index.php',
		description:
			'A heuristic match for the EICAR antivirus test string was detected in this file. Review the source and remove if unexpected.',
		status: 'current',
		severity: 8,
		signature: 'EICAR_AV_Test',
		firstDetected: '2026-04-29T08:30:00.000Z',
		fixable: {
			fixer: 'delete',
			target: '/wp-content/uploads/index.php',
		},
		filename: '/wp-content/uploads/index.php',
		context: {
			1: 'echo <<<HTML',
			2: 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
			3: 'HTML;',
			marks: {},
		},
	},
	{
		id: 'mock-threat-3',
		title: 'Twenty Twelve <= 1.4 — Reflected XSS',
		description:
			'Earlier versions of the Twenty Twelve theme are affected by a reflected cross-site scripting issue in the search template.',
		status: 'current',
		severity: 5,
		signature: 'CVE-2014-9036',
		firstDetected: '2026-04-22T14:12:00.000Z',
		fixedIn: '1.5',
		extension: {
			slug: 'twentytwelve',
			name: 'Twenty Twelve',
			version: '1.4',
			type: 'themes',
		},
	},
	{
		id: 'mock-threat-4',
		title: 'Suspicious eval() call in mu-plugins',
		description:
			'Detected a base64-decoded `eval()` block in a must-use plugin file. This pattern is commonly used by backdoors.',
		status: 'current',
		severity: 7,
		signature: 'PHP.Backdoor.Eval.5',
		firstDetected: '2026-04-25T03:45:00.000Z',
		filename: '/wp-content/mu-plugins/cache.php',
	},
	{
		id: 'mock-threat-5',
		title: 'WordPress core <= 6.3 — SSRF in HTTP client',
		description:
			'A server-side request forgery issue affects sites running WordPress 6.3 and earlier when proxying remote requests through `wp_remote_get`.',
		status: 'current',
		severity: 6,
		signature: 'CVE-2024-31210',
		firstDetected: '2026-04-18T09:00:00.000Z',
		fixable: {
			fixer: 'update',
			target: '6.4.2',
		},
	},
];

const mockHistoryThreats: Threat[] = [
	{
		...mockThreats[ 0 ],
		id: 'mock-history-1',
		status: 'fixed',
		fixedOn: '2026-04-15T10:00:00.000Z',
	},
	{
		...mockThreats[ 1 ],
		id: 'mock-history-2',
		status: 'fixed',
		fixedOn: '2026-04-10T18:30:00.000Z',
	},
	{
		...mockThreats[ 2 ],
		id: 'mock-history-3',
		status: 'ignored',
	},
	{
		...mockThreats[ 3 ],
		id: 'mock-history-4',
		status: 'ignored',
	},
];

export const mockSiteScan: SiteScanResponse = {
	state: 'idle',
	threats: mockThreats,
	hasNeverRun: false,
	mostRecent: {
		timestamp: '2026-04-30T12:00:00.000Z',
		isInitial: false,
	},
};

export const mockSiteScanHistory: SiteScanHistoryResponse = {
	threats: mockHistoryThreats,
};

export const mockSiteScanCounts: SiteScanCountsResponse = {
	current: mockThreats.length,
	fixed: mockHistoryThreats.filter( threat => threat.status === 'fixed' ).length,
	ignored: mockHistoryThreats.filter( threat => threat.status === 'ignored' ).length,
};

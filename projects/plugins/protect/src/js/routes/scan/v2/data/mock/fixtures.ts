/**
 * Fixture threats used by `?jpprotect-mock=1`. Two active (one fixable
 * malware, one ignorable vulnerability) and two history entries (one
 * fixed, one ignored) so Protect's Scan v2 surface renders with
 * realistic data — useful for design reviews on a JN site without a
 * Scan plan.
 *
 * Threat shape matches upstream `@automattic/jetpack-scan` exactly so
 * `ThreatsDataViews` (the only shared JS atom in Stage 1) consumes
 * these without translation. IDs/titles/timestamps are visibly
 * Protect-specific so this data is distinguishable from Scan's own
 * `?jps-mock=1` fixtures.
 */
import type {
	FixThreatsResponse,
	SiteScanCountsResponse,
	SiteScanHistoryResponse,
	SiteScanResponse,
	Threat,
} from '../types';

const ACTIVE_FIXABLE_MALWARE: Threat = {
	id: 'protect-mock-1',
	title: 'Malicious code in plugin',
	description: 'A backdoor was detected in a third-party plugin.',
	severity: 8,
	status: 'current',
	fixable: {
		fixer: 'replace',
		target: 'wp-content/plugins/example.php',
	},
	signature: 'EICAR-Test-Signature',
	firstDetected: '2026-04-15T12:00:00.000Z',
	filename: 'wp-content/plugins/example.php',
};

const ACTIVE_IGNORABLE_VULN: Threat = {
	id: 'protect-mock-2',
	title: 'Vulnerable plugin version',
	description: 'A plugin on this site has a known vulnerability.',
	severity: 5,
	status: 'current',
	fixable: false,
	signature: 'CVE-2026-00002',
	firstDetected: '2026-04-20T08:00:00.000Z',
	extension: {
		slug: 'example-plugin',
		name: 'Example Plugin',
		version: '1.0.0',
		type: 'plugins',
	},
};

const HISTORY_FIXED: Threat = {
	id: 'protect-mock-3',
	title: 'Old malware (fixed)',
	description: 'A previously-detected malware sample, fixed.',
	severity: 7,
	status: 'fixed',
	fixedOn: '2026-04-25T16:00:00.000Z',
	firstDetected: '2026-04-10T09:00:00.000Z',
	signature: 'PHP.Backdoor.Sample.1',
};

const HISTORY_IGNORED: Threat = {
	id: 'protect-mock-4',
	title: 'Ignored vulnerability',
	description: 'User chose to ignore this vulnerability.',
	severity: 3,
	status: 'ignored',
	firstDetected: '2026-04-08T13:00:00.000Z',
	signature: 'CVE-2026-00004',
};

export const mockSiteScan: SiteScanResponse = {
	state: 'idle',
	threats: [ ACTIVE_FIXABLE_MALWARE, ACTIVE_IGNORABLE_VULN ],
	hasNeverRun: false,
	mostRecent: {
		timestamp: '2026-04-30T12:00:00.000Z',
		isInitial: false,
	},
};

export const mockSiteScanHistory: SiteScanHistoryResponse = {
	threats: [ HISTORY_FIXED, HISTORY_IGNORED ],
};

export const mockSiteScanCounts: SiteScanCountsResponse = {
	current: mockSiteScan.threats.length,
	fixed: mockSiteScanHistory.threats.filter( threat => threat.status === 'fixed' ).length,
	ignored: mockSiteScanHistory.threats.filter( threat => threat.status === 'ignored' ).length,
};

export const mockFixThreatsResponse: FixThreatsResponse = {
	ok: true,
	threats: {
		'protect-mock-1': { status: 'in_progress' },
	},
};

export const mockFixThreatsStatusResponse: FixThreatsResponse = {
	ok: true,
	threats: {
		'protect-mock-1': { status: 'fixed' },
	},
};

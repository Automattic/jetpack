import type {
	SiteScanCountsResponse,
	SiteScanHistoryResponse,
	SiteScanResponse,
	Threat,
} from '../types';

/**
 * Fixture threats used by `?jps-mock=1`. Keep small and obviously fake —
 * these are for design iteration, not realistic threat coverage.
 */
const mockThreats: Threat[] = [
	{
		id: 'mock-threat-1',
		title: 'Vulnerability in Mock Plugin',
		description:
			'A representative high-severity vulnerability used to drive the active-threats list in mock mode.',
		status: 'current',
		severity: 8,
		signature: 'mock_vulnerable_plugin',
		firstDetected: '2026-04-30T12:00:00.000Z',
		fixable: {
			fixer: 'update',
			target: '1.2.3',
		},
		extension: {
			slug: 'mock-plugin',
			name: 'Mock Plugin',
			version: '1.0.0',
			type: 'plugins',
		},
	},
	{
		id: 'mock-threat-2',
		title: 'Suspicious file detected',
		description:
			'A representative low-severity file scan finding used for mock-mode design iteration.',
		status: 'current',
		severity: 3,
		signature: 'mock_suspicious_file',
		firstDetected: '2026-04-29T08:30:00.000Z',
		fixable: {
			fixer: 'delete',
			target: '/wp-content/uploads/mock-suspicious.php',
		},
		filename: '/wp-content/uploads/mock-suspicious.php',
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
	threats: [
		{
			...mockThreats[ 0 ],
			id: 'mock-history-1',
			status: 'fixed',
			fixedOn: '2026-03-15T10:00:00.000Z',
		},
	],
};

export const mockSiteScanCounts: SiteScanCountsResponse = {
	current: mockThreats.length,
	fixed: 1,
	ignored: 0,
};

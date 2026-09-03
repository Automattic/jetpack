/**
 * Shared payload fixtures for the Overview suites, mirroring the real
 * ai-assistant-feature response shape (dash-cased keys). Not a test file:
 * jest.config.gui.js never collects it as a suite.
 */

export const freePayload = () => ( {
	'has-feature': false,
	'requests-count': 12,
	'requests-limit': 20,
	'usage-period': { 'requests-count': 3, 'next-start': '2026-09-01' },
	'current-tier': { value: 0, limit: 20 },
	'next-tier': { value: 100, limit: 100 },
} );

// Every free request used: 0 of 20 available, with an upgrade on offer.
export const depletedPayload = () => ( {
	...freePayload(),
	'requests-count': 20,
} );

// The paid subscription as actually serialized: value 1 with a localized
// readable-limit. There is no higher tier to sell.
export const paidPayload = () => ( {
	'has-feature': true,
	'requests-count': 950,
	'requests-limit': 20,
	'usage-period': { 'requests-count': 340, 'next-start': '2026-09-01' },
	'current-tier': { value: 1, limit: 999999999, 'readable-limit': 'Unlimited' },
} );

// The retired tiered plans still arrive on the wire for old subscribers.
export const legacyTieredPayload = () => ( {
	...paidPayload(),
	'current-tier': { value: 500, limit: 500 },
	'next-tier': { value: 750, limit: 750 },
} );

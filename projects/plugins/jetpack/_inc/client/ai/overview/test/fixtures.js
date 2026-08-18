/**
 * Shared payload fixtures for the Overview suites, mirroring the real
 * ai-assistant-feature response shape (dash-cased keys). Not a test file:
 * jest.config.gui.js never collects it as a suite.
 */

export const freePayload = () => ( {
	'has-feature': false,
	'requests-count': 12,
	'requests-limit': 20,
	'usage-period': { 'requests-count': 3, 'next-start': '2026-09-01T00:00:00+00:00' },
	'current-tier': { value: 0, limit: 20 },
	'next-tier': { value: 100, limit: 100 },
} );

export const tieredPayload = () => ( {
	'has-feature': true,
	'requests-count': 950,
	'requests-limit': 20,
	'usage-period': { 'requests-count': 340, 'next-start': '2026-09-01T00:00:00+00:00' },
	// Tiered tiers carry no readable limit — only the unlimited tier does.
	'current-tier': { value: 500, limit: 500 },
	'next-tier': { value: 750, limit: 750 },
} );

export const unlimitedPayload = () => ( {
	...tieredPayload(),
	// The unlimited tier as actually serialized: a localized readable-limit.
	'current-tier': { value: 1, limit: 999999999, 'readable-limit': 'Unlimited' },
} );

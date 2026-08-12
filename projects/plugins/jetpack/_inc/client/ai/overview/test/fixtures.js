/**
 * Shared payload fixtures for the Overview suites.
 *
 * Shapes mirror the wpcom/v2/jetpack-ai/ai-assistant-feature response
 * (dash-cased keys, straight from the WPCOM usage helper). Kept in one place
 * so the hook tests and the render tests cannot drift apart.
 *
 * Not a test file: jest.config.gui.js collects `test/component.js` and an
 * explicit list of `.jsx` suites, so this is never picked up as a suite.
 */

export const freePayload = () => ( {
	'has-feature': false,
	'requests-count': 12,
	'requests-limit': 20,
	'usage-period': { 'requests-count': 3, 'next-start': '2026-09-01' },
	'current-tier': { value: 0, limit: 20 },
	'next-tier': { value: 100, limit: 100 },
} );

export const tieredPayload = () => ( {
	'has-feature': true,
	'requests-count': 950,
	'requests-limit': 20,
	'usage-period': { 'requests-count': 340, 'next-start': '2026-09-01' },
	'current-tier': { value: 500, limit: 500, readableLimit: '500' },
	'next-tier': { value: 750, limit: 750 },
} );

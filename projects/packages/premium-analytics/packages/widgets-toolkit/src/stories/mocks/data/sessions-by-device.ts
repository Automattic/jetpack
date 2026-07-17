/**
 * Mock data for sessions/by-device endpoint
 *
 * Used by: SessionsByDeviceWidget
 *
 * API Response format:
 * - { summary: { active_sessions, ... }, items: [...] }
 * - Values are strings (converted to numbers by sanitizer)
 */

/**
 * Response item from the sessions/by-device endpoint
 */
export type SessionsByDeviceItem = {
	device_type: string;
	active_sessions: string;
};

/**
 * Mock data for primary period (current)
 *
 * Represents a typical distribution:
 * - Mobile: ~56% (largest segment)
 * - Desktop: ~31%
 * - Tablet: ~13% (smallest segment)
 */
export const mockSessionsByDeviceData: SessionsByDeviceItem[] = [
	{ device_type: 'mobile', active_sessions: '4523' },
	{ device_type: 'desktop', active_sessions: '2487' },
	{ device_type: 'tablet', active_sessions: '1012' },
];

/**
 * Mock data for comparison period (previous)
 *
 * Shows slightly lower numbers to create meaningful deltas:
 * - Mobile: grew by ~8%
 * - Desktop: grew by ~5%
 * - Tablet: grew by ~3%
 */
export const mockSessionsByDeviceComparisonData: SessionsByDeviceItem[] = [
	{ device_type: 'mobile', active_sessions: '4180' },
	{ device_type: 'desktop', active_sessions: '2370' },
	{ device_type: 'tablet', active_sessions: '982' },
];

/**
 * Empty mock data for empty state stories
 */
export const mockSessionsByDeviceEmptyData: SessionsByDeviceItem[] = [];

/**
 * Mock data with extreme values for stress testing
 */
export const mockSessionsByDeviceExtremeData: SessionsByDeviceItem[] = [
	{ device_type: 'mobile', active_sessions: '1234567' },
	{ device_type: 'desktop', active_sessions: '987654' },
	{ device_type: 'tablet', active_sessions: '543210' },
];

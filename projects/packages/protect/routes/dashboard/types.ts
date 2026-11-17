/** Each section's state from PHP, keyed by section key. */
export type ProtectDashboardState = Record< string, unknown >;

declare global {
	interface Window {
		jetpackProtectDashboard?: ProtectDashboardState;
		jetpackMenuBadges?: { setCount: ( slug: string, count: number ) => void };
		jetpackProtectThreatCount?: number;
	}
}

export type SectionState = {
	available: boolean;
	active: boolean;
	url: string;
};

export type ProtectDashboardState = {
	scan: SectionState;
	monitor: SectionState;
	firewall: SectionState;
	loginProtection: SectionState;
};

declare global {
	interface Window {
		jetpackProtectDashboard?: ProtectDashboardState;
	}
}

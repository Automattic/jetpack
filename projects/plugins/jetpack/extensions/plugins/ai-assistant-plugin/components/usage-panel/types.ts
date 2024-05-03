import { PlanType } from '../../../../shared/use-plan-type';

export const USAGE_PANEL_PLACEMENT_JETPACK_SIDEBAR = 'jetpack_sidebar';
export const USAGE_PANEL_PLACEMENT_BLOCK_SETTINGS_SIDEBAR = 'block_settings_sidebar';

/*
 * Props for the usage panel component.
 */
export type UsagePanelProps = {
	placement?:
		| typeof USAGE_PANEL_PLACEMENT_JETPACK_SIDEBAR
		| typeof USAGE_PANEL_PLACEMENT_BLOCK_SETTINGS_SIDEBAR;
};

export type InternalUsagePanelProps = {
	isOverLimit: boolean;
	requestsCount: number;
	requestsLimit: number;
	nextStart: string;
	nextLimit: number;
	planType: PlanType;
	loading: boolean;
	canUpgrade: boolean;
	showContactUsCallToAction: boolean;
	isRedirecting: boolean;
	contactUsURL: string;
	handleContactUsClick: ( event: React.MouseEvent< HTMLElement > ) => void;
	checkoutUrl: string;
	handleUpgradeClick: ( event: React.MouseEvent< HTMLElement > ) => void;
};

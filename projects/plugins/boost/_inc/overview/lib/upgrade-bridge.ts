export const OVERVIEW_UPGRADE_EVENT = 'jetpack-boost:mount-overview-upgrade';

export type UpgradeSlotRequest = {
	container: HTMLElement;
	unmount?: () => void;
};

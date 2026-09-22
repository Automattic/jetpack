export const OVERVIEW_UPGRADE_EVENT = 'jetpack-boost:mount-overview-upgrade';

// A listener must set `unmount` synchronously during dispatch; an unset `unmount` means nothing answered.
export type UpgradeSlotRequest = {
	container: HTMLElement;
	unmount?: () => void;
};

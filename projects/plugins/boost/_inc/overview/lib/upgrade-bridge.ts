export const OVERVIEW_UPGRADE_EVENT = 'jetpack-boost:mount-overview-upgrade';
export const upgradeHref = 'admin.php?page=my-jetpack#/add-boost';

export type UpgradeSlotRequest = {
	container: HTMLElement;
	// Set synchronously during dispatch by the listener that mounts into `container`.
	// Still undefined once `dispatchEvent()` returns means nothing mounted.
	unmount?: () => void;
};

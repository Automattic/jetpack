/**
 * The prompts this page can show. Kept in sync with the
 * WPCOM_SIMPLE_BACKUP_STATE_* constants in wpcom-simple-backup.php.
 */
export type BackupState = 'upgrade' | 'in_progress' | 'activate' | 'ineligible';

/**
 * State resolved in PHP and localized onto the page's prerequisites script.
 *
 * Resolved server-side because the plan, transfer and eligibility checks read
 * wpcom-only libraries with no REST equivalent a Simple site could call.
 */
export type InitialState = {
	state: BackupState;
	domain: string;
	/** Human-readable transfer blockers. Only populated in the `ineligible` state. */
	blockers: string[];
	upgradeUrl: string;
	activateUrl: string;
	supportUrl: string;
};

declare global {
	interface Window {
		wpcomSimpleBackupInitialState?: InitialState;
	}
}

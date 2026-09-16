/**
 * The prompts this page can show. Kept in sync with the
 * WPCOM_SIMPLE_BACKUP_STATE_* constants in wpcom-simple-backup.php.
 */
export type BackupState = 'upgrade' | 'in_progress' | 'activate' | 'ineligible';

/** The site's address before and after a transfer. */
export type DomainNames = {
	current: string;
	new: string;
};

/**
 * One transfer warning, in the shape the wpcom eligibility API returns it.
 *
 * Snake_case because PHP passes the API's own response through untouched; the
 * Calypso dashboard reads the same fields.
 */
export type TransferWarning = {
	id: string;
	description: string;
	domain_names?: DomainNames;
	support_url?: string;
};

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
	/** Non-blocking transfer warnings. Only populated in the `activate` state. */
	warnings: TransferWarning[];
	upgradeUrl: string;
	activateUrl: string;
	supportUrl: string;
};

declare global {
	interface Window {
		wpcomSimpleBackupInitialState?: InitialState;
	}
}

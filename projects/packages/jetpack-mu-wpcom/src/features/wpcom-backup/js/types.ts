/**
 * The prompts this page can show. Kept in sync with the
 * WPCOM_BACKUP_STATE_* constants in wpcom-backup.php.
 */
export type BackupState = 'upgrade' | 'in_progress' | 'activate';

/**
 * One blocking eligibility error, in the shape the wpcom eligibility API
 * returns it. The page maps `code` to its own copy, falling back to `message`.
 */
export type TransferError = {
	code: string;
	message: string;
};

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
	domain_names: DomainNames | null;
	support_url: string;
};

/**
 * State resolved in PHP and localized onto the page's prerequisites script.
 *
 * Resolved server-side because the plan, transfer and eligibility checks read
 * wpcom-only libraries with no REST equivalent the page could call.
 */
export type InitialState = {
	state: BackupState;
	domain: string;
	/** Whether the site passed every transfer check. */
	isEligible: boolean;
	/** Blocking transfer errors. Only populated in the `activate` state. */
	errors: TransferError[];
	/** Non-blocking transfer warnings. Only populated in the `activate` state. */
	warnings: TransferWarning[];
	upgradeUrl: string;
	activateUrl: string;
	/** Localized names of the plans that include backups. */
	planNames: {
		business: string;
		commerce: string;
	};
};

declare global {
	interface Window {
		wpcomBackupInitialState?: InitialState;
	}
}

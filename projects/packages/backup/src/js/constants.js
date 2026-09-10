export const BACKUP_STATE = {
	LOADING: 0,
	IN_PROGRESS: 1,
	NO_BACKUPS: 2,
	NO_BACKUPS_RETRY: 3,
	NO_GOOD_BACKUPS: 4,
	COMPLETE: 5,
	// The backup list could not be read at all. Distinct from every state
	// above, each of which asserts something about the site's backups:
	// NO_BACKUPS says there are none yet, NO_BACKUPS_RETRY says one failed
	// and will be retried, NO_GOOD_BACKUPS says they are broken and sends
	// the reader to support. After a failed read we know none of that.
	FETCH_FAILED: 6,
};

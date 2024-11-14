import { Threat, ThreatFixStatus, FIXER_IS_STALE_THRESHOLD } from '..';

export const getThreatType = ( threat: Threat ) => {
	if ( threat.signature === 'Vulnerable.WP.Core' ) {
		return 'core';
	}
	if ( threat.extension ) {
		return threat.extension.type;
	}
	if ( threat.filename ) {
		return 'file';
	}

	return null;
};

export const fixerTimestampIsStale = ( lastUpdatedTimestamp: string ) => {
	const now = new Date();
	const lastUpdated = new Date( lastUpdatedTimestamp );
	return now.getTime() - lastUpdated.getTime() >= FIXER_IS_STALE_THRESHOLD;
};

export const fixerIsInError = ( fixerStatus: ThreatFixStatus ) => {
	return 'error' in fixerStatus && fixerStatus.error;
};

export const fixerIsInProgress = ( fixerStatus: ThreatFixStatus ) => {
	return 'status' in fixerStatus && fixerStatus.status === 'in_progress';
};

export const fixerStatusIsStale = ( fixerStatus: ThreatFixStatus ) => {
	return (
		fixerIsInProgress( fixerStatus ) &&
		'lastUpdated' in fixerStatus &&
		fixerTimestampIsStale( fixerStatus.lastUpdated )
	);
};

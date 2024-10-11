import { code, color, grid, plugins, shield, wordpress } from '@wordpress/icons';
import { DataViewThreat, ThreatFixStatus } from './types';

export const getThreatIcon = ( threat: DataViewThreat ) => {
	const type = getThreatType( threat );

	switch ( type ) {
		case 'plugin':
			return plugins;
		case 'theme':
			return color;
		case 'core':
			return wordpress;
		case 'file':
			return code;
		case 'database':
			return grid;
		default:
			return shield;
	}
};

export const getThreatType = ( threat: DataViewThreat ) => {
	if ( threat.signature === 'Vulnerable.WP.Core' ) {
		return 'core';
	}
	if ( threat.extension ) {
		return threat.extension.type;
	}
	if ( threat.filename ) {
		return 'file';
	}
	if ( threat.table ) {
		return 'database';
	}

	return null;
};

export const getThreatSubtitle = ( threat: DataViewThreat ) => {
	const type = getThreatType( threat );

	switch ( type ) {
		case 'plugin':
		case 'theme':
			return `${ threat.extension?.name } (${ threat.extension?.version })`;
		case 'core':
			return 'WordPress Core';
		case 'file':
			return threat.filename;
		case 'database':
			return threat.table;
		default:
			return '';
	}
};

const FIXER_IS_STALE_THRESHOLD = 1000 * 60 * 60 * 24; // 24 hours

export const fixerTimestampIsStale = ( lastUpdatedTimestamp: string ) => {
	const now = new Date();
	const lastUpdated = new Date( lastUpdatedTimestamp );
	return now.getTime() - lastUpdated.getTime() >= FIXER_IS_STALE_THRESHOLD;
};

export const fixerStatusIsStale = ( fixerStatus: ThreatFixStatus ) => {
	return (
		'status' in fixerStatus &&
		fixerStatus.status === 'in_progress' &&
		fixerTimestampIsStale( fixerStatus.last_updated )
	);
};

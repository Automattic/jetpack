import { __ } from '@wordpress/i18n';
import { isMockMode } from './data/mock';
import type { FC } from 'react';

const style: React.CSSProperties = {
	background: '#fef7c2',
	borderBlockEnd: '1px solid #d3af00',
	color: '#4a2d00',
	fontSize: 12,
	padding: '6px 16px',
	textAlign: 'center',
};

/**
 * Warn loudly when the Overview is running on fixture data so the team
 * doesn't mistake `?jpb-mock=1` screenshots / video captures for real
 * backups on the site.
 * @return The banner or null if mock mode is off.
 */
const MockBanner: FC = () => {
	if ( ! isMockMode() ) {
		return null;
	}
	return (
		<div role="status" style={ style }>
			{ __(
				'Dev mode: the backup list below is fixture data (`?jpb-mock=1`). No real requests are being made.',
				'jetpack-backup-pkg'
			) }
		</div>
	);
};

export default MockBanner;

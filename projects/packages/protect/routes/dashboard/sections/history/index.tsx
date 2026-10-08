import { __ } from '@wordpress/i18n';
import HistoryPanel from './history-panel';
import HistoryInspector from './inspector';
import { HISTORY_THREAT_PARAM } from './store';
import type { ProtectSection } from '../types';

/** The History section's state from PHP. */
type HistoryState = { hasPlan: boolean };

const section: ProtectSection< HistoryState | undefined > = {
	key: 'history',
	tab: {
		value: 'history',
		label: () => __( 'History', 'jetpack-protect-pkg' ),
		isAvailable: ctx => Boolean( ctx.state?.hasPlan ),
		Panel: HistoryPanel,
	},
	inspector: { param: HISTORY_THREAT_PARAM, Panel: HistoryInspector },
};

export default section;

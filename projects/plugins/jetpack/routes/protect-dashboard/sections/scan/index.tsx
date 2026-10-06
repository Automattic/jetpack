import ScanCard from './scan-card';
import ScanSettingsCard from './settings-card';
import type { ProtectSection } from '../types';
import type { ScanContext, ScanState } from './types';

/**
 * The Overview's Scan card, once PHP has printed the Scan state.
 *
 * @param props       - The dashboard context.
 * @param props.state - The Scan section's state.
 * @return The card.
 */
function ScanOverviewCard( { state }: ScanContext ) {
	return state ? <ScanCard scan={ state } /> : null;
}

const section: ProtectSection< ScanState | undefined > = {
	key: 'scan',
	OverviewCard: ScanOverviewCard,
	SettingsCard: ScanSettingsCard,
};

export default section;

import ScanCard from './scan-card';
import ScanSettingsCard from './settings-card';
import type { DashboardContext, ProtectSection } from '../types';
import type { ScanState } from './types';

/**
 * The Overview's Scan card, once PHP has printed the Scan state.
 *
 * @param props       - The dashboard context.
 * @param props.state - The Scan section's state.
 * @return The card.
 */
function ScanOverviewCard( { state }: DashboardContext ) {
	return state ? <ScanCard scan={ state as ScanState } /> : null;
}

const section: ProtectSection = {
	key: 'scan',
	OverviewCard: ScanOverviewCard,
	SettingsCard: ScanSettingsCard,
};

export default section;

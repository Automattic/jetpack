import FirewallOverviewCard from './overview-card';
import FirewallSettingsCard from './settings-card';
import type { ProtectSection } from '../types';
import type { FirewallState } from './types';

const section: ProtectSection< FirewallState | undefined > = {
	key: 'firewall',
	OverviewCard: FirewallOverviewCard,
	SettingsCard: FirewallSettingsCard,
};

export default section;

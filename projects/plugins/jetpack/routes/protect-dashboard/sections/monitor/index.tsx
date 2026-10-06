import MonitorCard from './monitor-card';
import MonitorSettingsCard from './settings-card';
import type { ProtectSection } from '../types';

const section: ProtectSection = {
	key: 'monitor',
	OverviewCard: MonitorCard,
	SettingsCard: MonitorSettingsCard,
};

export default section;

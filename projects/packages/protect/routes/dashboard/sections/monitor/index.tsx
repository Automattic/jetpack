import MonitorCard from './monitor-card';
import MonitorSettingsCard from './settings-card';
import type { ProtectSection } from '../types';
import type { MonitorState } from './types';

const section: ProtectSection< MonitorState | undefined > = {
	key: 'monitor',
	OverviewCard: MonitorCard,
	SettingsCard: MonitorSettingsCard,
};

export default section;

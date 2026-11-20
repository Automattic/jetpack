import LoginProtectionCard from './login-protection-card';
import LoginProtectionSettingsCard from './login-protection-settings-card';
import type { ProtectSection } from '../types';
import type { LoginProtectionState } from './types';

const section: ProtectSection< LoginProtectionState | undefined > = {
	key: 'loginProtection',
	OverviewCard: LoginProtectionCard,
	SettingsCard: LoginProtectionSettingsCard,
};

export default section;

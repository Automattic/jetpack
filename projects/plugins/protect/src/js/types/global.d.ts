import { type ScanStatus } from '@automattic/jetpack-scan';
import { AccountProtectionStatus } from './account-protection';
import { PluginData, ThemeData } from './installed-extensions';
import { ProductData } from './products';
import { WafStatus } from './waf';

declare module '*.scss';
declare module '*.png';

declare global {
	interface Window {
		jetpackProtectInitialState?: {
			apiRoot: string;
			apiNonce: string;
			registrationNonce: string;
			credentials: [ Record< string, unknown > ];
			status: ScanStatus;
			fixerStatus: FixersStatus;
			scanHistory: ScanStatus;
			installedPlugins: {
				[ key: string ]: PluginData;
			};
			installedThemes: {
				[ key: string ]: ThemeData;
			};
			wpVersion: string;
			adminUrl: string;
			siteSuffix: string;
			blogID: number;
			jetpackScan: ProductData;
			hasPlan: boolean;
			onboardingProgress: string[];
			accountProtection: AccountProtectionStatus;
			waf: WafStatus;
		};
	}
}

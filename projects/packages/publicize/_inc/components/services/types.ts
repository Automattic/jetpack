import { ConnectionService } from '../../types';

export interface ServiceUiDetails {
	description: string;
	/**
	 * Short account-type descriptor shown on the platform picker card
	 * (e.g. "Profile", "Page"). Distinct from the longer `description`.
	 */
	accountType: string;
	/**
	 * Shorter label for the picker card, when the service `label` is too long
	 * (e.g. "Instagram" for the "Instagram Business" service). Falls back to
	 * `label`.
	 */
	shortLabel?: string;
	icon: React.ComponentType< { iconSize: number } >;
	examples?: Array< React.ComponentType >;
	needsCustomInputs?: boolean;
}

export interface SupportedService extends ConnectionService, ServiceUiDetails {}

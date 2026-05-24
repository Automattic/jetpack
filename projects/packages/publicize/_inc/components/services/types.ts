import { ConnectionService } from '../../types';

export interface ServiceUiDetails {
	description: string;
	icon: React.ComponentType< { iconSize: number } >;
	examples?: Array< React.ComponentType >;
	needsCustomInputs?: boolean;
}

export interface SupportedService extends ConnectionService, ServiceUiDetails {}

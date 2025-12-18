import { INTEGRATIONS_STORE } from '.';
import type { Integration } from '../../types/index.ts';

export type IntegrationsState = {
	items: Integration[] | null;
	isLoading: boolean;
	error: string | null;
};

export type IntegrationsAction = {
	type: string;
	items?: Integration[];
	isLoading?: boolean;
	error?: string | null;
};

export type IntegrationsSelectors = {
	getIntegrations: () => Integration[] | null;
	isIntegrationsLoading: () => boolean;
	getIntegrationsError: () => string | null;
};

export type IntegrationsDispatch = {
	refreshIntegrations: () => Promise< void >;
	invalidateIntegrations: () => void;
};

export type SelectIntegrations = ( store: typeof INTEGRATIONS_STORE ) => IntegrationsSelectors;

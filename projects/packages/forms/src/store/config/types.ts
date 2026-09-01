import { CONFIG_STORE } from '.';
import type { FormsConfigData } from '../../types/index.ts';

export type ConfigState = {
	config: Partial< FormsConfigData > | null;
	isLoading: boolean;
	error: string | null;
};

export type ConfigAction = {
	type: string;
	config?: Partial< FormsConfigData >;
	key?: keyof FormsConfigData;
	value?: unknown;
	isLoading?: boolean;
	error?: string | null;
};

export type ConfigSelectors = {
	getConfig: () => Partial< FormsConfigData > | null;
	getConfigValue: < K extends keyof FormsConfigData >( key: K ) => FormsConfigData[ K ] | undefined;
	isConfigLoading: () => boolean;
	getConfigError: () => string | null;
};

export type ConfigDispatch = {
	refreshConfig: () => Promise< void >;
	invalidateConfig: () => void;
};

export type SelectConfig = ( store: typeof CONFIG_STORE ) => ConfigSelectors;

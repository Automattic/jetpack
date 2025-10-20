import type { ConfigState } from './types';
import type { FormsConfigData } from '../../types';

export const getConfig = ( state: ConfigState ): Partial< FormsConfigData > | null => state.config;

export const getConfigValue = < K extends keyof FormsConfigData >(
	state: ConfigState,
	key: K
): FormsConfigData[ K ] | undefined => state.config?.[ key ];

export const isConfigLoading = ( state: ConfigState ): boolean => state.isLoading;

export const getConfigError = ( state: ConfigState ): string | null => state.error;

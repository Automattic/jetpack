import type { IntegrationsState } from './types.ts';
import type { Integration } from '../../types/index.ts';

export const getIntegrations = ( state: IntegrationsState ): Integration[] | null => state.items;
export const isIntegrationsLoading = ( state: IntegrationsState ): boolean => state.isLoading;
export const getIntegrationsError = ( state: IntegrationsState ): string | null => state.error;

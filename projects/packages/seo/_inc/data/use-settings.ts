import { REST_NAMESPACE } from '../constants';
import useSimpleMutation from './use-simple-mutation';
import useSimpleQuery from './use-simple-query';
import type { SettingsResponse, SettingsUpdatePayload } from './settings-types';

export const useSeoSettings = () =>
	useSimpleQuery< SettingsResponse >( {
		name: 'jetpack-seo-settings',
		query: { path: `/${ REST_NAMESPACE }/settings` },
	} );

export const useUpdateSeoSettings = () =>
	useSimpleMutation< SettingsResponse, SettingsUpdatePayload >( {
		name: 'jetpack-seo-settings-update',
		query: { path: `/${ REST_NAMESPACE }/settings`, method: 'POST' },
		invalidates: [ 'jetpack-seo-settings', 'jetpack-seo-overview' ],
	} );

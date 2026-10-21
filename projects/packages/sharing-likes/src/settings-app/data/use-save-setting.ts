import { useDispatch } from '@wordpress/data';
import { store } from './store';
import type { SettingKey, Settings } from '../types';

export type SaveSetting = < K extends SettingKey >(
	key: K,
	value: Settings[ K ]
) => Promise< Settings | undefined >;

/**
 * Save one setting optimistically, rolling it back if the server refuses.
 *
 * @return Save function, resolving to the saved settings or undefined on failure.
 */
export function useSaveSetting(): SaveSetting {
	return useDispatch( store ).saveSetting as SaveSetting;
}

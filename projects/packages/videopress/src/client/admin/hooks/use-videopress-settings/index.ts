/**
 * External dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
/*
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
/**
 * types
 */
import { VideopressSelectors } from '../../types';
import { useVideoPressSettingsProps } from './types';

export const useVideoPressSettings = (): useVideoPressSettingsProps => {
	const dispatch = useDispatch( STORE_ID );

	const settings = useSelect( select => {
		return ( select( STORE_ID ) as VideopressSelectors ).getVideoPressSettings();
	}, [] );

	return {
		settings: {
			videoPressVideosPrivateForSite: settings?.videoPressVideosPrivateForSite ?? false,
		},

		onUpdate: settingsToUpdate => dispatch.updateVideoPressSettings( settingsToUpdate ),
	};
};

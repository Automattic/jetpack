/**
 * External dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
/*
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import { SITE_TYPE_JETPACK } from '../../components/site-settings-section/constants';
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
			siteIsPrivate: settings?.siteIsPrivate ?? false,
			siteType: settings?.siteType ?? SITE_TYPE_JETPACK,
		},

		onUpdate: settingsToUpdate => dispatch.updateVideoPressSettings( settingsToUpdate ),
	};
};

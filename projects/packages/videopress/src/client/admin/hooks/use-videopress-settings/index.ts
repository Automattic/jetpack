/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
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
	const settings = useSelect( select => {
		return ( select( STORE_ID ) as VideopressSelectors ).getVideoPressSettings();
	}, [] );

	return {
		settings,
	};
};

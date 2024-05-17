import { Text, getRedirectUrl } from '@automattic/jetpack-components';
import { SOCIAL_STORE_ID } from '@automattic/jetpack-publicize-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import ToggleSection from '../toggle-section';
import { SocialStoreSelectors } from '../types/types';
import styles from './styles.module.scss';

type AutoConversionToggleProps = {
	/**
	 * If the toggle is disabled.
	 */
	disabled?: boolean;
};

const AutoConversionToggle: React.FC< AutoConversionToggleProps > = ( { disabled } ) => {
	const { isEnabled, isUpdating } = useSelect( select => {
		const store = select( SOCIAL_STORE_ID ) as SocialStoreSelectors;
		return {
			isEnabled: store.isAutoConversionEnabled(),
			isUpdating: store.isAutoConversionSettingsUpdating(),
		};
	}, [] );

	const updateOptions = useDispatch( SOCIAL_STORE_ID ).updateAutoConversionSettings;

	const toggleStatus = useCallback( () => {
		const newOption = {
			enabled: ! isEnabled,
		};
		updateOptions( newOption );
	}, [ isEnabled, updateOptions ] );

	return (
		<ToggleSection
			title={ __( 'Automatically convert images for compatibility', 'jetpack-social' ) }
			disabled={ isUpdating || disabled }
			checked={ isEnabled }
			onChange={ toggleStatus }
		>
			<Text className={ styles.text }>
				{ createInterpolateElement(
					__(
						'Social media platforms require different image file types and sizes. Upload one image and it will be automatically converted to ensure maximum compatibility & quality across all your connected platforms.<br/><link>Learn more about media requirements.</link>',
						'jetpack-social'
					),
					{
						br: <br />,
						link: (
							<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) } />
						),
					}
				) }
			</Text>
		</ToggleSection>
	);
};

export default AutoConversionToggle;

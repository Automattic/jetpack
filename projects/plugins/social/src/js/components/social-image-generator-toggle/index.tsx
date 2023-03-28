import { Button, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { SocialImageGeneratorTemplatePicker as TemplatePicker } from '@automattic/jetpack-publicize-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { STORE_ID } from '../../store';
import ToggleSection from '../toggle-section';
import { SocialStoreSelectors } from '../types/types';
import styles from './styles.module.scss';

const SocialImageGeneratorToggle: React.FC = () => {
	const [ currentTemplate, setCurrentTemplate ] = useState( null );
	const { isEnabled, isUpdating, defaultTemplate } = useSelect( select => {
		const store = select( STORE_ID ) as SocialStoreSelectors;
		return {
			isEnabled: store.isSocialImageGeneratorEnabled(),
			isUpdating: store.isUpdatingSocialImageGeneratorSettings(),
			defaultTemplate: store.getSocialImageGeneratorDefaultTemplate(),
		};
	}, [] );

	const updateOptions = useDispatch( STORE_ID ).updateSocialImageGeneratorSettings;

	const toggleStatus = useCallback( () => {
		const newOption = {
			enabled: ! isEnabled,
		};
		updateOptions( newOption );
	}, [ isEnabled, updateOptions ] );

	useEffect( () => {
		if ( currentTemplate ) {
			const newOption = { defaults: { template: currentTemplate } };
			updateOptions( newOption );
		}
	}, [ currentTemplate, updateOptions ] );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const renderTemplatePicker = useCallback(
		( { open } ) => (
			<Button
				fullWidth={ isSmall }
				className={ styles.button }
				variant="secondary"
				disabled={ isUpdating || ! isEnabled }
				onClick={ open }
			>
				{ __( 'Change default template', 'jetpack-social' ) }
			</Button>
		),
		[ isEnabled, isSmall, isUpdating ]
	);

	return (
		<ToggleSection
			title={ __( 'Enable Social Image Generator', 'jetpack-social' ) }
			disabled={ isUpdating }
			checked={ isEnabled }
			onChange={ toggleStatus }
		>
			<Text className={ styles.text }>
				{ __(
					'When enabled, Social Image Generator will automatically generate social images for your posts. You can use the button below to choose a default template for new posts.',
					'jetpack-social'
				) }
			</Text>
			<TemplatePicker
				value={ currentTemplate || defaultTemplate }
				onSelect={ setCurrentTemplate }
				render={ renderTemplatePicker }
			/>
		</ToggleSection>
	);
};

export default SocialImageGeneratorToggle;

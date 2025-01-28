import { Button, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { store as socialStore } from '../../../../social-store';
import TemplatePickerModal from '../../../social-image-generator/template-picker/modal';
import ToggleSection from '../toggle-section';
import styles from './styles.module.scss';

type SocialImageGeneratorToggleProps = {
	/**
	 * If the toggle is disabled.
	 */
	disabled?: boolean;
};

const SocialImageGeneratorToggle: React.FC< SocialImageGeneratorToggleProps > = ( {
	disabled,
} ) => {
	const { isEnabled, isUpdating, defaultTemplate } = useSelect( select => {
		const config = select( socialStore ).getSocialImageGeneratorConfig();

		return {
			isEnabled: config.enabled,
			defaultTemplate: config.template,
			isUpdating: select( socialStore ).isSavingSiteSettings(),
		};
	}, [] );

	const { updateSocialImageGeneratorConfig } = useDispatch( socialStore );

	const toggleStatus = useCallback( () => {
		const newOption = {
			enabled: ! isEnabled,
		};
		updateSocialImageGeneratorConfig( newOption );
	}, [ isEnabled, updateSocialImageGeneratorConfig ] );

	const updateTemplate = useCallback(
		( template: string ) => {
			updateSocialImageGeneratorConfig( { template } );
		},
		[ updateSocialImageGeneratorConfig ]
	);

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const renderTemplatePickerModal = useCallback(
		( { open } ) => (
			<Button
				fullWidth={ isSmall }
				className={ styles.button }
				variant="secondary"
				disabled={ isUpdating || ! isEnabled }
				onClick={ open }
			>
				{ __( 'Change default template', 'jetpack-publicize-components' ) }
			</Button>
		),
		[ isEnabled, isSmall, isUpdating ]
	);

	return (
		<ToggleSection
			title={ __( 'Enable Social Image Generator', 'jetpack-publicize-components' ) }
			disabled={ isUpdating || disabled }
			checked={ isEnabled }
			onChange={ toggleStatus }
		>
			<Text className={ styles.text }>
				{ __(
					'When enabled, Social Image Generator will automatically generate social images for your posts. You can use the button below to choose a default template for new posts. This feature is only supported in the block editor.',
					'jetpack-publicize-components'
				) }
			</Text>
			<TemplatePickerModal
				value={ defaultTemplate }
				onSelect={ updateTemplate }
				render={ renderTemplatePickerModal }
			/>
		</ToggleSection>
	);
};

export default SocialImageGeneratorToggle;

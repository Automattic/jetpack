import { Text } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { store as socialStore } from '../../../../social-store';
import TemplatePickerModal from '../../../social-image-generator/template-picker/modal';
import ToggleSection from '../toggle-section';
import styles from './styles.module.scss';
import type { FC } from 'react';

type SocialImageGeneratorToggleProps = {
	/**
	 * If the toggle is disabled.
	 */
	disabled?: boolean;
};

const SocialImageGeneratorToggle: FC< SocialImageGeneratorToggleProps > = ( { disabled } ) => {
	const { isEnabled, isUpdating, defaultTemplate, defaultImageId, defaultFont } = useSelect(
		select => {
			const config = select( socialStore ).getSocialSettings().socialImageGenerator;

			return {
				isEnabled: config.enabled,
				defaultTemplate: config.template,
				defaultImageId: config.default_image_id,
				defaultFont: config.font,
				isUpdating: select( socialStore ).isSavingSiteSettings(),
			};
		},
		[]
	);

	const { updateSocialImageGeneratorConfig } = useDispatch( socialStore );

	const toggleStatus = useCallback( () => {
		const newOption = {
			enabled: ! isEnabled,
		};
		updateSocialImageGeneratorConfig( newOption );
	}, [ isEnabled, updateSocialImageGeneratorConfig ] );

	const handleSave = useCallback(
		( { template, imageId, font } ) => {
			updateSocialImageGeneratorConfig( {
				enabled: isEnabled,
				template,
				default_image_id: imageId || 0,
				font,
			} );
		},
		[ updateSocialImageGeneratorConfig, isEnabled ]
	);

	const renderTemplatePickerModal = useCallback(
		( { open } ) => (
			<Button
				className={ styles.button }
				variant="outline"
				disabled={ isUpdating || ! isEnabled }
				onClick={ open }
			>
				{ __( 'Change defaults', 'jetpack-publicize-pkg' ) }
			</Button>
		),
		[ isEnabled, isUpdating ]
	);

	return (
		<ToggleSection
			title={ __( 'Enable Social Image Generator', 'jetpack-publicize-pkg' ) }
			disabled={ isUpdating || disabled }
			checked={ isEnabled }
			onChange={ toggleStatus }
		>
			<Text className={ styles.text }>
				{ __(
					'When enabled, Social Image Generator will automatically generate social images for your posts. You can use the button below to choose a default template and image for new posts. This feature is only supported in the block editor.',
					'jetpack-publicize-pkg'
				) }
			</Text>
			<TemplatePickerModal
				template={ defaultTemplate }
				imageId={ defaultImageId }
				font={ defaultFont }
				onSave={ handleSave }
				render={ renderTemplatePickerModal }
			/>
		</ToggleSection>
	);
};

export default SocialImageGeneratorToggle;

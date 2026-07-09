import { ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Stack } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import TemplatePickerModal from '../social-image-generator/template-picker/modal';

/**
 * Customize media card — Social Image Generator toggle + template picker.
 *
 * The parent Settings tab gates on `siteHasFeature( 'social-image-generator' )`,
 * so the card never renders on free plans. The "Change defaults" modal
 * reuses the legacy `TemplatePickerModal` unchanged — the underlying
 * picker tree was rebundled in this PR so the chassis esbuild pipeline
 * can compile it (`.js` → `.tsx`; `.jpg` imports replaced with runtime
 * `assets_url` resolution).
 *
 * @return The card.
 */
export default function CustomizeMediaCard(): JSX.Element {
	const { isEnabled, isUpdating, defaultTemplate, defaultImageId, defaultFont } = useSelect(
		select => {
			const store = select( socialStore );
			const config = store.getSocialSettings().socialImageGenerator;

			return {
				isEnabled: config.enabled,
				defaultTemplate: config.template,
				defaultImageId: config.default_image_id,
				defaultFont: config.font,
				isUpdating: store.isSavingSiteSettings(),
			};
		},
		[]
	);

	const { updateSocialImageGeneratorConfig } = useDispatch( socialStore );

	const onToggle = useCallback(
		( next: boolean ) => {
			updateSocialImageGeneratorConfig( { enabled: next } );
		},
		[ updateSocialImageGeneratorConfig ]
	);

	const onSaveTemplate = useCallback(
		( { template, imageId, font } ) => {
			updateSocialImageGeneratorConfig( {
				enabled: isEnabled,
				template,
				default_image_id: imageId || 0,
				font,
			} );
		},
		[ isEnabled, updateSocialImageGeneratorConfig ]
	);

	const renderTemplatePickerTrigger = useCallback(
		( { open } ) => (
			<Button
				variant="outline"
				size="compact"
				disabled={ isUpdating || ! isEnabled }
				onClick={ open }
			>
				{ __( 'Change defaults', 'jetpack-publicize-pkg' ) }
			</Button>
		),
		[ isEnabled, isUpdating ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Customize media', 'jetpack-publicize-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Enable Social Image Generator', 'jetpack-publicize-pkg' ) }
						checked={ isEnabled }
						disabled={ isUpdating }
						onChange={ onToggle }
						help={ __(
							"Automatically generate share images for your posts. Edit the default template and image from the block editor's Social sidebar when composing a post.",
							'jetpack-publicize-pkg'
						) }
					/>
					{ isEnabled && (
						<Stack direction="row" gap="md" className="jetpack-social-settings__card-actions">
							<TemplatePickerModal
								template={ defaultTemplate }
								imageId={ defaultImageId }
								font={ defaultFont }
								onSave={ onSaveTemplate }
								render={ renderTemplatePickerTrigger }
							/>
						</Stack>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

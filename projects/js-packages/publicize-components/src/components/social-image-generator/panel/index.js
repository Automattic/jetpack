import { useGlobalNotices } from '@automattic/jetpack-components';
import {
	PanelBody,
	ToggleControl,
	Button,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCallback, useState, Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import useImageGeneratorConfig from '../../../hooks/use-image-generator-config';
import { useSaveImageToLibrary } from '../../../hooks/use-save-image-to-library';
import GeneratedImagePreview from '../../generated-image-preview';
import SocialImageGeneratorSettingsModal from './modal';

const SocialImageGeneratorPanel = ( { prePublish = false } ) => {
	const PanelWrapper = prePublish ? Fragment : PanelBody;
	const wrapperProps = prePublish
		? {}
		: { title: __( 'Social Image Generator', 'jetpack-publicize-components' ) };
	const { isEnabled, setIsEnabled } = useImageGeneratorConfig();

	const [ isModalOpened, setIsModalOpened ] = useState( false );

	const openModal = useCallback( () => setIsModalOpened( true ), [] );
	const closeModal = useCallback( () => setIsModalOpened( false ), [] );

	const [ generatedImageToken, setGeneratedImageToken ] = useState( null );

	const { createErrorNotice, createSuccessNotice } = useGlobalNotices();

	const { save: saveToMediaLibrary, isSaving } = useSaveImageToLibrary( {
		onError: error => {
			createErrorNotice( error.message );
		},
		onSuccess: () => {
			createSuccessNotice( __( 'Image saved to media library.', 'jetpack-publicize-components' ) );
		},
	} );

	const onClickSaveToLibrary = useCallback( () => {
		saveToMediaLibrary(
			// We have to use the s0.wp.com directly to avoid the CORS issue when using jetpack.com/redirect
			`https://s0.wp.com/_si/?t=${ generatedImageToken }`,
			'generated-image.jpg'
		);
	}, [ generatedImageToken, saveToMediaLibrary ] );

	return (
		<PanelWrapper { ...wrapperProps }>
			{ isModalOpened && <SocialImageGeneratorSettingsModal onClose={ closeModal } /> }
			<ToggleControl
				label={ __( 'Enable Social Image', 'jetpack-publicize-components' ) }
				help={
					! isEnabled
						? __( 'Social Image is disabled for this post.', 'jetpack-publicize-components' )
						: ''
				}
				checked={ isEnabled }
				onChange={ setIsEnabled }
				__nextHasNoMarginBottom={ true }
			/>
			{ isEnabled && (
				<>
					<hr />
					<GeneratedImagePreview onNewToken={ setGeneratedImageToken } />
					<hr />
					<HStack spacing={ 2 } wrap>
						<Button
							variant="secondary"
							onClick={ openModal }
							label={ __(
								'Open the Social Image Generator settings',
								'jetpack-publicize-components'
							) }
						>
							{ __( 'Settings', 'jetpack-publicize-components' ) }
						</Button>
						<Button
							variant="secondary"
							onClick={ onClickSaveToLibrary }
							label={ __(
								'Save the generated image to your media library.',
								'jetpack-publicize-components'
							) }
							disabled={ ! generatedImageToken || isSaving }
						>
							{ isSaving
								? _x(
										'Saving…',
										'Saving the file to media library',
										'jetpack-publicize-components'
								  )
								: __( 'Save to media library', 'jetpack-publicize-components' ) }
						</Button>
					</HStack>
				</>
			) }
		</PanelWrapper>
	);
};

export default SocialImageGeneratorPanel;

import { PanelBody, ToggleControl, Button } from '@wordpress/components';
import { useCallback, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useImageGeneratorConfig from '../../../hooks/use-image-generator-config';
import GeneratedImagePreview from '../../generated-image-preview';
import TemplatePicker from '../template-picker';
import SocialImageGeneratorSettingsModal from './modal';

const SocialImageGeneratorPanel = ( { prePublish = false } ) => {
	const PanelWrapper = prePublish ? Fragment : PanelBody;
	const wrapperProps = prePublish ? {} : { title: __( 'Social Image Generator', 'jetpack' ) };
	const {
		isEnabled,
		setIsEnabled,
		customText,
		setCustomText,
		imageType,
		setImageType,
		imageId,
		setImageId,
		template,
		setTemplate,
	} = useImageGeneratorConfig();

	const renderTemplatePicker = useCallback(
		( { open } ) => (
			<Button variant="primary" onClick={ open }>
				{ __( 'Change Template', 'jetpack' ) }
			</Button>
		),
		[]
	);

	const [ isModalOpened, setIsModalOpened ] = useState( false );

	const openModal = useCallback( () => setIsModalOpened( true ), [] );
	const closeModal = useCallback( () => setIsModalOpened( false ), [] );

	return (
		<PanelWrapper { ...wrapperProps }>
			{ isModalOpened && (
				<SocialImageGeneratorSettingsModal
					onClose={ closeModal }
					{ ...{ imageType, setImageType, imageId, setImageId, setCustomText, customText } }
				/>
			) }
			<ToggleControl
				label={ __( 'Enable Social Image', 'jetpack' ) }
				help={ ! isEnabled ? __( 'Social Image is disabled for this post.', 'jetpack' ) : '' }
				checked={ isEnabled }
				onChange={ setIsEnabled }
			/>
			{ isEnabled && (
				<>
					<hr />
					<GeneratedImagePreview />
					<hr />
					<TemplatePicker
						onSelect={ setTemplate }
						value={ template }
						render={ renderTemplatePicker }
					/>
					<hr />
					<Button
						variant="secondary"
						onClick={ openModal }
						label={ __( 'Open the Social Image Generator settings', 'jetpack' ) }
					>
						{ __( 'Settings', 'jetpack' ) }
					</Button>
				</>
			) }
		</PanelWrapper>
	);
};

export default SocialImageGeneratorPanel;

import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	TextControl,
	SelectControl,
	Button,
} from '@wordpress/components';
import { useCallback, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useImageGeneratorConfig from '../../../hooks/use-image-generator-config';

const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];

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
	} = useImageGeneratorConfig();

	const onSelectImage = useCallback( media => setImageId( media.id ), [ setImageId ] );
	const onRemoveImage = useCallback( () => setImageId( null ), [ setImageId ] );
	const renderMedia = useCallback(
		open => (
			<div>
				<Button variant="primary" onClick={ open }>
					{ imageId
						? __( 'Replace Custom Image', 'jetpack' )
						: __( 'Choose Custom Image', 'jetpack' ) }
				</Button>
				{ imageId && (
					<Button variant="link" isDestructive onClick={ onRemoveImage }>
						{ __( 'Remove Custom Image', 'jetpack' ) }
					</Button>
				) }
			</div>
		),
		[ imageId, onRemoveImage ]
	);

	const ImageOptions = () => {
		return (
			<>
				<SelectControl
					label={ __( 'Image Type', 'jetpack' ) }
					value={ imageType }
					options={ [
						{
							label: __( 'Featured Image', 'jetpack' ),
							value: 'featured',
						},
						{ label: __( 'Custom Image', 'jetpack' ), value: 'custom' },
						{ label: __( 'Default Image', 'jetpack' ), value: 'default' },
						{ label: __( 'No Image', 'jetpack' ), value: 'none' },
					] }
					onChange={ setImageType }
					help={
						imageType === 'default'
							? __( 'You can change the default image by clicking the Edit link below.', 'jetpack' )
							: null
					}
				/>

				{ imageType === 'custom' && (
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ onSelectImage }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							render={ renderMedia }
						/>
					</MediaUploadCheck>
				) }
			</>
		);
	};

	return (
		<PanelWrapper { ...wrapperProps }>
			<ToggleControl
				label={ __( 'Enable Social Image', 'jetpack' ) }
				help={ ! isEnabled ? __( 'Social Image is disabled for this post.', 'jetpack' ) : '' }
				checked={ isEnabled }
				onChange={ setIsEnabled }
			/>
			{ isEnabled && (
				<>
					<TextControl
						value={ customText }
						onChange={ setCustomText }
						label={ __( 'Custom Text', 'jetpack' ) }
						help={ __(
							'By default the post title is used for the image. You can use this field to set your own text.',
							'jetpack'
						) }
					/>
					<hr />
					<ImageOptions />
				</>
			) }
		</PanelWrapper>
	);
};

export default SocialImageGeneratorPanel;

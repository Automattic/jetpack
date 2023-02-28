import { PanelBody, ToggleControl, TextControl, SelectControl } from '@wordpress/components';
import { useCallback, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useImageGeneratorConfig from '../../../hooks/use-image-generator-config';
import useMediaDetails from '../../../hooks/use-media-details';
import MediaPicker from '../../media-picker';

const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];
const ADD_MEDIA_LABEL = __( 'Choose Image', 'jetpack' );

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

	const [ mediaDetails ] = useMediaDetails( imageId );

	const onCustomImageChange = useCallback(
		media => {
			setImageId( media?.id );
		},
		[ setImageId ]
	);

	const ImageOptions = () => {
		return (
			<>
				<SelectControl
					label={ __( 'Image Type', 'jetpack' ) }
					value={ imageType || 'featured' }
					options={ [
						{
							label: __( 'Featured Image', 'jetpack' ),
							value: 'featured',
						},
						{ label: __( 'Custom Image', 'jetpack' ), value: 'custom' },
						{ label: __( 'No Image', 'jetpack' ), value: 'none' },
					] }
					onChange={ setImageType }
				/>

				{ imageType === 'custom' && (
					<MediaPicker
						buttonLabel={ ADD_MEDIA_LABEL }
						subTitle={ __( 'Add a custom image', 'jetpack' ) }
						mediaId={ imageId }
						mediaDetails={ mediaDetails }
						onChange={ onCustomImageChange }
						allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
					/>
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
						value={ customText || '' }
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

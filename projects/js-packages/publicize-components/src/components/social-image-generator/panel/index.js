import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	TextControl,
	SelectControl,
	Button,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
// import { useSelect, useDispatch } from '@wordpress/data';
// import { store as editorStore } from '@wordpress/editor';

// Dummy
const template = {
	image: true,
};

const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];

const SocialImageGeneratorPanel = ( {
	prePublish = false,
	customText = '',
	imageType = 'custom-image',
	customImage,
} ) => {
	const PanelWrapper = prePublish ? Fragment : PanelBody;
	const wrapperProps = prePublish ? {} : { title: __( 'Social Image Generator', 'jetpack' ) };
	const [ isDisabled, setIsDisabled ] = useState( false ); // use meta

	const renderMedia = useCallback(
		open => {
			return (
				<>
					{ customImage && (
						<img
							src={ customImage.media_details?.sizes?.large?.source_url || customImage.source_url }
							onClick={ open }
						/>
					) }
					<div>
						<Button isPrimary onClick={ open }>
							{ customImage
								? __( 'Replace Custom Image', 'jetpack' )
								: __( 'Choose Custom Image', 'jetpack' ) }
						</Button>
						{ customImage && (
							<Button isLink isDestructive onClick={ null }>
								{ __( 'Remove Custom Image', 'jetpack' ) }
							</Button>
						) }
					</div>
				</>
			);
		},
		[ customImage ]
	);

	const TemplateImageOptions = () => {
		if ( ! template.image ) {
			return;
		}

		return (
			<>
				<SelectControl
					label={ __( 'Image Type', 'jetpack' ) }
					value={ imageType }
					options={ [
						{
							label: __( 'Featured Image', 'jetpack' ),
							value: 'featured-image',
						},
						{ label: __( 'Custom Image', 'jetpack' ), value: 'custom-image' },
						{ label: __( 'Default Image', 'jetpack' ), value: 'default-image' },
						{ label: __( 'No Image', 'jetpack' ), value: 'no-image' },
					] }
					// onChange={ type => {
					// 	imageType = type;
					// } }
					help={
						imageType === 'default-image'
							? __( 'You can change the default image by clicking the Edit link below.', 'jetpack' )
							: null
					}
				/>

				{ imageType === 'custom-image' && (
					<div className="sig-sidebar__custom-image">
						<MediaUploadCheck>
							<MediaUpload
								// onSelect={ media => {
								// 	setCustomImage( media.id );
								// } }
								allowedTypes={ ALLOWED_MEDIA_TYPES }
								render={ renderMedia }
							/>
						</MediaUploadCheck>
					</div>
				) }
				<hr />
			</>
		);
	};

	return (
		<PanelWrapper { ...wrapperProps }>
			<ToggleControl
				label={ __( 'Disable Social Image', 'jetpack' ) }
				help={ isDisabled ? __( 'Social Image is disabled for this post.', 'jetpack' ) : '' }
				checked={ isDisabled }
				onChange={ setIsDisabled } // use meta
			/>
			{ ! isDisabled && (
				<>
					<TextControl
						value={ customText }
						// onChange={  }
						label={ __( 'Custom Text', 'jetpack' ) }
						help={ __(
							'By default the post title is used for the image. You can use this field to set your own text.',
							'jetpack'
						) }
					/>
					<hr />
					<TemplateImageOptions />
				</>
			) }
		</PanelWrapper>
	);
};

export default SocialImageGeneratorPanel;

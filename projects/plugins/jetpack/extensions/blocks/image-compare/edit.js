import { InspectorControls, RichText, useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { useLayoutEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { photonizedImgProps } from '../tiled-gallery/utils';
import ImageCompareControls from './controls';
import ImgUpload from './img-upload';
import useDebounce from './use-debounce';
import './editor.scss';
import './view.js';

/* global juxtapose */

const Edit = ( { attributes, clientId, isSelected, setAttributes } ) => {
	const { align, imageBefore, imageAfter, caption, orientation } = attributes;

	const blockProps = useBlockProps();
	const juxtaposeRef = useRef( undefined );
	const [ containerWidth, setContainerWidth ] = useState( 0 );

	// Let's look for resize so we can trigger the thing.
	const setElement = useResizeObserver(
		resizeObserverEntries => {
			const width = resizeObserverEntries[ 0 ]?.contentRect.width;
			if ( width ) {
				setContainerWidth( width );
			}
		},
		{ box: 'border-box' }
	);

	useDebounce(
		sz => {
			if ( sz > 0 ) {
				if ( typeof juxtapose !== 'undefined' && juxtapose.sliders ) {
					// only update for *this* slide
					juxtapose.sliders.forEach( elem => {
						const parentElem = elem.wrapper.parentElement;
						if ( parentElem.id === clientId ) {
							elem.optimizeWrapper( sz );
						}
					} );
				}
			}
		},
		200,
		containerWidth
	);

	// Initial state if attributes already set or not.
	// If both images are set, add juxtapose class, which is picked up by the library.
	const isComplete = imageBefore && imageBefore.url && imageAfter && imageAfter.url;
	const classes = isComplete ? 'image-compare__comparison juxtapose' : 'image-compare__placeholder';

	// Watching for changes to key variables to trigger scan.
	useLayoutEffect( () => {
		if ( imageBefore.url && imageAfter.url && typeof juxtapose !== 'undefined' ) {
			if ( juxtaposeRef.current ) {
				setElement( juxtaposeRef.current );
				juxtapose.makeSlider( juxtaposeRef?.current );
			}
		}
	}, [ align, imageBefore, imageAfter, orientation, setElement ] );

	return (
		<figure { ...blockProps } id={ clientId }>
			<InspectorControls key="controls">
				<ImageCompareControls { ...{ attributes, setAttributes } } />
			</InspectorControls>
			<div ref={ juxtaposeRef } className={ classes } data-mode={ orientation || 'horizontal' }>
				<Placeholder label={ null }>
					<div className="image-compare__image-before">
						<ImgUpload
							image={ {
								id: imageBefore.id,
								url: imageBefore.url,
								alt: imageBefore.alt,
							} }
							placeHolderLabel={ __( 'Image before', 'jetpack' ) }
							onChange={ img => {
								if ( img.media_type === 'image' || img.type === 'image' ) {
									const { src } = photonizedImgProps( img );
									const { alt, id, media_details } = img;
									const width = media_details?.width ?? img.width;
									const height = media_details?.height ?? img.height;

									setAttributes( {
										imageBefore: {
											id,
											url: src ? src : img.url,
											alt,
											width,
											height,
										},
									} );
								}
							} }
						/>
					</div>
					<div className="image-compare__image-after">
						<ImgUpload
							image={ {
								id: imageAfter.id,
								url: imageAfter.url,
								alt: imageAfter.alt,
							} }
							placeHolderLabel={ __( 'Image after', 'jetpack' ) }
							onChange={ img => {
								if ( img.media_type === 'image' || img.type === 'image' ) {
									const { src } = photonizedImgProps( img );
									const { alt, id, media_details } = img;
									const width = media_details?.width ?? img.width;
									const height = media_details?.height ?? img.height;

									setAttributes( {
										imageAfter: {
											id,
											url: src ? src : img.url,
											alt,
											width,
											height,
										},
									} );
								}
							} }
						/>
					</div>
				</Placeholder>
			</div>
			{ ( ! RichText.isEmpty( caption ) ||
				( isSelected && imageBefore.url && imageAfter.url ) ) && (
				<RichText
					tagName="figcaption"
					placeholder={ __( 'Write caption', 'jetpack' ) }
					value={ caption }
					onChange={ value => setAttributes( { caption: value } ) }
					inlineToolbar
				/>
			) }
		</figure>
	);
};

export default Edit;

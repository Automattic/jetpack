/**
 * External dependencies
 */
import { InnerBlocks, InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, Placeholder, RadioControl } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { useLayoutEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ImgUpload from './img-upload';
import useDebounce from './use-debounce';
import './editor.scss';
import './view.js';

/* global juxtapose */

const Edit = ( { attributes, className, clientId, isSelected, setAttributes } ) => {
	const {
		imageBeforeId,
		imageBeforeUrl,
		imageBeforeAlt,
		imageAfterId,
		imageAfterUrl,
		imageAfterAlt,
		caption,
		orientation,
	} = attributes;

	// Check for useResizeObserver, not available in older Gutenberg.
	let resizeListener = null;
	let sizes = null;
	if ( useResizeObserver ) {
		// Let's look for resize so we can trigger the thing.
		[ resizeListener, sizes ] = useResizeObserver();

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
			sizes.width
		);
	}

	// Initial state if attributes already set or not.
	// If both images are set, add juxtaspose class, which is picked up by the library.
	const isComplete = imageBeforeUrl && imageAfterUrl;
	const classes = isComplete ? 'image-compare__comparison juxtapose' : 'image-compare__placeholder';

	// Watching for changes to key variables to trigger scan.
	useLayoutEffect( () => {
		if ( imageBeforeUrl && imageAfterUrl && typeof juxtapose !== 'undefined' ) {
			juxtapose.scanPage();
		}
	}, [ imageBeforeUrl, imageAfterUrl, orientation ] );

	return (
		<figure className={ className } id={ clientId }>
			{ resizeListener }
			<InspectorControls key="controls">
				<PanelBody title={ __( 'Orientation', 'jetpack' ) }>
					<RadioControl
						selected={ orientation || 'horizontal' }
						options={ [
							{ label: __( 'Side by side', 'jetpack' ), value: 'horizontal' },
							{ label: __( 'Above and below', 'jetpack' ), value: 'vertical' },
						] }
						onChange={ value => {
							setAttributes( {
								orientation: value,
							} );
						} }
					/>
				</PanelBody>
			</InspectorControls>
			<div className={ classes } data-mode={ orientation || 'horizontal' }>
				<Placeholder label={ null }>
					<div className="image-compare__image-before">
						<ImgUpload
							image={ {
								id: imageBeforeId,
								url: imageBeforeUrl,
								alt: imageBeforeAlt,
							} }
							placeHolderLabel={ __( 'Image before', 'jetpack' ) }
							onChange={ img => {
								if ( img.media_type === 'image' || img.type === 'image' ) {
									setAttributes( {
										imageBeforeId: img.id,
										imageBeforeUrl: img.url,
										imageBeforeAlt: img.alt,
									} );
								}
							} }
						/>
					</div>
					<div className="image-compare__image-after">
						<ImgUpload
							image={ {
								id: imageAfterId,
								url: imageAfterUrl,
								alt: imageAfterAlt,
							} }
							placeHolderLabel={ __( 'Image after', 'jetpack' ) }
							onChange={ img => {
								if ( img.media_type === 'image' || img.type === 'image' ) {
									setAttributes( {
										imageAfterId: img.id,
										imageAfterUrl: img.url,
										imageAfterAlt: img.alt,
									} );
								}
							} }
						/>
					</div>
				</Placeholder>
			</div>
			{ ( ! RichText.isEmpty( caption ) || ( isSelected && imageBeforeUrl && imageAfterUrl ) ) && (
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

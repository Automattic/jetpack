/**
 * WordPress dependencies
 */
import { InspectorControls, MediaPlaceholder, RichText } from '@wordpress/block-editor';
import { PanelBody, RadioControl, Placeholder } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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

	// If both images are set, add juxtaspose class, which is picked up by the library.
	const classes =
		imageBeforeUrl && imageAfterUrl
			? 'image-compare__comparison juxtapose'
			: 'image-compare__placeholder';

	// Check for defined, not necessary available in older Gutenberg.
	let resizeListener = null;
	let sizes = null;
	if ( useResizeObserver ) {
		// Let's look for resize so we can trigger the thing
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

	const [ errorMessage, setErrorMessage ] = useState( null );

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

							// Set a delay so markup can be updated before scan page gets triggered.
							setTimeout( function() {
								juxtapose.scanPage();
							}, 100 );
						} }
					/>
				</PanelBody>
			</InspectorControls>
			<div className={ classes } data-mode={ orientation }>
				<Placeholder>
					<div className="image-compare__image-before">
						{ imageBeforeUrl ? (
							<img id={ imageBeforeId } src={ imageBeforeUrl } alt={ imageBeforeAlt } />
						) : (
							<>
								<div className="components-placeholder__label">
									{ __( 'Image Before', 'jetpack' ) }
								</div>
								<MediaPlaceholder
									onError={ err => {
										setErrorMessage( `Error uploading: ${ err[ 2 ] }` );
									} }
									onSelect={ el => {
										setAttributes( {
											imageBeforeId: el.id,
											imageBeforeUrl: el.url,
											imageBeforeAlt: el.alt,
										} );
										juxtapose.scanPage();
									} }
									accept="image/*"
									allowedTypes={ [ 'image' ] }
									labels={ { title: __( 'First image to compare', 'jetpack' ) } }
								/>
							</>
						) }
					</div>
					<div className="image-compare__image-after">
						{ imageAfterUrl ? (
							<img id={ imageAfterId } src={ imageAfterUrl } alt={ imageAfterAlt } />
						) : (
							<>
								<div className="components-placeholder__label">
									{ __( 'Image After', 'jetpack' ) }
								</div>
								<MediaPlaceholder
									onError={ err => {
										setErrorMessage( `Error uploading: ${ err[ 2 ] }` );
									} }
									onSelect={ el => {
										setAttributes( {
											imageAfterId: el.id,
											imageAfterUrl: el.url,
											imageAfterAlt: el.alt,
										} );
										juxtapose.scanPage();
									} }
									accept="image/*"
									allowedTypes={ [ 'image' ] }
									labels={ { title: __( 'Second image to compare', 'jetpack' ) } }
								/>
							</>
						) }
					</div>
				</Placeholder>
				{ errorMessage && <div className="image-compare__error">{ errorMessage }</div> }
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

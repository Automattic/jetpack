/**
 * WordPress dependencies
 */
import { InnerBlocks, InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, RadioControl } from '@wordpress/components';
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

	const TEMPLATE = [
		[
			'core/image',
			{
				className: 'image-compare__image-before',
			},
		],
		[
			'core/image',
			{
				className: 'image-compare__image-after',
			},
		],
	];

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
	const isInitiallyComplete = imageBeforeUrl && imageAfterUrl;
	const [ isComplete, setComplete ] = useState( isInitiallyComplete );

	// If both images are set, add juxtaspose class, which is picked up by the library.
	const classes = isComplete ? 'image-compare__comparison juxtapose' : 'image-compare__placeholder';

	// Function called when InnerBlocks change to set the attributes of the two
	// images and call the juxtapose library to do its magic.
	const blocksChanged = ibs => {
		// Set attributes for image one, from InnerBlock[0].
		if ( ibs[ 0 ] && ibs[ 0 ].attributes.id ) {
			setAttributes( {
				imageBeforeId: ibs[ 0 ].attributes.id,
				imageBeforeUrl: ibs[ 0 ].attributes.url,
				imageBeforeAlt: ibs[ 0 ].attributes.alt,
			} );
		}

		// Set attributes for image two, from InnerBlock[1].
		if ( ibs[ 1 ] && ibs[ 1 ].attributes.id ) {
			setAttributes( {
				imageAfterId: ibs[ 1 ].attributes.id,
				imageAfterUrl: ibs[ 1 ].attributes.url,
				imageAfterAlt: ibs[ 1 ].attributes.alt,
			} );
		}

		// If both Innerblocks are set, then trigger juxtapose library.
		if ( ibs[ 0 ] && ibs[ 0 ].attributes.id && ibs[ 1 ] && ibs[ 1 ].attributes.id ) {
			setComplete( true );
			// Delay to let markup update before the scan page gets triggered.
			setTimeout( function() {
				juxtapose.scanPage();
			}, 100 );
		}
	};

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

							// Delay to let markup update before the scan page gets triggered.
							setTimeout( function() {
								juxtapose.scanPage();
							}, 100 );
						} }
					/>
				</PanelBody>
			</InspectorControls>
			<div className={ classes } data-mode={ orientation || 'horizontal' }>
				{ ! isComplete ? (
					<InnerBlocks onChange={ blocksChanged } template={ TEMPLATE } templateLock="all" />
				) : (
					<>
						<div className="image-compare__image-before">
							<img id={ imageBeforeId } src={ imageBeforeUrl } alt={ imageBeforeAlt } />
						</div>
						<div className="image-compare__image-after">
							<img id={ imageAfterId } src={ imageAfterUrl } alt={ imageAfterAlt } />
						</div>
					</>
				) }
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

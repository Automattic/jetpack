import { MediaUpload } from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
	ToolbarGroup,
	ToolbarItem,
	TextControl,
} from '@wordpress/components';
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';
import { isEmpty } from 'lodash';

export function PanelControls( {
	attributes: { autoplay, delay, effect, images, sizeSlug },
	imageSizeOptions,
	onChangeImageSize,
	setAttributes,
	selectedImageIndex,
	setImageAttributes,
} ) {
	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

	const effectOptions = [
		{ label: _x( 'Slide', 'Slideshow transition effect', 'jetpack' ), value: 'slide' },
		{ label: _x( 'Fade', 'Slideshow transition effect', 'jetpack' ), value: 'fade' },
	];

	const [ linkValue, setLinkValue ] = useState( '' );
	const [ linkError, setLinkError ] = useState( '' );

	useEffect( () => {
		setLinkError( '' );
		if ( selectedImageIndex !== null && images[ selectedImageIndex ] ) {
			const currentImage = images[ selectedImageIndex ];

			// Only show link if it's a custom one
			setLinkValue( currentImage.hasCustomLink ? currentImage.link || '' : '' );
		} else {
			setLinkValue( '' );
		}
	}, [ selectedImageIndex, images ] );

	const handleSaveLink = () => {
		if ( selectedImageIndex !== null ) {
			if ( linkValue && ! isURL( linkValue ) ) {
				setLinkError( __( 'Please enter a valid URL', 'jetpack' ) );
				return;
			}

			setLinkError( '' );

			setImageAttributes( selectedImageIndex, {
				link: linkValue,
				hasCustomLink: linkValue ? true : false, // Add this flag
			} );
		}
	};

	return (
		<Fragment>
			<PanelBody title={ __( 'Autoplay', 'jetpack' ) }>
				<ToggleControl
					__nextHasNoMarginBottom={ true }
					label={ __( 'Autoplay', 'jetpack' ) }
					help={ __( 'Autoplay between slides', 'jetpack' ) }
					checked={ autoplay }
					onChange={ value => {
						setAttributes( { autoplay: value } );
					} }
				/>
				{ autoplay && (
					<RangeControl
						__nextHasNoMarginBottom={ true }
						label={ __( 'Delay between transitions (in seconds)', 'jetpack' ) }
						value={ delay }
						onChange={ value => {
							setAttributes( { delay: value } );
						} }
						min={ 1 }
						max={ 5 }
					/>
				) }
				{ autoplay && prefersReducedMotion && (
					<span>
						{ __(
							'The Reduce Motion accessibility option is selected, therefore autoplay will be disabled in this browser.',
							'jetpack'
						) }
					</span>
				) }
			</PanelBody>
			<PanelBody title={ __( 'Effects', 'jetpack' ) }>
				<SelectControl
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize
					label={ __( 'Transition', 'jetpack' ) }
					value={ effect }
					onChange={ value => {
						setAttributes( { effect: value } );
					} }
					options={ effectOptions }
				/>
			</PanelBody>
			{ ! isEmpty( images ) && ! isEmpty( imageSizeOptions ) && (
				<PanelBody title={ __( 'Image Settings', 'jetpack' ) }>
					<SelectControl
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize
						label={ __( 'Size', 'jetpack' ) }
						value={ sizeSlug }
						options={ imageSizeOptions }
						onChange={ size => onChangeImageSize( size ) }
					/>
				</PanelBody>
			) }
			{
				<PanelBody title={ __( 'Link Settings', 'jetpack' ) }>
					<TextControl
						label={ __( 'Image Link URL', 'jetpack' ) }
						value={ linkValue }
						onChange={ setLinkValue }
						placeholder={ __( 'Enter URL', 'jetpack' ) }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
					{ linkError && <div className="jetpack-slideshow-url-notice">{ linkError }</div> }
					<Button variant="secondary" onClick={ handleSaveLink }>
						{ __( 'Save Link', 'jetpack' ) }
					</Button>
				</PanelBody>
			}
		</Fragment>
	);
}

export function ToolbarControls( { allowedMediaTypes, attributes: { images }, onSelectImages } ) {
	return (
		<Fragment>
			{ !! images.length && (
				<ToolbarGroup>
					<ToolbarItem>
						{ () => (
							<MediaUpload
								onSelect={ onSelectImages }
								allowedTypes={ allowedMediaTypes }
								multiple
								gallery
								value={ images.map( img => img.id ) }
								render={ ( { open } ) => (
									<Button label={ __( 'Edit Slideshow', 'jetpack' ) } onClick={ open }>
										{ __( 'Edit', 'jetpack' ) }
									</Button>
								) }
							/>
						) }
					</ToolbarItem>
				</ToolbarGroup>
			) }
		</Fragment>
	);
}

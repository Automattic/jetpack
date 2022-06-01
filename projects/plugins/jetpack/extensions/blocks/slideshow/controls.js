import { MediaUpload } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { isEmpty } from 'lodash';
import EditButton from '../../shared/edit-button';

export function PanelControls( {
	attributes: { autoplay, delay, effect, images, sizeSlug },
	imageSizeOptions,
	onChangeImageSize,
	setAttributes,
} ) {
	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

	const effectOptions = [
		{ label: _x( 'Slide', 'Slideshow transition effect', 'jetpack' ), value: 'slide' },
		{ label: _x( 'Fade', 'Slideshow transition effect', 'jetpack' ), value: 'fade' },
	];

	return (
		<Fragment>
			<PanelBody title={ __( 'Autoplay', 'jetpack' ) }>
				<ToggleControl
					label={ __( 'Autoplay', 'jetpack' ) }
					help={ __( 'Autoplay between slides', 'jetpack' ) }
					checked={ autoplay }
					onChange={ value => {
						setAttributes( { autoplay: value } );
					} }
				/>
				{ autoplay && (
					<RangeControl
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
					label={ __( 'Transition effect', 'jetpack' ) }
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
						label={ __( 'Image Size', 'jetpack' ) }
						value={ sizeSlug }
						options={ imageSizeOptions }
						onChange={ size => onChangeImageSize( size ) }
					/>
				</PanelBody>
			) }
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
									<EditButton label={ __( 'Edit Slideshow', 'jetpack' ) } onClick={ open } />
								) }
							/>
						) }
					</ToolbarItem>
				</ToolbarGroup>
			) }
		</Fragment>
	);
}

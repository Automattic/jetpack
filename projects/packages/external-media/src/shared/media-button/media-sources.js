import { MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import React from 'react';
import {
	internalMediaSources,
	externalMediaSources,
	featuredImageExclusiveMediaSources,
	generalPurposeImageExclusiveMediaSources,
} from '../sources';
import { isGeneralPurposeImageGeneratorBetaEnabled } from '../utils/is-general-purpose-image-generator-beta-enabled';

/**
 * MediaSources component
 * @param {object}   props                - The component properties.
 * @param {Function} props.originalButton - The function to render original button.
 * @param {Function} props.onClick        - To handle the click event.
 * @param {Function} props.open           - To handle the open.
 * @param {Function} props.setSource      - To set the source.
 * @param {boolean}  props.isFeatured     - Whether it's featured.
 * @return {React.ReactElement} The `MediaSources` component.
 */
function MediaSources( {
	originalButton = null,
	onClick = () => {},
	open,
	setSource,
	isFeatured = false,
} ) {
	return (
		<Fragment>
			{ originalButton && originalButton( { open } ) }
			{ internalMediaSources.map( ( { icon, id, label } ) => (
				<MenuItem
					icon={ icon }
					key={ id }
					onClick={ () => {
						onClick();
						setSource( id );
					} }
				>
					{ label }
				</MenuItem>
			) ) }

			{ isFeatured &&
				featuredImageExclusiveMediaSources.map( ( { icon, id, label } ) => (
					<MenuItem
						icon={ icon }
						key={ id }
						onClick={ () => {
							onClick();
							setSource( id );
						} }
					>
						{ label }
					</MenuItem>
				) ) }

			{ ! isFeatured &&
				isGeneralPurposeImageGeneratorBetaEnabled() &&
				generalPurposeImageExclusiveMediaSources.map( ( { icon, id, label } ) => (
					<MenuItem
						icon={ icon }
						key={ id }
						onClick={ () => {
							onClick();
							setSource( id );
						} }
					>
						{ label }
					</MenuItem>
				) ) }

			<hr style={ { marginLeft: '-8px', marginRight: '-8px' } } />

			{ externalMediaSources.map( ( { icon, id, label } ) => (
				<MenuItem
					icon={ icon }
					key={ id }
					onClick={ () => {
						onClick();
						setSource( id );
					} }
				>
					{ label }
				</MenuItem>
			) ) }
		</Fragment>
	);
}

export default MediaSources;

import { MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import {
	internalMediaSources,
	externalMediaSources,
	featuredImageExclusiveMediaSources,
	generalPurposeImageExclusiveMediaSources,
} from '../sources';

/**
 * Temporary feature flag to control generalPurposeImageExclusiveMediaSources
 * visibility.
 */
const GENERAL_PURPOSE_IMAGE_GENERATOR_BETA_FLAG = 'ai-general-purpose-image-generator';
const isGeneralPurposeImageGeneratorBetaEnabled =
	window?.Jetpack_Editor_Initial_State?.available_blocks?.[
		GENERAL_PURPOSE_IMAGE_GENERATOR_BETA_FLAG
	]?.available === true;

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
				isGeneralPurposeImageGeneratorBetaEnabled &&
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

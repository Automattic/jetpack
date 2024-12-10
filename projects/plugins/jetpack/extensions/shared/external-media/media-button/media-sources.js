/*
 * External dependencies
 */
import { useAiModule } from '@automattic/jetpack-ai-client';
import { MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
/*
 * Internal dependencies
 */
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
	const { isAiModuleActive } = useAiModule();

	return (
		<Fragment>
			{ originalButton && originalButton( { open } ) }
			{ internalMediaSources
				.filter( source => ! source.requiresAiModule || isAiModuleActive )
				.map( ( { icon, id, label } ) => (
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
				featuredImageExclusiveMediaSources
					.filter( source => ! source.requiresAiModule || isAiModuleActive )
					.map( ( { icon, id, label } ) => (
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
				generalPurposeImageExclusiveMediaSources
					.filter( source => ! source.requiresAiModule || isAiModuleActive )
					.map( ( { icon, id, label } ) => (
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

			{ externalMediaSources
				.filter( source => ! source.requiresAiModule || isAiModuleActive )
				.map( ( { icon, id, label } ) => (
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

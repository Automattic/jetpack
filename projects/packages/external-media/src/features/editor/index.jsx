import { isUserConnected } from '@automattic/jetpack-shared-extension-utils';
import { useBlockEditContext } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import {
	addPexelsToMediaInserter,
	addGooglePhotosToMediaInserter,
	ALLOWED_BLOCKS,
	externalMediaSources,
	getExternalLibrary,
	MediaButton,
	MediaSources,
	mediaSources,
} from '../../shared';
import './editor.scss';

/**
 * Insert external media blocks
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @return {object} - The inserted block settings.
 */
function insertExternalMediaBlocks( settings, name ) {
	if ( name !== 'core/image' ) {
		return settings;
	}

	return {
		...settings,
		keywords: [ ...settings.keywords, ...mediaSources.map( source => source.keyword ) ],
	};
}

if ( isUserConnected() && 'function' === typeof useBlockEditContext ) {
	addPexelsToMediaInserter();
	addGooglePhotosToMediaInserter();

	const isFeaturedImage = props =>
		props.unstableFeaturedImageFlow ||
		( props.modalClass && props.modalClass.indexOf( 'featured-image' ) > -1 );

	const isAllowedBlock = ( name, render ) => {
		const isInAllowedList = ALLOWED_BLOCKS.indexOf( name ) > -1;
		const isNotCoBlocks = render ? render.toString().indexOf( 'coblocks' ) === -1 : true;
		return isInAllowedList && isNotCoBlocks;
	};

	// Register the new 'browse media' button.
	addFilter(
		'editor.MediaUpload',
		'external-media/replace-media-upload',
		OriginalComponent => props => {
			const { name } = useBlockEditContext();
			let { render } = props;

			if (
				( props?.mode === 'browse' && isAllowedBlock( name, render ) ) ||
				isFeaturedImage( props )
			) {
				const { allowedTypes, gallery = false, value = [] } = props;

				// Only replace button for components that expect images, except existing galleries.
				if ( allowedTypes.indexOf( 'image' ) > -1 && ! ( gallery && value.length > 0 ) ) {
					render = button => <MediaButton { ...button } mediaProps={ props } />;
				}
			}

			return <OriginalComponent { ...props } render={ render } />;
		},
		100
	);

	// Register the individual external media blocks.
	addFilter(
		'blocks.registerBlockType',
		'external-media/individual-blocks',
		insertExternalMediaBlocks
	);

	// Add external media sources to MediaReplaceFlow dropdown.
	addFilter(
		'editor.MediaReplaceFlow',
		'external-media/add-external-sources',
		OriginalComponent => {
			return props => {
				const { name } = useBlockEditContext();
				const [ selectedSource, setSelectedSource ] = useState( null );

				// Only add external media sources for allowed blocks
				if ( ! isAllowedBlock( name ) ) {
					return <OriginalComponent { ...props } />;
				}

				const ExternalLibrary = selectedSource ? getExternalLibrary( selectedSource ) : null;
				const externalSource = selectedSource
					? externalMediaSources.find( s => s.id === selectedSource )
					: null;

				return (
					<>
						<OriginalComponent { ...props }>
							{ ( { onClose } ) => (
								<>
									<MediaSources
										mediaProps={ props }
										onClick={ onClose }
										setSource={ setSelectedSource }
									/>
									{ typeof props.children === 'function' && props.children( { onClose } ) }
								</>
							) }
						</OriginalComponent>

						{ ExternalLibrary && (
							<ExternalLibrary
								onSelect={ props.onSelect }
								onClose={ () => setSelectedSource( null ) }
								allowedTypes={ props.allowedTypes }
								multiple={ props.multiple }
								addToGallery={ props.addToGallery }
								value={ props.mediaIds }
								externalSource={ externalSource }
							/>
						) }
					</>
				);
			};
		}
	);
}

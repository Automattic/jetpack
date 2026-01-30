import { isWoASite } from '@automattic/jetpack-script-data';
import { isPrivateSite } from '@automattic/jetpack-shared-extension-utils';
import {
	Button,
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { image as imageIcon } from '@wordpress/icons';
import photon from 'photon';
import './style.scss';

/**
 * Returns a Photon-optimized image URL or the original URL if Photon should not be used.
 * @param url - The image URL to process.
 * @return A Photon-optimized image URL, the original URL if Photon is skipped, or null if the input is empty.
 */
function photonSafeUrl( url: string = '' ): string | null {
	if ( ! url ) {
		return null;
	}
	// Do not Photonize images that are still uploading, are from localhost, or are private + atomic
	if (
		url.startsWith( 'blob:' ) ||
		/^https?:\/\/localhost/.test( url ) ||
		/^https?:\/\/.*\.local\//.test( url ) ||
		( isWoASite() && isPrivateSite() )
	) {
		return url;
	}

	return photon( url.split( '?', 1 )[ 0 ], { width: 120, height: 120 } );
}

const FieldImageSelect = ( { choices, handleFilePreview } ) => {
	return (
		<>
			{ ( choices?.length ?? 0 ) === 0 && '-' }
			{ ( choices?.length ?? 0 ) > 0 && (
				<VStack spacing="1">
					{ choices.map( choice => {
						const label = choice.label
							? `${ choice.selected }: ${ choice.label }`
							: choice.selected;
						const hasImage = choice.image?.src;
						return (
							<Button
								__next40pxDefaultSize
								key={ choice.selected }
								variant="tertiary"
								onClick={
									hasImage
										? handleFilePreview( {
												file_id: choice.image.id,
												name: label,
												url: choice.image.src,
										  } )
										: undefined
								}
								className="jp-forms__image-select-field-button"
								icon={
									hasImage ? (
										<img
											alt={ choice.selected }
											loading="lazy"
											src={ photonSafeUrl( choice.image.src ) }
											style={ { objectFit: 'cover' } }
										/>
									) : (
										imageIcon
									)
								}
								iconSize={ 60 }
							>
								{ label }
							</Button>
						);
					} ) }
				</VStack>
			) }
		</>
	);
};

export default FieldImageSelect;

import { isWoASite } from '@automattic/jetpack-script-data';
import { isPrivateSite } from '@automattic/jetpack-shared-extension-utils/site-type-utils';
import {
	Icon,
	Card,
	CardMedia,
	CardBody,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
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

	return photon( url.split( '?', 1 )[ 0 ], { width: 138, height: 144 } );
}

const ImageSelectButton = ( { choice, handleFilePreview } ) => {
	const label = choice.label ? `${ choice.selected }: ${ choice.label }` : choice.selected;
	const hasImage = choice.image?.src;
	return (
		<Card
			onClick={
				hasImage
					? handleFilePreview( {
							file_id: choice.image.id,
							name: label,
							url: choice.image.src,
					  } )
					: undefined
			}
			className={ `jp-forms__image-select-preview ${ hasImage ? 'has-image' : '' }` }
		>
			<CardMedia>
				<div className="jp-forms__image-select-preview-image-wrapper">
					{ hasImage ? (
						<img
							className="jp-forms__image-select-preview-image"
							width={ 138 }
							height={ 144 }
							alt={ choice.selected }
							loading="lazy"
							src={ photonSafeUrl( choice.image.src ) ?? undefined }
						/>
					) : (
						<Icon icon={ imageIcon } size={ 144 } />
					) }
				</div>
			</CardMedia>
			<CardBody
				size={ {
					blockStart: 'none',
					blockEnd: 'xSmall',
					inlineStart: 'xSmall',
					inlineEnd: 'xSmall',
				} }
			>
				<HStack
					className="jp-forms__image-select-preview-label-wrapper"
					spacing="2"
					alignment="topLeft"
				>
					<Text className="jp-forms__image-select-preview-selected">{ choice.selected }</Text>
					<Text title={ choice.label } className="jp-forms__image-select-preview-label">
						{ choice.label }
					</Text>
				</HStack>
			</CardBody>
		</Card>
	);
};

const FieldImageSelect = ( { choices, handleFilePreview } ) => {
	return (
		<>
			{ ( choices?.length ?? 0 ) === 0 && '-' }
			{ ( choices?.length ?? 0 ) > 0 && (
				<HStack
					spacing="2"
					alignment="topLeft"
					wrap={ true }
					className="jp-forms__image-select-preview-wrapper"
				>
					{ choices.map( choice => {
						return (
							<ImageSelectButton
								key={ choice.selected }
								choice={ choice }
								handleFilePreview={ handleFilePreview }
							/>
						);
					} ) }
				</HStack>
			) }
		</>
	);
};

export default FieldImageSelect;

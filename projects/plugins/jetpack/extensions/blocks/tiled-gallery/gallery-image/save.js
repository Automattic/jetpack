import { isBlobURL } from '@wordpress/blob';
import clsx from 'clsx';

export default function GalleryImageSave( props ) {
	const {
		'aria-label': ariaLabel,
		alt,
		imageFilter,
		height,
		id,
		link,
		linkTo,
		customLink,
		origUrl,
		url,
		width,
	} = props;

	if ( isBlobURL( origUrl ) ) {
		return null;
	}

	let href;

	switch ( linkTo ) {
		case 'media':
			href = origUrl;
			break;
		case 'attachment':
			href = link;
			break;
		case 'custom':
			href = customLink || '';
			break;
		default:
			href = '';
	}

	const img = (
		// Disable reason: Image itself is not meant to be interactive, but should
		// be accessible (allowing keyboard navigation to the next image in the gallery).
		/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
		<img
			alt={ alt }
			data-height={ height }
			data-id={ id }
			data-link={ link }
			data-url={ origUrl }
			data-custom-link={ customLink }
			data-width={ width }
			src={ url }
			data-amp-layout={ 'responsive' }
			tabIndex={ 0 }
			role={ 'button' }
			aria-label={ ariaLabel }
		/>
		/* eslint-enable jsx-a11y/no-noninteractive-element-to-interactive-role */
	);

	return (
		<figure
			className={ clsx( 'tiled-gallery__item', {
				[ `filter__${ imageFilter }` ]: !! imageFilter,
			} ) }
		>
			{ href ? <a href={ href }>{ img }</a> : img }
		</figure>
	);
}

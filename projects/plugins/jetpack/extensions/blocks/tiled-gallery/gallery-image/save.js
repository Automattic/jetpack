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
	}

	const img = (
		// Disable reason: Image itself is not meant to be interactive, but should
		// be accessible (allowing keyboard navigation to the next image in the gallery).
		/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-noninteractive-tabindex */
		<img
			alt={ alt }
			data-height={ height }
			data-id={ id }
			data-link={ link }
			data-url={ origUrl }
			data-width={ width }
			src={ url }
			data-amp-layout={ 'responsive' }
			tabIndex={ 0 }
			role={ 'button' }
			aria-label={ ariaLabel }
		/>
		/* eslint-enable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-noninteractive-tabindex */
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

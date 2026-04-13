import { useCallback, useState } from 'react';
import { GlobeIcon } from './icons/globe-icon';

export type SiteIconWithFallbackProps = {
	alt?: string;
	src?: string;
	className?: string;
	fallback?: React.ReactNode;
};

/**
 * Renders a default site icon: a neutral grey circle with a globe glyph,
 * matching what Google's search results show for sites without a favicon.
 * The wrapping span adopts the caller's `className` so the size is inherited
 * from whatever rule the preview already has on that class.
 *
 * @param {Pick< SiteIconWithFallbackProps, 'className' >} props - The wrapper props.
 * @return The DefaultSiteIcon component.
 */
export function DefaultSiteIcon( { className }: Pick< SiteIconWithFallbackProps, 'className' > ) {
	return (
		<span
			className={ className }
			aria-hidden="true"
			style={ {
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#e8eaed',
				color: '#5f6368',
				borderRadius: '50%',
			} }
		>
			<GlobeIcon style={ { width: '60%', height: '60%' } } />
		</span>
	);
}

/**
 * Renders a site icon image with a fallback to a default globe icon if no URL
 * is provided or the URL fails to load.
 *
 * @param {SiteIconWithFallbackProps} props - The props for the SiteIconWithFallback component.
 *
 * @return The SiteIconWithFallback component.
 */
export function SiteIconWithFallback( {
	src: siteIconUrl,
	alt = '',
	className,
	fallback = <DefaultSiteIcon className={ className } />,
}: SiteIconWithFallbackProps ) {
	// Use state to track if the image URL has encountered an error
	const [ imageUrlWithError, setImageUrlWithError ] = useState( '' );

	const onError = useCallback< React.ReactEventHandler< HTMLImageElement > >( event => {
		setImageUrlWithError( ( event.target as HTMLImageElement ).src );
	}, [] );

	const showIcon =
		siteIconUrl &&
		// Check if the image URL with error is different from the provided site icon URL
		// to ensure that a change in siteIconUrl resets the error state
		imageUrlWithError !== siteIconUrl;

	return showIcon ? (
		<img src={ siteIconUrl } alt={ alt } onError={ onError } className={ className } />
	) : (
		fallback
	);
}

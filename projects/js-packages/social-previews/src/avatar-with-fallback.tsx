import { useCallback, useState } from 'react';

export type AvatarWithFallbackProps = {
	alt?: string;
	src?: string;
	className?: string;
	fallback?: React.ReactNode;
};

/**
 * Renders a default avatar SVG.
 *
 * @param {Pick< AvatarWithFallbackProps, 'className' >} props - The SVG props.
 * @return The DefaultAvatar component.
 */
export function DefaultAvatar( props: Pick< AvatarWithFallbackProps, 'className' > ) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 340 340"
			width="36"
			height="36"
			aria-hidden="true"
			{ ...props }
		>
			<path
				fill="#DDD"
				d="m169,.5a169,169 0 1,0 2,0zm0,86a76,76 0 1 1-2,0zM57,287q27-35 67-35h92q40,0 67,35a164,164 0 0,1-226,0"
			/>
		</svg>
	);
}

/**
 * Renders an avatar image with a fallback to a default avatar if no URL is provided or if the URL fails to load.
 *
 * @param {AvatarWithFallbackProps} props - The props for the AvatarWithFallback component.
 *
 * @return The AvatarWithFallback component.
 */
export function AvatarWithFallback( {
	src: avatarUrl,
	alt = '',
	className,
	fallback = <DefaultAvatar className={ className } />,
}: AvatarWithFallbackProps ) {
	// Use state to track if the image URL has encountered an error
	const [ imageUrlWithError, setImageUrlWithError ] = useState( '' );

	const onError = useCallback< React.ReactEventHandler< HTMLImageElement > >( event => {
		setImageUrlWithError( ( event.target as HTMLImageElement ).src );
	}, [] );

	const showAvatar =
		!! avatarUrl &&
		// Check if the image URL with error is different from the provided avatar URL
		// to ensure that a change in avatarUrl resets the error state
		imageUrlWithError !== avatarUrl;

	return showAvatar ? (
		<img src={ avatarUrl } alt={ alt } onError={ onError } className={ className } />
	) : (
		fallback
	);
}

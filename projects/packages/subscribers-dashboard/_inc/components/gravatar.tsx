import { Hovercards } from '@gravatar-com/hovercards';
import '@gravatar-com/hovercards/dist/style.css';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { sha256 } from 'js-sha256';

type Props = {
	defaultImage?:
		| 'blank'
		| 'color'
		| 'identicon'
		| 'initials'
		| 'monsterid'
		| 'mp'
		| 'retro'
		| 'robohash'
		| 'wavatar';
	displayName?: string;
	email: string;
	size?: number;
	className?: string;
	useHovercard?: boolean;
};

/**
 * Renders a Gravatar profile image with a Gravatar profile hovercard. Mirrors Forms'
 * `<Gravatar>` component — duplicated locally for now so we don't pull the Forms package
 * into Subscribers. Once the shared Gravatar component lands in `jetpack-components`
 * (or core / Gravatar — see https://github.com/WordPress/gutenberg/issues/76836), this
 * file should swap to that import and be deleted.
 *
 * @param props              - Component props.
 * @param props.email        - Email address to look up on Gravatar.
 * @param props.displayName  - Display name (used as alt text + hovercard label).
 * @param props.defaultImage - Fallback when the user has no Gravatar profile.
 * @param props.size         - Rendered avatar size in pixels.
 * @param props.className    - Optional class name forwarded to the `<img>`.
 * @param props.useHovercard - Whether to attach the hovercard.
 * @return Avatar `<img>`, or null when no email is available.
 */
export default function Gravatar( {
	defaultImage = 'initials',
	displayName,
	email,
	size = 48,
	className,
	useHovercard = true,
}: Props ): JSX.Element | null {
	const profileImageRef = useRef< HTMLImageElement | null >( null );
	const hovercardRef = useRef< Hovercards | null >( null );

	useEffect( () => {
		if ( ! useHovercard || ! profileImageRef.current ) {
			return;
		}
		hovercardRef.current = new Hovercards( {
			i18n: {
				'Edit your profile →': __( 'Edit your profile →', 'jetpack-subscribers-dashboard' ),
				'View profile →': __( 'View profile →', 'jetpack-subscribers-dashboard' ),
				Contact: __( 'Contact', 'jetpack-subscribers-dashboard' ),
				'Send money': __( 'Send money', 'jetpack-subscribers-dashboard' ),
				'Sorry, we are unable to load this Gravatar profile.': __(
					'Sorry, we are unable to load this Gravatar profile.',
					'jetpack-subscribers-dashboard'
				),
				'Gravatar not found.': __( 'Gravatar not found.', 'jetpack-subscribers-dashboard' ),
				'This profile is private.': __(
					'This profile is private.',
					'jetpack-subscribers-dashboard'
				),
				'Too Many Requests.': __( 'Too many requests.', 'jetpack-subscribers-dashboard' ),
				'Internal Server Error.': __( 'Internal server error.', 'jetpack-subscribers-dashboard' ),
				'Is this you?': __( 'Is this you?', 'jetpack-subscribers-dashboard' ),
				'Claim your free profile.': __(
					'Claim your free profile.',
					'jetpack-subscribers-dashboard'
				),
				Email: __( 'Email', 'jetpack-subscribers-dashboard' ),
				'Home Phone': __( 'Home phone', 'jetpack-subscribers-dashboard' ),
				'Work Phone': __( 'Work phone', 'jetpack-subscribers-dashboard' ),
				'Cell Phone': __( 'Cell phone', 'jetpack-subscribers-dashboard' ),
				'Contact Form': __( 'Contact form', 'jetpack-subscribers-dashboard' ),
				Calendar: __( 'Calendar', 'jetpack-subscribers-dashboard' ),
			},
		} );
		hovercardRef.current.attach( profileImageRef.current );
	}, [ useHovercard ] );

	if ( ! email ) {
		return null;
	}

	const hashedEmail = sha256( email );
	const hovercardName = displayName ? `&name=${ encodeURIComponent( displayName ) }` : '';

	return (
		<img
			ref={ profileImageRef }
			className={ className }
			alt={ displayName || '' }
			src={ `https://secure.gravatar.com/avatar/${ hashedEmail }?d=${ defaultImage }${ hovercardName }` }
			width={ size }
			height={ size }
			loading="lazy"
		/>
	);
}

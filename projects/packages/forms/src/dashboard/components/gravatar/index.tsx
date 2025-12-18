/**
 * External dependencies
 */
import { Hovercards } from '@gravatar-com/hovercards';
import '@gravatar-com/hovercards/dist/style.css';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { sha256 } from 'js-sha256';
import './style.scss';

type GravatarProps = {
	defaultImage?: // https://docs.gravatar.com/sdk/images/#default-image
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
	useHovercard?: boolean;
};

/**
 * Renders Gravatar profile image with profile hover card.
 *
 * If email has no gravatar profile, uses initials to render image instead.
 * See https://docs.gravatar.com/sdk/images/#default-image
 *
 * @param {GravatarProps} props - The component props.
 * @return {JSX.Element} The Gravatar component
 */
export default function Gravatar( {
	defaultImage = 'initials',
	displayName,
	email,
	size = 48,
	useHovercard = true,
}: GravatarProps ): JSX.Element | null {
	const profileImageRef = useRef( null );
	const hovercardRef = useRef( null );

	useEffect( () => {
		if ( useHovercard && profileImageRef.current ) {
			hovercardRef.current = new Hovercards( {
				// Documented at https://github.com/Automattic/gravatar/tree/trunk/web/packages/hovercards#translations
				i18n: {
					'Edit your profile →': __( 'Edit your profile →', 'jetpack-forms' ),
					'View profile →': __( 'View profile →', 'jetpack-forms' ),
					Contact: __( 'Contact', 'jetpack-forms' ),
					'Send money': __( 'Send money', 'jetpack-forms' ),
					'Sorry, we are unable to load this Gravatar profile.': __(
						'Sorry, we are unable to load this Gravatar profile.',
						'jetpack-forms'
					),
					'Gravatar not found.': __( 'Gravatar not found.', 'jetpack-forms' ),
					'Too Many Requests.': __( 'Too many requests.', 'jetpack-forms' ),
					'Internal Server Error.': __( 'Internal server error.', 'jetpack-forms' ),
					'Is this you?': __( 'Is this you?', 'jetpack-forms' ),
					'Claim your free profile.': __( 'Claim your free profile.', 'jetpack-forms' ),
					Email: __( 'Email', 'jetpack-forms' ),
					'Home Phone': __( 'Home phone', 'jetpack-forms' ),
					'Work Phone': __( 'Work phone', 'jetpack-forms' ),
					'Cell Phone': __( 'Cell phone', 'jetpack-forms' ),
					'Contact Form': __( 'Contact form', 'jetpack-forms' ),
					Calendar: __( 'Calendar', 'jetpack-forms' ),
				},
			} );
			hovercardRef.current.attach( profileImageRef.current );
		}
	}, [ useHovercard ] );

	if ( ! email ) {
		return null;
	}

	const hashedEmail = sha256( email );

	return (
		<img
			alt={ displayName || '' }
			className="jp-forms__gravatar"
			ref={ profileImageRef }
			src={ `https://0.gravatar.com/avatar/${ hashedEmail }?d=${ defaultImage }&name=${ displayName }` }
			width={ size }
			height={ size }
		/>
	);
}

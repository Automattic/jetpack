/**
 * External dependencies
 */
import { Hovercards } from '@gravatar-com/hovercards';
import '@gravatar-com/hovercards/dist/style.css';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { sha256 } from 'js-sha256';
import './style.scss';

/**
 * Gravatar `defaultImage` styles, mirroring https://docs.gravatar.com/sdk/images/#default-image
 */
type DefaultImage =
	| 'blank'
	| 'color'
	| 'identicon'
	| 'initials'
	| 'monsterid'
	| 'mp'
	| 'retro'
	| 'robohash'
	| 'wavatar';

/**
 * Background colors for the "initials" identity avatars, drawn from the
 * Color Studio palette's 50 shades (https://color-studio.blog/).
 *
 * Only the 50-level shades are safe here: the white initials clear WCAG AA
 * against them, and the warmer ones (orange, yellow, green, celadon) sit right
 * on the 4.5:1 line. Swapping in a lighter tint would quietly drop below AA.
 *
 * Keep in sync with `Feedback_Author::IDENTITY_BG_COLORS` in
 * projects/packages/forms/src/contact-form/class-feedback-author.php, which
 * colors the same authors in the response notification emails. The hexes are
 * spelled out rather than imported from `@automattic/color-studio` on purpose:
 * PHP can't read node_modules at runtime, so importing here would let the two
 * halves drift apart invisibly instead of visibly.
 *
 * Hex values without the leading `#`, as Gravatar's `bg_color` param expects.
 */
const IDENTITY_BG_COLORS = [
	'3858e9', // Blue 50
	'984a9c', // Purple 50
	'c9356e', // Pink 50
	'd63638', // Red 50
	'b26200', // Orange 50
	'9d6e00', // Yellow 50
	'008a20', // Green 50
	'008763', // Celadon 50
];

/**
 * Picks a stable background color for an email's identity avatar, so the same
 * address always renders on the same Color Studio color.
 *
 * Uses the first 8 hex chars of the normalized email's SHA-256, matching
 * `Feedback_Author::get_identity_background_color()` in the Forms package.
 *
 * Any stable string works: the Forms dashboard falls back to the visitor's IP
 * address for responses submitted without an email.
 *
 * @param email - Email address the avatar is rendered for.
 * @return A hex color from IDENTITY_BG_COLORS.
 */
function getIdentityBackgroundColor( email: string ): string {
	const hash = sha256( email.trim().toLowerCase() );
	const index = parseInt( hash.slice( 0, 8 ), 16 ) % IDENTITY_BG_COLORS.length;
	return IDENTITY_BG_COLORS[ index ];
}

export type GravatarProps = {
	/**
	 * Style of the placeholder image when the email has no Gravatar profile.
	 * @default 'initials'
	 */
	defaultImage?: DefaultImage;
	/**
	 * Display name for accessibility (used as `alt` text and the hovercard label).
	 */
	displayName?: string;
	/**
	 * Email address to look up on Gravatar.
	 */
	email: string;
	/**
	 * Rendered avatar size in pixels.
	 * @default 48
	 */
	size?: number;
	/**
	 * Optional class name forwarded to the underlying `<img>` element. The
	 * default `jetpack-components-gravatar` class is always applied so consumers
	 * can target it directly.
	 */
	className?: string;
	/**
	 * Whether to attach a Gravatar profile hovercard to the avatar.
	 * @default true
	 */
	useHovercard?: boolean;
};

/**
 * Renders a Gravatar profile image with an optional Gravatar profile hovercard.
 *
 * If the email has no Gravatar profile, the configured `defaultImage` style is
 * used (initials by default).
 *
 * Long-term, this is the seam for switching to a core or Gravatar-shipped
 * component (see https://github.com/WordPress/gutenberg/issues/76836); until
 * then, Forms and Newsletter share this implementation.
 *
 * @param props              - The component props.
 * @param props.defaultImage - Style of the placeholder image when the email has no Gravatar.
 * @param props.displayName  - Display name used for `alt` text + hovercard label.
 * @param props.email        - Email address to look up on Gravatar.
 * @param props.size         - Rendered avatar size in pixels.
 * @param props.className    - Optional class name forwarded to the underlying `<img>`.
 * @param props.useHovercard - Whether to attach the Gravatar profile hovercard.
 * @return The Gravatar avatar `<img>`, or null when no email is available.
 */
export default function Gravatar( {
	defaultImage = 'initials',
	displayName,
	email,
	size = 48,
	className,
	useHovercard = true,
}: GravatarProps ): JSX.Element | null {
	const profileImageRef = useRef< HTMLImageElement | null >( null );
	const hovercardRef = useRef< Hovercards | null >( null );

	useEffect( () => {
		if ( ! useHovercard || ! profileImageRef.current ) {
			return;
		}
		hovercardRef.current = new Hovercards( {
			// See https://github.com/Automattic/gravatar/tree/trunk/web/packages/hovercards#translations
			i18n: {
				'Edit your profile →': __( 'Edit your profile →', 'jetpack-components' ),
				'View profile →': __( 'View profile →', 'jetpack-components' ),
				Contact: __( 'Contact', 'jetpack-components' ),
				'Send money': __( 'Send money', 'jetpack-components' ),
				'Sorry, we are unable to load this Gravatar profile.': __(
					'Sorry, we are unable to load this Gravatar profile.',
					'jetpack-components'
				),
				'Gravatar not found.': __( 'Gravatar not found.', 'jetpack-components' ),
				'This profile is private.': __( 'This profile is private.', 'jetpack-components' ),
				'Too Many Requests.': __( 'Too many requests.', 'jetpack-components' ),
				'Internal Server Error.': __( 'Internal server error.', 'jetpack-components' ),
				'Is this you?': __( 'Is this you?', 'jetpack-components' ),
				'Claim your free profile.': __( 'Claim your free profile.', 'jetpack-components' ),
				Email: __( 'Email', 'jetpack-components' ),
				'Home Phone': __( 'Home phone', 'jetpack-components' ),
				'Work Phone': __( 'Work phone', 'jetpack-components' ),
				'Cell Phone': __( 'Cell phone', 'jetpack-components' ),
				'Contact Form': __( 'Contact form', 'jetpack-components' ),
				Calendar: __( 'Calendar', 'jetpack-components' ),
			},
		} );
		hovercardRef.current.attach( profileImageRef.current );
	}, [ useHovercard ] );

	if ( ! email ) {
		return null;
	}

	const hashedEmail = sha256( email );
	const hovercardName = displayName ? `&name=${ encodeURIComponent( displayName ) }` : '';
	const bgColorParam =
		defaultImage === 'initials' ? `&bg_color=${ getIdentityBackgroundColor( email ) }` : '';

	return (
		<img
			ref={ profileImageRef }
			className={ clsx( 'jetpack-components-gravatar', className ) }
			alt={ displayName || '' }
			src={ `https://secure.gravatar.com/avatar/${ hashedEmail }?d=${ defaultImage }${ hovercardName }${ bgColorParam }` }
			width={ size }
			height={ size }
			loading="lazy"
		/>
	);
}

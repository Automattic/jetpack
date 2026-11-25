import { useState } from '@wordpress/element';
import { commentAuthorAvatar } from '@wordpress/icons';
import { Icon } from '@wordpress/ui';
import type { ComponentProps } from 'react';
import './avatar.scss';

type IconShape = ComponentProps< typeof Icon >[ 'icon' ];

/** The first email address in a recipient list; the same pattern the server uses. */
const FIRST_EMAIL = /[^\s<>,;"'()]+@[^\s<>,;"'()]+/;

/**
 * The letter for a placeholder avatar: the first name in the text, else the part of the first
 * address before the @.
 *
 * @param text - A name, an address, or a logged recipient list like `"Desk, Help" <help@example.com>, sales@example.com`.
 * @return One uppercase letter, or null when there's no letter to show.
 */
export function avatarInitial( text: string ): string | null {
	const email = FIRST_EMAIL.exec( text );
	const before = email ? text.slice( 0, email.index ).trim() : '';
	// A display name sits right before its `<address>`; anything earlier belongs to another recipient.
	const name = before.endsWith( '<' )
		? before
				.slice( 0, -1 )
				.split( /[,;](?=[^"]*$)/ )
				.pop()
		: '';
	for ( const source of [ name ?? '', email ? email[ 0 ].split( '@' )[ 0 ] : text ] ) {
		const letter = /\p{L}/u.exec( source );
		if ( letter ) {
			return letter[ 0 ].toLocaleUpperCase();
		}
	}
	return null;
}

/**
 * An image that steps aside when it doesn't load.
 *
 * @param url - Image URL, or null for none.
 * @return Whether to show the image, and the error handler.
 */
export function useImage( url: string | null | undefined ) {
	const [ failed, setFailed ] = useState< string | null >( null );
	return {
		show: !! url && url !== failed,
		onError: () => setFailed( url ?? null ),
	};
}

export type AvatarSize = 'sm' | 'md' | 'lg';

type Props = {
	/** A name, an address or a recipient list: the initial comes from it. */
	name: string;
	/** The person's avatar. It's transparent when they have none, so whatever is below shows through. */
	url?: string | null;
	/** Shown below the avatar: the site icon, for the sender only. */
	fallbackUrl?: string | null;
	/** A glyph in place of the initial, e.g. for the host's default sender. */
	icon?: IconShape;
	/** `sm` in lists, `md` in the inbox preview, `lg` beside a sender's name. */
	size?: AvatarSize;
	/** Only when nothing beside it names the person; otherwise it's decorative. */
	label?: string;
	className?: string;
};

/**
 * A round avatar: the person's picture, then the site icon (for the sender), then their initial.
 *
 * @param props             - Component props.
 * @param props.name        - Where the initial comes from.
 * @param props.url         - The person's avatar.
 * @param props.fallbackUrl - The image under it.
 * @param props.icon        - A glyph instead of the initial.
 * @param props.size        - Size.
 * @param props.label       - Text alternative, when the avatar stands alone.
 * @param props.className   - Extra class.
 * @return The avatar.
 */
const Avatar = ( { name, url, fallbackUrl, icon, size = 'sm', label, className }: Props ) => {
	const image = useImage( url );
	const fallback = useImage( fallbackUrl );
	const initial = icon ? null : avatarInitial( name );
	const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
	return (
		<span
			className={ [ 'jetpack-send-avatar', `jetpack-send-avatar--${ size }`, className ]
				.filter( Boolean )
				.join( ' ' ) }
			{ ...a11y }
		>
			{ initial ?? <Icon icon={ icon ?? commentAuthorAvatar } /> }
			{ fallback.show && (
				<img
					className="jetpack-send-avatar__fallback"
					src={ fallbackUrl ?? '' }
					alt=""
					onError={ fallback.onError }
				/>
			) }
			{ image.show && <img src={ url ?? '' } alt="" onError={ image.onError } /> }
		</span>
	);
};

export default Avatar;

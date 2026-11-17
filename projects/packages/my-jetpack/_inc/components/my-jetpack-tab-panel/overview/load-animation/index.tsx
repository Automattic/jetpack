import { VisuallyHidden } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import styles from './style.module.scss';
import type { CSSProperties, FC } from 'react';

let hasPlayed = false;

/**
 * Whether the Overview's load animation plays: until it has played once in a
 * page load, unless the user prefers reduced motion.
 *
 * @return Whether to animate, and the callback that marks the animation played.
 */
export function useOverviewLoadAnimation(): { animate: boolean; onPlayed: () => void } {
	const [ animate ] = useState(
		() => ! hasPlayed && ! window.matchMedia?.( '(prefers-reduced-motion: reduce)' ).matches
	);
	// Marked once played, not on mount, so a mount that is replaced at once doesn't use it up.
	const onPlayed = useCallback( () => {
		hasPlayed = true;
	}, [] );
	return { animate, onPlayed };
}

/**
 * Splits text into user-perceived characters, so an emoji types as one.
 *
 * @param text - The text.
 * @return The characters.
 */
function splitCharacters( text: string ): string[] {
	if ( typeof Intl !== 'undefined' && 'Segmenter' in Intl ) {
		return Array.from( new Intl.Segmenter().segment( text ), ( { segment } ) => segment );
	}
	return Array.from( text );
}

/**
 * Text that types itself out with a caret; assistive tech reads it whole.
 *
 * @param props         - Component props.
 * @param props.text    - The text to type.
 * @param props.onTyped - Called when the last character finishes animating.
 * @return The rendered text.
 */
export const TypedText: FC< { text: string; onTyped?: () => void } > = ( { text, onTyped } ) => {
	const characters = splitCharacters( text );
	return (
		<>
			<span className={ styles[ 'typed-label' ] }>
				<VisuallyHidden render={ <span /> }>{ text }</VisuallyHidden>
			</span>
			<span
				aria-hidden="true"
				className={ styles.typed }
				style={ { '--typed-count': characters.length } as CSSProperties }
			>
				{ characters.map( ( character, index ) => (
					<span
						key={ index }
						style={ { '--typed-index': index } as CSSProperties }
						onAnimationEnd={ index === characters.length - 1 ? onTyped : undefined }
					>
						{ character }
					</span>
				) ) }
			</span>
		</>
	);
};

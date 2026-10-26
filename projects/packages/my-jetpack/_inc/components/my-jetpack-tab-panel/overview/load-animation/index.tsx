import { VisuallyHidden } from '@wordpress/ui';
import { useEffect, useState } from 'react';
import styles from './style.module.scss';
import type { CSSProperties, FC } from 'react';

let hasPlayed = false;

/**
 * Whether the Overview's load animation plays: on its first mount in a page
 * load, unless the user prefers reduced motion.
 *
 * @return Whether to animate.
 */
export function useOverviewLoadAnimation(): boolean {
	const [ animate ] = useState(
		() => ! hasPlayed && ! window.matchMedia?.( '(prefers-reduced-motion: reduce)' ).matches
	);
	useEffect( () => {
		hasPlayed = true;
	}, [] );
	return animate;
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
 * @param props      - Component props.
 * @param props.text - The text to type.
 * @return The rendered text.
 */
export const TypedText: FC< { text: string } > = ( { text } ) => {
	const characters = splitCharacters( text );
	return (
		<>
			<VisuallyHidden render={ <span /> }>{ text }</VisuallyHidden>
			<span
				aria-hidden="true"
				className={ styles.typed }
				style={ { '--typed-count': characters.length } as CSSProperties }
			>
				{ characters.map( ( character, index ) => (
					<span key={ index } style={ { '--typed-index': index } as CSSProperties }>
						{ character }
					</span>
				) ) }
			</span>
		</>
	);
};

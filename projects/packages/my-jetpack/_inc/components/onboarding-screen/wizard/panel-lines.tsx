import { useReducedMotion } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import type { MouseEvent } from 'react';

// How long each message stays up, and how long the first waits for the mark to draw.
const SLIDE_MS = 6000;
const FIRST_RISE_DELAY_S = 0.9;
const LINE_STEP_S = 0.08;

/**
 * The brand panel's messages, a string per sentence so a translation wraps where its words fall.
 *
 * @return The messages, one array of sentences each.
 */
function panelSlides(): string[][] {
	return [
		[
			__( 'Grow your audience.', 'jetpack-my-jetpack' ),
			__( 'Speed up your site.', 'jetpack-my-jetpack' ),
			__( 'Keep it secure.', 'jetpack-my-jetpack' ),
		],
		[
			__( 'Set up in minutes.', 'jetpack-my-jetpack' ),
			__( 'We do the heavy lifting.', 'jetpack-my-jetpack' ),
		],
		[ __( 'Your site, understood — not just monitored.', 'jetpack-my-jetpack' ) ],
	];
}

/**
 * The brand panel's display copy: three messages that take turns under the mark.
 *
 * Moving beside a form, it must be stoppable (WCAG 2.2.2): it holds under pointer or
 * focus, stops once a dot is picked, and never turns for anyone asking for less motion.
 *
 * @return The rotating copy and its dots.
 */
export function PanelLines() {
	const slides = panelSlides();
	const reduced = useReducedMotion();
	const [ current, setCurrent ] = useState( 0 );
	const [ hasTurned, setHasTurned ] = useState( false );
	// Held apart, so the pointer leaving doesn't restart it under keyboard focus, or the reverse.
	const [ isHovered, setIsHovered ] = useState( false );
	const [ isFocused, setIsFocused ] = useState( false );
	const isHeld = isHovered || isFocused;
	const [ isStopped, setIsStopped ] = useState( false );

	useEffect( () => {
		if ( reduced || isHeld || isStopped ) {
			return;
		}

		const timer = setTimeout( () => {
			setHasTurned( true );
			setCurrent( index => ( index + 1 ) % slides.length );
		}, SLIDE_MS );

		return () => clearTimeout( timer );
	}, [ current, reduced, isHeld, isStopped, slides.length ] );

	// Only the very first message waits for the mark; a later one rises at once.
	const riseDelay = hasTurned ? 0 : FIRST_RISE_DELAY_S;

	const hover = useCallback( () => setIsHovered( true ), [] );
	const unhover = useCallback( () => setIsHovered( false ), [] );
	const focus = useCallback( () => setIsFocused( true ), [] );
	const blur = useCallback( () => setIsFocused( false ), [] );

	/*
	 * The dots are one button, not three: at the prototype's spacing, three
	 * buttons would sit closer than WCAG 2.5.8's 24px. A click on a dot goes to
	 * that message; anything else, a key press included, goes to the next.
	 */
	const pick = useCallback(
		( event: MouseEvent< HTMLButtonElement > ) => {
			const dot = ( event.target as HTMLElement ).dataset.index;

			setIsStopped( true );
			setHasTurned( true );
			setCurrent( index => ( dot === undefined ? ( index + 1 ) % slides.length : Number( dot ) ) );
		},
		[ slides.length ]
	);

	return (
		<div
			className={ styles[ 'brand-panel__copy' ] }
			onPointerEnter={ hover }
			onPointerLeave={ unhover }
			onFocus={ focus }
			onBlur={ blur }
		>
			<div className={ styles[ 'brand-panel__messages' ] }>
				{ slides.map( ( lines, index ) => (
					<p
						key={ index }
						className={ clsx(
							styles[ 'brand-panel__message' ],
							index === current && styles[ 'brand-panel__message--current' ]
						) }
						aria-hidden={ index === current ? undefined : true }
					>
						{ lines.map( ( line, lineIndex ) => (
							<span
								key={ line }
								className={ styles[ 'brand-panel__line' ] }
								style={ { animationDelay: `${ riseDelay + lineIndex * LINE_STEP_S }s` } }
							>
								{ line }
							</span>
						) ) }
					</p>
				) ) }
			</div>

			<button
				type="button"
				className={ styles[ 'brand-panel__dots' ] }
				aria-label={ sprintf(
					/* translators: 1: the message showing, 2: how many there are. */
					__( 'Message %1$d of %2$d. Show the next one.', 'jetpack-my-jetpack' ),
					current + 1,
					slides.length
				) }
				onClick={ pick }
			>
				{ slides.map( ( _, index ) => (
					<span
						key={ index }
						data-index={ index }
						className={ clsx(
							styles[ 'brand-panel__dot' ],
							index === current && styles[ 'brand-panel__dot--current' ]
						) }
					/>
				) ) }
			</button>
		</div>
	);
}

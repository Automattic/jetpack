import { createInterpolateElement } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.scss';
import { useReducedMotion } from './use-reduced-motion';
import type { OnboardingSite } from './lib';
import type { ReactNode } from 'react';

// How long a numeral takes to reach its value, from the prototype.
const COUNT_MS = 900;

/*
 * Below this a count-up is not motion, it is a wrong number held on screen: a
 * count to 1 spends most of its 900ms reading "0 posts published", which is
 * the exact claim `statLines` filters zeros out to avoid making.
 */
const COUNT_FLOOR = 10;

/*
 * The three lights on a browser's title bar. The prototype's own values, which
 * are the muted set rather than the saturated one, so they read as chrome and
 * not as status.
 */
const LIGHTS = [ '#f09795', '#ece77d', '#91ce97' ];

/**
 * The three lights, for the front window and for the backs behind it.
 *
 * @return The rendered lights.
 */
function Lights() {
	return (
		<>
			{ LIGHTS.map( light => (
				<span
					key={ light }
					className={ styles[ 'portrait-light' ] }
					style={ { background: light } }
				/>
			) ) }
		</>
	);
}

/**
 * What this site has, one line each.
 *
 * Whole sentences with the number inside them, marked up rather than split: a
 * translator handed "posts published" on its own cannot tell what agrees with
 * what, and several languages need the number to place the noun.
 *
 * A zero is left out. It is how an unmeasured field is spelled at least as
 * often as it is a real count, and "0 posts published" on a site with posts is
 * worse than saying nothing — which is what the prototype found on a site whose
 * media endpoint answered 401.
 *
 * @param counts - What the page counted.
 * @return One entry per count worth showing.
 */
function statLines( counts: OnboardingSite[ 'counts' ] ) {
	const lines = [
		{
			value: counts.posts,
			text: sprintf(
				/* translators: %d is how many posts the site has published. */
				_n(
					'<b>%d</b> post published',
					'<b>%d</b> posts published',
					counts.posts,
					'jetpack-my-jetpack'
				),
				counts.posts
			),
		},
		{
			value: counts.pages,
			text: sprintf(
				/* translators: %d is how many pages the site has published. */
				_n(
					'<b>%d</b> page published',
					'<b>%d</b> pages published',
					counts.pages,
					'jetpack-my-jetpack'
				),
				counts.pages
			),
		},
		{
			value: counts.media,
			text: sprintf(
				/* translators: %d is how many files are in the site's media library. */
				_n(
					'<b>%d</b> file in your media library',
					'<b>%d</b> files in your media library',
					counts.media,
					'jetpack-my-jetpack'
				),
				counts.media
			),
		},
		{
			value: counts.plugins,
			text: sprintf(
				/* translators: %d is how many plugins the site has installed. */
				_n(
					'<b>%d</b> plugin installed',
					'<b>%d</b> plugins installed',
					counts.plugins,
					'jetpack-my-jetpack'
				),
				counts.plugins
			),
		},
	];

	return lines.filter( line => line.value > 0 );
}

/**
 * The numeral, showing either what the site has or where the count is up to.
 *
 * `children` is the numeral as the translated string spells it, and it is what
 * renders at rest. Every frame of a count-up is a number the site does not
 * have, so the true one is the default and the count is the exception.
 *
 * @param props          - The component props.
 * @param props.at       - Where the count is up to, or null when it is not running.
 * @param props.children - The numeral as the translated string spells it.
 * @return The rendered numeral.
 */
function StatNumeral( { at, children }: { at: number | null; children?: ReactNode } ) {
	return (
		<span className={ styles[ 'portrait-stat__value' ] }>{ at === null ? children : at }</span>
	);
}

/**
 * One count, as a sentence, with the numeral counting up to it.
 *
 * The count waits for the rows' entrance delay, which it reads off the
 * stylesheet rather than repeating here: written as a constant it would finish
 * behind rows that had not faded in yet the first time the delay changed.
 *
 * @param props       - The component props.
 * @param props.text  - The translated sentence with the number already in it.
 * @param props.value - The number, which the count-up needs on its own.
 * @return The rendered row.
 */
function StatRow( { text, value }: { text: string; value: number } ) {
	const row = useRef< HTMLParagraphElement >( null );
	const reduced = useReducedMotion();
	const [ at, setAt ] = useState< number | null >( null );

	useEffect( () => {
		if ( reduced || value < COUNT_FLOOR || ! row.current ) {
			// Back to the real number. Turning motion down part way through a count
			// otherwise strands the numeral on whatever it had reached.
			setAt( null );
			return;
		}

		const delay = parseFloat( getComputedStyle( row.current ).animationDelay ) * 1000 || 0;
		let frame = 0;
		// Null rather than 0, which is a timestamp a fake clock really does hand out.
		let began: number | null = null;

		const tick = ( now: number ) => {
			began = began ?? now;

			const through = Math.min( 1, ( now - began ) / COUNT_MS );

			// Back to the numeral the translation produced, rather than leaving our
			// own rendering of it on screen.
			if ( through >= 1 ) {
				setAt( null );
				return;
			}

			setAt( Math.round( value * ( 1 - Math.pow( 1 - through, 3 ) ) ) );
			frame = requestAnimationFrame( tick );
		};

		const start = setTimeout( () => {
			setAt( 0 );
			frame = requestAnimationFrame( tick );
		}, delay );

		return () => {
			clearTimeout( start );
			cancelAnimationFrame( frame );
		};
	}, [ reduced, value ] );

	return (
		<p ref={ row } className={ styles[ 'portrait-stat' ] }>
			{ createInterpolateElement( text, { b: <StatNumeral at={ at } /> } ) }
		</p>
	);
}

/**
 * This site, as a browser window in a receding stack, over what is in it.
 *
 * The prototype's identity stage, and the one screen it shows this on: where we
 * say what we read the site as and ask whether that is right. Ours asks the
 * same question, so it is the same screen.
 *
 * The backs are blank rather than labelled. The prototype writes the site's
 * feed URLs on them because its scan really read those pages; we read nothing,
 * so a URL there would be a claim about a fetch that never happened.
 *
 * Hidden from the accessibility tree in full. Every fact in it is decorative
 * here — the question being asked is on the left, the picture is of a site the
 * user is sitting inside, and read aloud the counts are four numbers with no
 * bearing on the answer.
 *
 * @param props      - The component props.
 * @param props.site - What the page told us about this site.
 * @param props.shot - The homepage screenshot, once the service has one.
 * @return The rendered portrait.
 */
export function SitePortrait( { site, shot }: { site: OnboardingSite; shot: string | null } ) {
	const stats = statLines( site.counts );

	return (
		<div className={ styles.portrait } aria-hidden="true">
			{ /*
			 * No window unless a picture is coming. An empty plate is a frame around
			 * nothing, and it promises a photograph that will never arrive: the counts
			 * on their own are at least all true.
			 */ }
			{ site.canPhotograph && (
				<div className={ styles[ 'portrait-stack' ] }>
					<span className={ clsx( styles[ 'portrait-back' ], styles[ 'portrait-back--far' ] ) }>
						<span className={ styles[ 'portrait-back__chrome' ] }>
							<Lights />
						</span>
					</span>
					<span className={ clsx( styles[ 'portrait-back' ], styles[ 'portrait-back--near' ] ) }>
						<span className={ styles[ 'portrait-back__chrome' ] }>
							<Lights />
						</span>
					</span>

					<div className={ styles[ 'portrait-window' ] }>
						<div className={ styles[ 'portrait-window__bar' ] }>
							<Lights />
							<span className={ styles[ 'portrait-window__url' ] }>{ site.domain }</span>
						</div>

						{ /*
						 * The plate is drawn whether or not a picture arrives, so the stack
						 * does not pop into place when one does, and nothing in the flow is
						 * waiting on it.
						 */ }
						<div className={ styles[ 'portrait-window__plate' ] }>
							{ shot && (
								<img src={ shot } alt="" className={ styles[ 'portrait-window__shot' ] } />
							) }
						</div>
					</div>
				</div>
			) }

			{ stats.length > 0 && (
				<div className={ styles[ 'portrait-stats' ] }>
					{ stats.map( stat => (
						<StatRow key={ stat.text } text={ stat.text } value={ stat.value } />
					) ) }
				</div>
			) }
		</div>
	);
}

/**
 * Whether there is anything true to put on the panel for this site.
 *
 * @param site - What the page told us, if anything.
 * @return True when the portrait has either a picture coming or a count to show.
 */
export function hasPortrait( site: OnboardingSite | undefined ): site is OnboardingSite {
	if ( ! site ) {
		return false;
	}

	return site.canPhotograph || Object.values( site.counts ).some( count => count > 0 );
}

/**
 * PROTOTYPE — THROWAWAY.
 *
 * Shows what a before/after page-loading comparison could look like in the Boost dashboard, so we
 * can judge whether seeing the load teaches you something the score does not. The frames and
 * timings are real (see prototype-data.ts) but they are baked in: nothing in the product produces
 * them yet.
 *
 * Presented as a video player: two runs side by side against one clock. Both use the same time
 * axis deliberately — normalising each to its own duration would make a fast load and a slow one
 * look identical. The frame-by-frame strips are the same data, kept behind a disclosure.
 */

import { sprintf, __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	BOOST_MODULES,
	CAPTURED_URL,
	PROTOTYPE_FILMSTRIP,
	type FilmstripDevice,
	type FilmstripVariant,
	type VariantCapture,
} from './prototype-data';
import styles from './loading-filmstrip.module.scss';

const VARIANTS: FilmstripVariant[] = [ 'before', 'after' ];

/**
 * Format a millisecond duration the way performance tooling does: sub-second in ms, above in
 * seconds to one decimal place.
 *
 * @param ms - Duration in milliseconds.
 * @return Formatted duration.
 */
function formatMs( ms: number ): string {
	if ( Math.abs( ms ) < 1000 ) {
		return sprintf(
			/* translators: %d is a whole number of milliseconds. */
			__( '%dms', 'jetpack-boost' ),
			Math.round( ms )
		);
	}
	return sprintf(
		/* translators: %s is a number of seconds with one decimal place, e.g. "1.7". */
		__( '%ss', 'jetpack-boost' ),
		( ms / 1000 ).toFixed( 1 )
	);
}

/**
 * Pick the frame that was on screen at a given moment — the most recent frame captured at or
 * before it. Screencasts only emit a frame when the page changes visually, so the gaps between
 * frames are exactly the periods where the visitor saw nothing happen.
 *
 * @param capture - The captured run to read frames from.
 * @param atMs    - Milliseconds since navigation start.
 * @return The frame visible at that moment.
 */
function frameAt( capture: VariantCapture, atMs: number ) {
	let visible = capture.frames[ 0 ];
	for ( const frame of capture.frames ) {
		if ( frame.offsetMs <= atMs ) {
			visible = frame;
		} else {
			break;
		}
	}
	return visible;
}

/**
 * Build the evenly spaced columns of the frame-by-frame view. Filmstrips sample on a fixed cadence
 * rather than showing raw frames, so that the horizontal axis reads as time.
 *
 * @param endMs - Time the slower of the two loads finished.
 * @return The column times.
 */
function buildColumns( endMs: number ): number[] {
	const targetColumns = 9;
	const stepMs =
		[ 100, 250, 500, 1000, 2000 ].find( step => endMs / targetColumns <= step ) ?? 2000;

	const times: number[] = [];
	for ( let t = 0; t <= endMs; t += stepMs ) {
		times.push( t );
	}
	if ( endMs - times[ times.length - 1 ] > stepMs / 3 ) {
		times.push( endMs );
	}
	return times;
}

const PlayIcon = () => (
	<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
		<path d="M8 5v14l11-7z" fill="currentColor" />
	</svg>
);

const PauseIcon = () => (
	<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
		<path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor" />
	</svg>
);

const LoadingFilmstrip = () => {
	const [ device, setDevice ] = useState< FilmstripDevice >( 'mobile' );
	const [ showFrames, setShowFrames ] = useState( false );
	const profile = PROTOTYPE_FILMSTRIP[ device ];

	// One clock for both runs, long enough to contain the slower of the two.
	const endMs = Math.max( profile.before.metrics.load, profile.after.metrics.load );

	const [ playheadMs, setPlayheadMs ] = useState( 0 );
	const [ isPlaying, setIsPlaying ] = useState( false );
	const rafRef = useRef< number >( 0 );
	// Where playback resumed from, so pause/resume does not restart the clock.
	const resumeRef = useRef( { wallMs: 0, headMs: 0 } );

	const times = useMemo( () => buildColumns( endMs ), [ endMs ] );

	const variantLabels: Record< FilmstripVariant, string > = {
		before: __( 'Without Boost', 'jetpack-boost' ),
		after: __( 'With Boost', 'jetpack-boost' ),
	};

	const milestonesFor = useCallback(
		( capture: VariantCapture ) => [
			{
				key: 'fcp',
				atMs: capture.metrics.fcp,
				label: __( 'First paint', 'jetpack-boost' ),
				tone: styles[ 'tone-fcp' ],
			},
			{
				key: 'lcp',
				atMs: capture.metrics.lcp,
				label: __( 'Largest content', 'jetpack-boost' ),
				tone: styles[ 'tone-lcp' ],
			},
			{
				key: 'load',
				atMs: capture.metrics.load,
				label: __( 'Finished', 'jetpack-boost' ),
				tone: styles[ 'tone-load' ],
			},
		],
		[]
	);

	// Start from the beginning when switching devices — the two clocks differ.
	useEffect( () => {
		setIsPlaying( false );
		setPlayheadMs( 0 );
	}, [ device, endMs ] );

	useEffect( () => {
		if ( ! isPlaying ) {
			return;
		}
		const tick = () => {
			const { wallMs, headMs } = resumeRef.current;
			const elapsed = headMs + ( performance.now() - wallMs );
			if ( elapsed >= endMs ) {
				setPlayheadMs( endMs );
				setIsPlaying( false );
				return;
			}
			setPlayheadMs( elapsed );
			rafRef.current = requestAnimationFrame( tick );
		};
		rafRef.current = requestAnimationFrame( tick );
		return () => cancelAnimationFrame( rafRef.current );
	}, [ isPlaying, endMs ] );

	const togglePlay = useCallback( () => {
		if ( isPlaying ) {
			setIsPlaying( false );
			return;
		}
		// Replay from the start once the run has finished.
		const from = playheadMs >= endMs ? 0 : playheadMs;
		resumeRef.current = { wallMs: performance.now(), headMs: from };
		setPlayheadMs( from );
		setIsPlaying( true );
	}, [ isPlaying, playheadMs, endMs ] );

	const seek = useCallback( ( toMs: number ) => {
		setIsPlaying( false );
		setPlayheadMs( toMs );
	}, [] );

	const paintDelta = profile.before.metrics.fcp - profile.after.metrics.fcp;
	const finishDelta = profile.before.metrics.load - profile.after.metrics.load;

	/**
	 * Describe a delta without assuming it is an improvement — on some pages a module makes a
	 * metric worse, and the prototype should say so rather than flatter Boost.
	 *
	 * @param deltaMs - Before minus after, in milliseconds.
	 * @return Phrase such as "0.4s sooner".
	 */
	const describeDelta = ( deltaMs: number ): string =>
		deltaMs >= 0
			? sprintf(
					/* translators: %s is a duration such as "0.4s". */
					__( '%s sooner', 'jetpack-boost' ),
					formatMs( Math.abs( deltaMs ) )
			  )
			: sprintf(
					/* translators: %s is a duration such as "0.4s". */
					__( '%s later', 'jetpack-boost' ),
					formatMs( Math.abs( deltaMs ) )
			  );

	const isPortrait = profile.viewport.height > profile.viewport.width;
	const progressPercent = ( playheadMs / endMs ) * 100;

	return (
		<div className={ styles.filmstrip }>
			<div className={ styles.header }>
				<div>
					<h3 className={ styles.title }>
						{ __( 'How your page loads', 'jetpack-boost' ) }
						<span className={ styles.badge }>{ __( 'Prototype', 'jetpack-boost' ) }</span>
					</h3>
					<p className={ styles.caption }>
						{ sprintf(
							/* translators: 1: the URL that was measured, 2: list of Boost modules. */
							__(
								'What a visitor sees while %1$s loads, on a throttled connection, with and without %2$s.',
								'jetpack-boost'
							),
							CAPTURED_URL.replace( /^https?:\/\//, '' ).replace( /\/$/, '' ),
							BOOST_MODULES
						) }
					</p>
				</div>

				<div className={ styles.devices } role="tablist">
					{ ( Object.keys( PROTOTYPE_FILMSTRIP ) as FilmstripDevice[] ).map( key => (
						<button
							key={ key }
							type="button"
							role="tab"
							aria-selected={ device === key }
							className={ device === key ? styles[ 'device-active' ] : styles.device }
							onClick={ () => setDevice( key ) }
						>
							{ PROTOTYPE_FILMSTRIP[ key ].label }
						</button>
					) ) }
				</div>
			</div>

			<p className={ styles.summary }>
				{ sprintf(
					/* translators: 1: e.g. "0.2s sooner", 2: e.g. "0.5s sooner". */
					__(
						'With Boost, something appeared on screen %1$s and the page finished loading %2$s.',
						'jetpack-boost'
					),
					describeDelta( paintDelta ),
					describeDelta( finishDelta )
				) }
			</p>

			<div className={ styles.player }>
				<div className={ styles.screens }>
					{ VARIANTS.map( variant => {
						const capture = profile[ variant ];
						const isDone = playheadMs >= capture.metrics.load;
						return (
							<div key={ variant } className={ styles.screen }>
								<span className={ styles[ 'screen-label' ] }>{ variantLabels[ variant ] }</span>
								<div
									className={ isPortrait ? styles[ 'stage-portrait' ] : styles.stage }
									style={ {
										aspectRatio: `${ profile.viewport.width } / ${ profile.viewport.height }`,
									} }
								>
									<img
										src={ frameAt( capture, playheadMs ).src }
										alt={ sprintf(
											/* translators: 1: "Without Boost" or "With Boost", 2: a time such as "1.7s". */
											__( '%1$s, %2$s into loading.', 'jetpack-boost' ),
											variantLabels[ variant ],
											formatMs( playheadMs )
										) }
									/>
								</div>
								<span className={ styles[ 'screen-state' ] }>
									{ isDone
										? sprintf(
												/* translators: %s is a duration such as "4.4s". */
												__( 'Finished at %s', 'jetpack-boost' ),
												formatMs( capture.metrics.load )
										  )
										: __( 'Still loading…', 'jetpack-boost' ) }
								</span>
							</div>
						);
					} ) }
				</div>

				<div className={ styles.transport }>
					<button
						type="button"
						className={ styles[ 'play-button' ] }
						onClick={ togglePlay }
						aria-label={
							isPlaying ? __( 'Pause', 'jetpack-boost' ) : __( 'Play both loads', 'jetpack-boost' )
						}
					>
						{ isPlaying ? <PauseIcon /> : <PlayIcon /> }
					</button>

					<span className={ styles.timecode }>
						{ formatMs( playheadMs ) } <span className={ styles[ 'timecode-total' ] }>/</span>{ ' ' }
						{ formatMs( endMs ) }
					</span>

					<div className={ styles[ 'track-wrap' ] }>
						{ /* Milestones for each run, above and below the track. */ }
						{ VARIANTS.map( variant => (
							<div
								key={ variant }
								className={ variant === 'before' ? styles[ 'pips-above' ] : styles[ 'pips-below' ] }
							>
								{ milestonesFor( profile[ variant ] ).map( milestone => (
									<span
										key={ milestone.key }
										className={ `${ styles.pip } ${ milestone.tone }` }
										style={ { insetInlineStart: `${ ( milestone.atMs / endMs ) * 100 }%` } }
										title={ sprintf(
											/* translators: 1: "Without Boost" or "With Boost", 2: milestone name, 3: a time. */
											__( '%1$s — %2$s at %3$s', 'jetpack-boost' ),
											variantLabels[ variant ],
											milestone.label,
											formatMs( milestone.atMs )
										) }
									/>
								) ) }
							</div>
						) ) }

						<div className={ styles.track } aria-hidden="true">
							<div
								className={ styles[ 'track-fill' ] }
								style={ { inlineSize: `${ progressPercent }%` } }
							/>
						</div>

						<input
							type="range"
							className={ styles.scrubber }
							min={ 0 }
							max={ endMs }
							step={ 10 }
							value={ playheadMs }
							aria-label={ __( 'Scrub through both page loads', 'jetpack-boost' ) }
							onChange={ event => seek( Number( event.target.value ) ) }
						/>
					</div>
				</div>

				<p className={ styles.legend }>
					<span className={ styles[ 'legend-item' ] }>
						<span className={ `${ styles[ 'legend-dot' ] } ${ styles[ 'tone-fcp' ] }` } />
						{ __( 'First paint', 'jetpack-boost' ) }
					</span>
					<span className={ styles[ 'legend-item' ] }>
						<span className={ `${ styles[ 'legend-dot' ] } ${ styles[ 'tone-lcp' ] }` } />
						{ __( 'Largest content', 'jetpack-boost' ) }
					</span>
					<span className={ styles[ 'legend-item' ] }>
						<span className={ `${ styles[ 'legend-dot' ] } ${ styles[ 'tone-load' ] }` } />
						{ __( 'Finished', 'jetpack-boost' ) }
					</span>
					<span className={ styles[ 'legend-note' ] }>
						{ __( 'Marks above the track are without Boost, below are with.', 'jetpack-boost' ) }
					</span>
				</p>
			</div>

			<button
				type="button"
				className={ styles.disclosure }
				aria-expanded={ showFrames }
				onClick={ () => setShowFrames( ! showFrames ) }
			>
				{ showFrames
					? __( 'Hide frame-by-frame', 'jetpack-boost' )
					: __( 'Show frame-by-frame', 'jetpack-boost' ) }
			</button>

			{ showFrames && (
				<div className={ styles.frames }>
					{ VARIANTS.map( variant => {
						const capture = profile[ variant ];
						return (
							<div key={ variant } className={ styles.row }>
								<p className={ styles[ 'row-label' ] }>
									{ variantLabels[ variant ] }
									<span className={ styles[ 'row-metrics' ] }>
										{ sprintf(
											/* translators: 1: time of first paint, 2: time the load finished. */
											__( 'blank until %1$s · finished %2$s', 'jetpack-boost' ),
											formatMs( capture.metrics.fcp ),
											formatMs( capture.metrics.load )
										) }
									</span>
								</p>

								<div className={ styles.strip }>
									{ times.map( time => {
										const isCurrent = Math.abs( time - playheadMs ) < 1;
										return (
											<button
												type="button"
												key={ time }
												className={ isCurrent ? styles[ 'thumb-active' ] : styles.thumb }
												aria-label={ sprintf(
													/* translators: 1: "Without Boost" or "With Boost", 2: a time such as "1.0s". */
													__( 'Jump to %1$s at %2$s', 'jetpack-boost' ),
													variantLabels[ variant ],
													formatMs( time )
												) }
												aria-current={ isCurrent }
												onClick={ () => seek( time ) }
											>
												<span className={ styles[ 'thumb-image' ] }>
													<img src={ frameAt( capture, time ).src } alt="" />
												</span>
											</button>
										);
									} ) }
								</div>
							</div>
						);
					} ) }

					<div className={ styles.axis }>
						{ times.map( time => (
							<span key={ time } className={ styles[ 'axis-tick' ] }>
								{ formatMs( time ) }
							</span>
						) ) }
					</div>
				</div>
			) }

			<p className={ styles.disclaimer }>
				{ sprintf(
					/* translators: %d is a number of runs. */
					__(
						'Prototype: both runs were captured by hand and bundled with the plugin — each is the median of %d runs, captured warm. Boost cannot produce them yet.',
						'jetpack-boost'
					),
					3
				) }
			</p>
		</div>
	);
};

export default LoadingFilmstrip;

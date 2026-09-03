import { Icon } from '@jetpack-premium-analytics/externals';
import { useReducedMotion } from '@wordpress/compose';
import { pages, people, trendingUp } from '@wordpress/icons';
import clsx from 'clsx';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChartArtwork } from './chart-artwork';
import {
	WIDGET_GRID_CANVAS,
	WIDGET_GRID_KEYFRAMES,
	WIDGET_GRID_STATIC_FRAME,
	WIDGET_GRID_TILE_IDS,
	type WidgetGridKeyframe,
	type WidgetGridRect,
	type WidgetGridTileId,
} from './keyframes';
import styles from './widget-grid-animation.module.scss';

const TILE_ICONS: Record< WidgetGridTileId, JSX.Element > = {
	chart: trendingUp,
	people,
	pages,
};

const DEFAULT_HOLD = 1200;
const DEFAULT_DURATION = 600;
const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

export type WidgetGridAnimationProps = {
	/** Played in order, then looping back to the first with the same tween. */
	keyframes?: WidgetGridKeyframe[];

	/** Pause on each frame before the next tween, in ms. A keyframe's own `hold` wins. */
	hold?: number;

	/** Length of each tween, in ms. A keyframe's own `duration` wins. */
	duration?: number;

	/** CSS easing shared by every tween. */
	easing?: string;

	/** Stops the clock on the current frame; the tween into it still finishes. */
	paused?: boolean;

	/** Pins one keyframe with no clock at all, for docs and tests. */
	frame?: number;

	/** The keyframe a reader who prefers reduced motion sees, still. */
	staticFrame?: number;

	className?: string;
};

function chartState(
	id: WidgetGridTileId,
	keyframe: WidgetGridKeyframe
): 'visible' | 'hidden' | undefined {
	if ( id !== 'chart' ) {
		return undefined;
	}

	return keyframe.chart ? 'visible' : 'hidden';
}

function clampIndex( index: number, length: number ): number {
	return Math.min( Math.max( 0, Math.trunc( index ) ), length - 1 );
}

function percent( value: number, total: number ): string {
	return `${ Number( ( ( value / total ) * 100 ).toFixed( 3 ) ) }%`;
}

// Geometry travels as custom properties: the stylesheet maps them onto logical
// insets, so the composition mirrors in RTL and jsdom can read them back.
function tileStyle( rect: WidgetGridRect, duration: number ): CSSProperties {
	return {
		'--wga-x': percent( rect.x, WIDGET_GRID_CANVAS.width ),
		'--wga-y': percent( rect.y, WIDGET_GRID_CANVAS.height ),
		'--wga-width': percent( rect.width, WIDGET_GRID_CANVAS.width ),
		'--wga-height': percent( rect.height, WIDGET_GRID_CANVAS.height ),
		'--wga-duration': `${ duration }ms`,
	} as CSSProperties;
}

/**
 * Three widget tiles that resize, move and swap through a keyframe loop: the
 * dashboard's customization shown rather than described. Every keyframe is
 * data, so the storyboard changes without touching the tweens.
 */
export function WidgetGridAnimation( {
	keyframes = WIDGET_GRID_KEYFRAMES,
	hold = DEFAULT_HOLD,
	duration = DEFAULT_DURATION,
	easing = DEFAULT_EASING,
	paused = false,
	frame,
	staticFrame = WIDGET_GRID_STATIC_FRAME,
	className,
}: WidgetGridAnimationProps ) {
	const reducedMotion = useReducedMotion();
	const [ playhead, setPlayhead ] = useState( 0 );

	// Read through a ref so a consumer rebuilding the array each render does
	// not restart the clock.
	const keyframesRef = useRef( keyframes );
	keyframesRef.current = keyframes;

	const pinned = frame ?? ( reducedMotion ? staticFrame : undefined );
	const isPlaying = pinned === undefined && ! paused && keyframes.length > 1;
	const index = clampIndex( pinned ?? playhead, keyframes.length );
	const keyframe = keyframes[ index ];

	useEffect( () => {
		if ( ! isPlaying ) {
			return;
		}

		// The tween into this frame runs first, then the frame holds.
		const current = keyframesRef.current[ index ];
		const delay = ( current.duration ?? duration ) + ( current.hold ?? hold );
		const timer = setTimeout( () => {
			setPlayhead( ( index + 1 ) % keyframesRef.current.length );
		}, delay );

		return () => clearTimeout( timer );
	}, [ isPlaying, index, hold, duration ] );

	return (
		<div
			className={ clsx( styles.canvas, className ) }
			style={ { '--wga-easing': easing } as CSSProperties }
			data-frame={ index }
			aria-hidden="true"
		>
			{ WIDGET_GRID_TILE_IDS.map( id => (
				<div
					key={ id }
					className={ styles.tile }
					style={ tileStyle( keyframe.tiles[ id ], keyframe.duration ?? duration ) }
					data-tile={ id }
					data-chart={ chartState( id, keyframe ) }
				>
					<Icon icon={ TILE_ICONS[ id ] } size={ 24 } className={ styles.icon } />
					{ id === 'chart' && (
						<ChartArtwork
							className={ clsx( styles.chart, keyframe.chart && styles.chartVisible ) }
						/>
					) }
				</div>
			) ) }
		</div>
	);
}

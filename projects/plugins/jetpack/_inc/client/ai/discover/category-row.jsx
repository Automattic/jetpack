/**
 * One category's skills on a row that pages sideways.
 */

import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { IconButton, Text } from '@wordpress/ui';

/**
 * Whether the track can scroll back or on, in reading order.
 *
 * @param {HTMLElement} track - The scrolling list.
 * @return {{canBack: boolean, canOn: boolean}} Each direction's room.
 */
function measure( track ) {
	// RTL tracks scroll from 0 to negative values.
	const offset = Math.abs( track.scrollLeft );
	const room = track.scrollWidth - track.clientWidth;
	return { canBack: offset > 1, canOn: room - offset > 1 };
}

/**
 * A category's heading and its skill count, over its row or its filtered grid.
 *
 * @param {object} props       - Component props.
 * @param {string} props.title - The category's name.
 * @param {number} props.count - How many skills show.
 * @return {object} Component markup.
 */
export function CategoryHeading( { title, count } ) {
	return (
		<Text render={ <h3 /> } variant="heading-lg" className="jetpack-ai-discover__row-title">
			{ title }
			<span className="jetpack-ai-discover__row-count">{ count }</span>
		</Text>
	);
}

/**
 * A category row.
 *
 * @param {object} props          - Component props.
 * @param {string} props.title    - The category's name.
 * @param {number} props.count    - How many skills it has.
 * @param {object} props.children - The cards.
 * @return {object} Component markup.
 */
export default function CategoryRow( { title, count, children } ) {
	const trackRef = useRef( null );
	const [ room, setRoom ] = useState( { canBack: false, canOn: false } );

	useEffect( () => {
		const track = trackRef.current;
		if ( ! track ) {
			return;
		}
		const update = () =>
			setRoom( current => {
				const next = measure( track );
				const same = next.canBack === current.canBack && next.canOn === current.canOn;
				return same ? current : next;
			} );
		update();
		track.addEventListener( 'scroll', update, { passive: true } );
		const observer = window.ResizeObserver ? new window.ResizeObserver( update ) : null;
		observer?.observe( track );
		return () => {
			track.removeEventListener( 'scroll', update );
			observer?.disconnect();
		};
	}, [] );

	// A page is the track's width, a full set of cards; snapping lands it on one.
	const page = useCallback( step => {
		const track = trackRef.current;
		const direction = isRTL() ? -1 : 1;
		track?.scrollBy( { left: step * direction * track.clientWidth, behavior: 'smooth' } );
	}, [] );
	const back = useCallback( () => page( -1 ), [ page ] );
	const on = useCallback( () => page( 1 ), [ page ] );

	return (
		<div className="jetpack-ai-discover__row">
			<div className="jetpack-ai-discover__row-header">
				<CategoryHeading title={ title } count={ count } />
				<div className="jetpack-ai-discover__row-actions">
					{ ( room.canBack || room.canOn ) && (
						<>
							<IconButton
								icon={ isRTL() ? chevronRight : chevronLeft }
								label={ __( 'Previous', 'jetpack' ) }
								variant="outline"
								tone="neutral"
								size="compact"
								disabled={ ! room.canBack }
								onClick={ back }
							/>
							<IconButton
								icon={ isRTL() ? chevronLeft : chevronRight }
								label={ __( 'Next', 'jetpack' ) }
								variant="outline"
								tone="neutral"
								size="compact"
								disabled={ ! room.canOn }
								onClick={ on }
							/>
						</>
					) }
				</div>
			</div>
			<div className="jetpack-ai-discover__row-track" ref={ trackRef }>
				{ children }
			</div>
		</div>
	);
}

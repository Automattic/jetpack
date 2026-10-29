import clsx from 'clsx';
import styles from './selected-ring.module.scss';

type Tone = 'contrast' | 'focus';

/** Which side of the shape's edge the ring is drawn on. */
export type SelectedRingSide = 'inside' | 'outside';

interface SelectedRingProps {
	/** The chart's id, which keeps the clip path unique on a page with several charts. */
	chartId: string;
	/** The selected shape's path. */
	d: string;
	/** `inside` keeps the ring clear of the SVG edge; `outside` leaves the shape's fill uncovered. */
	side: SelectedRingSide;
	testId?: string;
}

// The tone at the edge is drawn last, over the wider tone beyond it.
const TONES: Record< SelectedRingSide, [ far: Tone, edge: Tone ] > = {
	inside: [ 'contrast', 'focus' ],
	outside: [ 'focus', 'contrast' ],
};

const EVERYWHERE = 'M-1e6 -1e6H1e6V1e6H-1e6Z';

/**
 * Encodes `value` for an SVG id, losslessly so distinct chart ids never share a clip path.
 *
 * @param value - Any string.
 * @return `value` with each character outside `[A-Za-z0-9-]` written as `_<hex code point>_`.
 */
export const toSvgId = ( value: string ) =>
	Array.from( value, character =>
		/[A-Za-z0-9-]/.test( character )
			? character
			: `_${ character.codePointAt( 0 )?.toString( 16 ) }_`
	).join( '' );

/**
 * Marks a selected shape with a focus-colored ring and a contrast ring, so it reads against any fill.
 *
 * @param {SelectedRingProps} props - Component props
 * @return {JSX.Element} The ring
 */
export const SelectedRing = ( { chartId, d, side, testId }: SelectedRingProps ) => {
	const clipId = `selected-ring-clip-${ toSvgId( chartId ) }`;
	const clipPath = `url(#${ clipId })`;
	const [ far, edge ] = TONES[ side ];

	return (
		<g pointerEvents="none" aria-hidden="true">
			<clipPath id={ clipId }>
				{ side === 'inside' ? (
					<path d={ d } />
				) : (
					<path d={ `${ EVERYWHERE } ${ d }` } clipRule="evenodd" />
				) }
			</clipPath>
			<path
				d={ d }
				clipPath={ clipPath }
				className={ clsx( styles[ 'selected-ring__far' ], styles[ `selected-ring__${ far }` ] ) }
			/>
			<path
				d={ d }
				clipPath={ clipPath }
				className={ clsx( styles[ 'selected-ring__edge' ], styles[ `selected-ring__${ edge }` ] ) }
				data-testid={ testId }
			/>
		</g>
	);
};

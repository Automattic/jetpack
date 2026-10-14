import styles from './pie-keyboard-navigation.module.scss';

interface SelectedSegmentRingProps {
	/** The chart's id, which keeps the clip path unique on a page with several charts. */
	chartId: string;
	/** The selected segment's path, from the same arc generator that draws the segment. */
	d: string;
}

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
 * Marks the selected segment with a two-tone ring drawn inside its edge, so the SVG edge cannot cut it off.
 *
 * @param {SelectedSegmentRingProps} props - Component props
 * @return {JSX.Element} The ring
 */
export const SelectedSegmentRing = ( { chartId, d }: SelectedSegmentRingProps ) => {
	const clipId = `pie-selected-ring-clip-${ toSvgId( chartId ) }`;
	const clipPath = `url(#${ clipId })`;

	return (
		<g pointerEvents="none" aria-hidden="true">
			<clipPath id={ clipId }>
				<path d={ d } />
			</clipPath>
			<path d={ d } clipPath={ clipPath } className={ styles[ 'selected-ring__contrast' ] } />
			<path
				d={ d }
				clipPath={ clipPath }
				className={ styles[ 'selected-ring__focus' ] }
				data-testid="pie-selected-ring"
			/>
		</g>
	);
};

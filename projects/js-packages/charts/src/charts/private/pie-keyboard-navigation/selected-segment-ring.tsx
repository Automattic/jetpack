import styles from './pie-keyboard-navigation.module.scss';

interface SelectedSegmentRingProps {
	/** The chart's id, which keeps the clip path unique on a page with several charts. */
	chartId: string;
	/** The selected segment's path, from the same arc generator that draws the segment. */
	d: string;
}

const toSvgId = ( value: string ) => value.replace( /[^\w-]/g, '-' );

/**
 * Marks the selected segment with a two-tone ring drawn inside its edge, so neither the SVG edge nor the radial-wipe mask can cut it off.
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

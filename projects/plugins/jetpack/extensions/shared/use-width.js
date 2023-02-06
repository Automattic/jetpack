import { useEffect, useRef } from '@wordpress/element';

const usePrevious = value => {
	const ref = useRef();

	useEffect( () => {
		ref.current = value;
	}, [ value ] );

	return ref.current;
};

export default function useWidth( { attributes, disableEffects = false, setAttributes } ) {
	const { align, width } = attributes;

	const previousAlign = usePrevious( align );

	// Reset width if switching to left or right (floated) alignment for first time.
	useEffect( () => {
		if ( disableEffects ) {
			return;
		}

		const alignmentChanged = previousAlign !== align;
		const isAlignedLeftRight = align === 'left' || align === 'right';

		if ( alignmentChanged && isAlignedLeftRight && width?.includes( '%' ) ) {
			setAttributes( { width: undefined } );
		}
	}, [ align, disableEffects, previousAlign, setAttributes, width ] );
}

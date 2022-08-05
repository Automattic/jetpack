import { useEffect, useRef } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';

const usePrevious = value => {
	const ref = useRef();

	useEffect( () => {
		ref.current = value;
	}, [ value ] );

	return ref.current;
};

export default function useWidth( {
	attributes,
	clientId,
	context = {},
	hasWidthSupport = true,
	setAttributes,
} ) {
	const { align, width: childBlockWidth } = attributes;
	const isWidthSetOnParentBlock = 'jetpack/parentBlockWidth' in context;
	const width = isWidthSetOnParentBlock ? context[ 'jetpack/parentBlockWidth' ] : childBlockWidth;

	const previousAlign = usePrevious( align );

	// Reset width if switching to left or right (floated) alignment for first time.
	useEffect( () => {
		if ( ! hasWidthSupport || isWidthSetOnParentBlock ) {
			return;
		}

		const alignmentChanged = previousAlign !== align;
		const isAlignedLeftRight = align === 'left' || align === 'right';

		if ( alignmentChanged && isAlignedLeftRight && width?.includes( '%' ) ) {
			setAttributes( { width: undefined } );
		}
	}, [ align, hasWidthSupport, isWidthSetOnParentBlock, previousAlign, setAttributes, width ] );


	// Migrate width of existing child blocks to parent blocks.
	useEffect( () => {
		if ( ! isWidthSetOnParentBlock || ! childBlockWidth ) {
			return;
		}

		/*
		 * This effect runs during the first render of a block before giving any chance to hook into the action, so we
		 * deliberately delay its trigger as a workaround.
		 */
		setTimeout( () => {
			doAction( 'jetpack.useWidth.setWidth', newWidth, clientId );
		}, 0 );
		setAttributes( { width: undefined } );
	}, [ childBlockWidth, isWidthSetOnParentBlock, setWidth ] );
}

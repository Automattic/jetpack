import { useCallback, useEffect, useRef } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';
import { WidthPanel } from './controls';

const usePrevious = value => {
	const ref = useRef();

	useEffect( () => {
		ref.current = value;
	}, [ value ] );

	return ref.current;
};

export default function useWidth( { attributes, clientId, context = {}, setAttributes } ) {
	const { align, width: childBlockWidth } = attributes;
	const isWidthSetOnParentBlock = 'jetpack/parentBlockWidth' in context;
	const width = isWidthSetOnParentBlock ? context[ 'jetpack/parentBlockWidth' ] : childBlockWidth;

	const previousAlign = usePrevious( align );

	// Reset width if switching to left or right (floated) alignment for first time.
	useEffect( () => {
		if ( isWidthSetOnParentBlock ) {
			return;
		}

		const alignmentChanged = previousAlign !== align;
		const isAlignedLeftRight = align === 'left' || align === 'right';

		if ( alignmentChanged && isAlignedLeftRight && width?.includes( '%' ) ) {
			setAttributes( { width: undefined } );
		}
	}, [ align, isWidthSetOnParentBlock, previousAlign, setAttributes, width ] );

	const setWidth = useCallback(
		newWidth => {
			if ( isWidthSetOnParentBlock ) {
				doAction( 'jetpack.useWidth.setWidth', newWidth, clientId );
				setAttributes( { width: undefined } );
				return;
			}

			setAttributes( { width: newWidth } );
		},
		[ clientId, isWidthSetOnParentBlock, setAttributes ]
	);

	// Migrate width of existing child blocks to parent blocks.
	useEffect( () => {
		if ( ! isWidthSetOnParentBlock || ! childBlockWidth ) {
			return;
		}

		setWidth( childBlockWidth );
	}, [ childBlockWidth, isWidthSetOnParentBlock, setWidth ] );

	const WidthSettings = () => <WidthPanel align={ align } width={ width } onChange={ setWidth } />;

	return { WidthSettings };
}

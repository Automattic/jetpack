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
				/*
				 * There are cases where we trigger this action during the first render of a block
				 * (e.g. like in the effect a few lines below) before giving any chance to hook into
				 * it, so we deliberately delay the action as a workaround.
				 */
				setTimeout( () => {
					doAction( 'jetpack.useWidth.setWidth', newWidth, clientId );
				}, 0 );
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

import { offset, useFloating } from '@floating-ui/react-dom';
import { useEffect } from '@wordpress/element';
import clsx from 'clsx';
import { LiveResizeConfiguration, createLiveResizeAutoUpdate } from '../utils/live-resize';
import Overlay from './tour-kit-overlay';
import {
	SpotlightInteractivity,
	SpotlightInteractivityConfiguration,
} from './tour-kit-spotlight-interactivity';
import type { CSSProperties, FunctionComponent, HTMLAttributes } from 'react';

export const SPOTLIT_ELEMENT_CLASS = 'wp-tour-kit-spotlit';
interface Props {
	referenceElement: HTMLElement | null;
	styles?: CSSProperties;
	interactivity?: SpotlightInteractivityConfiguration;
	liveResize?: LiveResizeConfiguration;
}

const TourKitSpotlight: FunctionComponent< Props > = ( {
	referenceElement,
	styles,
	interactivity,
	liveResize,
} ) => {
	const referenceRect = referenceElement?.getBoundingClientRect();

	const { refs, floatingStyles } = useFloating( {
		strategy: 'fixed',
		placement: 'bottom',
		elements: { reference: referenceElement },
		whileElementsMounted: createLiveResizeAutoUpdate( liveResize ),
		// `flip` and overflow prevention are intentionally omitted so the spotlight always stays
		// clipped over its reference element. The offset pulls the floating element back over the
		// reference so the clip box overlaps it exactly.
		middleware: [
			offset( ( { rects, placement } ) => {
				if ( placement === 'bottom' ) {
					return -(
						rects.reference.height +
						( rects.floating.height - rects.reference.height ) / 2
					);
				}
				return 0;
			} ),
		],
	} );

	const clipDimensions = referenceRect
		? {
				width: `${ referenceRect.width }px`,
				height: `${ referenceRect.height }px`,
		  }
		: null;

	// Apply the clip dimensions (and floating styles) as soon as there's a reference element, before
	// the first positioning pass. Floating UI positions in a layout effect, so the spotlight is
	// placed before paint; more importantly, the offset above reads `rects.floating.height`, which
	// must already equal the reference height when it's first measured. Gating this on positioning
	// would leave the empty div at height 0 on first measure, parking the spotlight mid-target.
	const clipRepositionProps = referenceElement
		? {
				style: {
					...( clipDimensions && clipDimensions ),
					...floatingStyles,
					...( styles && styles ),
				},
		  }
		: null;

	/**
	 * Add a .wp-spotlit class to the referenced element so that we can
	 * apply CSS styles to it, for whatever purposes such as interactivity
	 */
	useEffect( () => {
		referenceElement?.classList.add( SPOTLIT_ELEMENT_CLASS );
		return () => {
			referenceElement?.classList.remove( SPOTLIT_ELEMENT_CLASS );
		};
	}, [ referenceElement ] );

	return (
		<>
			<SpotlightInteractivity { ...interactivity } />
			<Overlay visible={ ! clipRepositionProps } />
			<div
				className={ clsx( 'tour-kit-spotlight', {
					'is-visible': !! clipRepositionProps,
				} ) }
				ref={ refs.setFloating }
				{ ...( clipRepositionProps as HTMLAttributes< HTMLDivElement > ) }
			/>
		</>
	);
};

export default TourKitSpotlight;

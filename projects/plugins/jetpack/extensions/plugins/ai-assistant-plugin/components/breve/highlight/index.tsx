/**
 * External dependencies
 */
import { Popover } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useLayoutEffect, useRef } from '@wordpress/element';
import { registerFormatType } from '@wordpress/rich-text';
/**
 * Internal dependencies
 */
import BREVE_FEATURES from '../features';
import './style.scss';

// Setup the Breve highlights
export default function Highlight() {
	const debounce = useRef( null );
	const { setBlockHighlight, setPopoverHover } = useDispatch( 'jetpack/ai-breve' );

	const blocks = useSelect(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		select => ( select( 'core/block-editor' ) as any ).getBlocks(),
		[]
	);

	const popoverOpen = useSelect( select => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const store = select( 'jetpack/ai-breve' ) as any;
		const isPopoverHover = store.isPopoverHover();
		const isHighlightHover = store.isHighlightHover();
		return isHighlightHover || isPopoverHover;
	}, [] );

	const anchor = useSelect( select => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return ( select( 'jetpack/ai-breve' ) as any ).getPopoverAnchor();
	}, [] );

	const isPopoverOpen = popoverOpen && anchor;

	const handleMouseEnter = () => {
		setPopoverHover( true );
	};

	const handleMouseLeave = () => {
		setPopoverHover( false );
	};

	useLayoutEffect( () => {
		if ( blocks?.length > 0 ) {
			// Debounce the block content update
			clearTimeout( debounce.current );
			debounce.current = setTimeout( () => {
				blocks.forEach( block => {
					setBlockHighlight( block );
				} );
			}, 1000 );
		}
	}, [ blocks, setBlockHighlight ] );

	return (
		<>
			{ isPopoverOpen && (
				<Popover
					anchor={ anchor }
					placement="bottom"
					offset={ -3 }
					className="highlight-popover"
					variant="tooltip"
					animate={ false }
					focusOnMount={ false }
					onMouseEnter={ handleMouseEnter }
					onMouseLeave={ handleMouseLeave }
				>
					<div>Popover</div>
				</Popover>
			) }
		</>
	);
}

export function registerBreveHighlights() {
	BREVE_FEATURES.forEach( ( { config } ) => {
		const { name, ...settings } = config;
		registerFormatType( `jetpack/ai-proofread-${ name }`, settings as never );
	} );
}

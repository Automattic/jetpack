/**
 * External dependencies
 */
import { Popover } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useLayoutEffect } from '@wordpress/element';
import { registerFormatType } from '@wordpress/rich-text';
/**
 * Internal dependencies
 */
import BREVE_FEATURES from '../features';
import './style.scss';
import getContainer from '../features/container';

// Setup the Breve highlights
export default function Highlight() {
	const { setBlockContent } = useDispatch( 'jetpack/ai-breve' );

	const { foundContainer: container } = getContainer();
	const anchor = container?.querySelector?.( `[data-ai-breve-anchor]` );

	const postContent = useSelect( select => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const all = ( select( 'core/editor' ) as any ).getEditorBlocks();
		const richValues = all.filter( block => block.name === 'core/paragraph' );
		return richValues;
	}, [] );

	const popoverOpen = useSelect(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		select => ( select( 'jetpack/ai-breve' ) as any ).isPopoverOpen(),
		[]
	);

	useLayoutEffect( () => {
		if ( postContent ) {
			postContent.forEach( block => {
				setBlockContent( block );
			} );
		}
	}, [ postContent, setBlockContent ] );

	return (
		<>
			{ popoverOpen && anchor && (
				<Popover
					anchor={ anchor }
					placement="bottom"
					offset={ -3 }
					className="highlight-popover"
					variant="tooltip"
					animate={ false }
					focusOnMount={ false }
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

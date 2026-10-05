/**
 * PayPal Payment Buttons — The block card the account header takes over.
 *
 * @package
 */

import { useEffect, useState } from '@wordpress/element';

// Core's card for the selected block. The is-parent card belongs to an enclosing block.
const BLOCK_CARD_SELECTOR =
	'.block-editor-block-inspector > .block-editor-block-card:not(.is-parent)';

/**
 * Follow core's block card for the selected block.
 *
 * The card comes and goes with the sidebar and is rebuilt on each selection
 * change, none of which re-renders a block, so a MutationObserver watches for it.
 * The query is document-wide, so only the selected block goes looking.
 *
 * @param {boolean} isSelected - Whether this block is the selected one.
 * @return {HTMLElement|null} The card, once the sidebar has one for this block.
 */
export function useBlockCardNode( isSelected ) {
	const [ node, setNode ] = useState( null );

	useEffect( () => {
		if ( ! isSelected ) {
			setNode( null );
			return;
		}

		// Most mutations are somebody else's, so compare before setting state.
		const findCard = () => {
			const found = document.querySelector( BLOCK_CARD_SELECTOR );
			setNode( current => ( current === found ? current : found ) );
		};

		findCard();

		const observer = new window.MutationObserver( findCard );
		observer.observe( document.body, { childList: true, subtree: true } );

		return () => observer.disconnect();
	}, [ isSelected ] );

	return node;
}

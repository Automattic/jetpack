/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';

export const showAiAssistantSection = async () => {
	const { clearSelectedBlock } = dispatch( 'core/block-editor' );
	const { enableComplementaryArea } = dispatch( 'core/interface' ) as {
		enableComplementaryArea: ( area: string, slot: string ) => Promise< void >;
	};

	// Clear any block selection, because selected blocks have precedence on settings sidebar
	clearSelectedBlock();
	await enableComplementaryArea( 'core/edit-post', 'jetpack-sidebar/jetpack' );

	const panel = document.querySelector( '.jetpack-ai-assistant-panel' );
	const isAlreadyOpen = panel?.classList.contains( 'is-opened' );
	const button: HTMLElement | null | undefined = panel?.querySelector( 'h2 button' );

	if ( isAlreadyOpen ) {
		// Close it before opening it to ensure the content is scrolled to view
		button?.click();
	}

	setTimeout( () => {
		button?.click();
	}, 50 );
};

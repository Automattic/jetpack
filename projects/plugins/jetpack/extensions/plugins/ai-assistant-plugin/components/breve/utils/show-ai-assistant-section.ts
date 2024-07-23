/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export const showAiAssistantSection = async () => {
	const { clearSelectedBlock } = dispatch( 'core/block-editor' );
	const { enableComplementaryArea } = dispatch( 'core/interface' ) as {
		enableComplementaryArea: ( area: string, slot: string ) => Promise< void >;
	};

	// Clear any block selection, because selected blocks have precedence on settings sidebar
	clearSelectedBlock();
	await enableComplementaryArea( 'core/edit-post', 'edit-post/document' );

	const sections: Array< HTMLElement > = Array.from(
		document.querySelectorAll( '.components-panel__body' )
	);

	const aISection = sections.find(
		section => section?.innerText === __( 'AI Assistant', 'jetpack' )
	);

	if ( aISection ) {
		const button = aISection.querySelector( 'button' );
		button?.click();
	}
};

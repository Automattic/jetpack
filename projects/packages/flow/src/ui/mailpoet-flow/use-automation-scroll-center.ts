import { type RefObject, useEffect, useState } from 'react';

export const useAutomationScrollCenter = ( automationRef: RefObject< HTMLDivElement | null > ) => {
	// We need to trigger one more render to center the scroll, because the sidebar
	// is using a React Portal, and it is not in the layout after the first render.
	const [ rendered, setRendered ] = useState( false );

	useEffect( () => {
		// first render
		if ( ! rendered ) {
			setRendered( true );
			return;
		}

		// center the scroll to the first step
		const automation = automationRef.current;
		const firstStep = automation?.querySelector( '.mailpoet-automation-editor-step' );
		if ( firstStep instanceof HTMLElement ) {
			firstStep.scrollIntoView( { block: 'nearest', inline: 'center' } );
		}
	}, [ automationRef, rendered ] );
};

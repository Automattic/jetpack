import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Step, CompletionStepHookProps } from './types';

export const useCompletionStep = ( { addMessage, steps }: CompletionStepHookProps ): Step => {
	const getSummaryCheck = useCallback( () => {
		const summaryString = steps
			.map( step => {
				const stepLabel = step.label || step.title;
				return step.completed ? `✅ ${ stepLabel }` : `❌ ${ stepLabel }`;
			} )
			.join( '<br />' );
		return createInterpolateElement( summaryString, { br: <br /> } );
	}, [ steps ] );

	const handleStart = useCallback( async () => {
		// await new Promise( resolve => setTimeout( () => resolve( 'done' ), 1000 ) );
		const summary = getSummaryCheck();
		// these were put here because handleNext wouldn't give enough time to update the completed state
		addMessage( { content: summary, showIcon: false } );
		addMessage( {
			content: createInterpolateElement(
				__(
					'SEO optimization complete! 🎉<br/>Your blog post is now search-engine friendly.',
					'jetpack'
				),
				{ br: <br /> }
			),
			showIcon: true,
		} );
		addMessage( {
			content: __( 'Happy blogging! 😊', 'jetpack' ),
			showIcon: false,
		} );
	}, [ addMessage, getSummaryCheck ] );

	return {
		id: 'completion',
		title: __( 'Your post is SEO-ready', 'jetpack' ),
		// onStart: handleSummaryChecks,
		messages: [
			{
				content: __( "Here's your updated checklist:", 'jetpack' ),
				showIcon: true,
			},
			{
				content: getSummaryCheck(),
				showIcon: false,
			},
			{
				content: createInterpolateElement(
					__(
						'SEO optimization complete! 🎉<br/>Your blog post is now search-engine friendly.',
						'jetpack'
					),
					{ br: <br /> }
				),
				showIcon: true,
			},
			{
				content: __( 'Happy blogging! 😊', 'jetpack' ),
				showIcon: false,
			},
		],
		type: 'completion',
		onStart: handleStart,
		value: null,
		setValue: () => null,
	};
};

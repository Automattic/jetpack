import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Step, CompletionStepHookProps } from './types';

export const useCompletionStep = ( { steps }: CompletionStepHookProps ): Step => {
	const getSummaryCheck = useCallback( () => {
		const summaryString = steps
			.map( step => {
				const stepLabel = step.label || step.title;
				return step.completed ? `✅ ${ stepLabel }` : `❌ ${ stepLabel }`;
			} )
			.join( '<br />' );
		return createInterpolateElement( summaryString, { br: <br /> } );
	}, [ steps ] );

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
		// onStart: handleStart,
		value: null,
		setValue: () => null,
	};
};

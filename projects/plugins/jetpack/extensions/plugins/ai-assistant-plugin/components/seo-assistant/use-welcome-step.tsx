/*
 * External dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/*
 * Types
 */
import type { Step } from './types';

export const useWelcomeStep = ( { stepLabels }: { stepLabels: string[] } ): Step => {
	const stepsWithOrdinal = stepLabels
		.map( ( label, index ) => {
			const ordinal = index + 1;
			return `${ ordinal }. ${ label }`;
		} )
		.join( '<br />' );

	return {
		id: 'welcome',
		title: __( 'Improve SEO', 'jetpack' ),
		label: 'welcome',
		type: 'welcome',
		messages: [
			{
				content: createInterpolateElement(
					__( "<b>Hi there! 👋 Let's make your blog post SEO-friendly.</b>", 'jetpack' ),
					{ b: <b /> }
				),
				showIcon: true,
				id: '1',
			},
			{
				content: createInterpolateElement(
					__( "Here's what we can improve:", 'jetpack' ) + '<br />' + stepsWithOrdinal,
					{ br: <br /> }
				),
				showIcon: false,
				id: '2',
			},
		],
		autoAdvance: 1500,
	};
};

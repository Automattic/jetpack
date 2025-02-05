import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Step } from './types';

export const useWelcomeStep = (): Step => {
	return {
		id: 'welcome',
		title: __( 'Optimise for SEO', 'jetpack' ),
		label: 'welcome',
		type: 'welcome',
		messages: [
			{
				content: createInterpolateElement(
					__( "<b>Hi there! 👋 Let's optimise your blog post for SEO.</b>", 'jetpack' ),
					{ b: <b /> }
				),
				showIcon: true,
				id: '1',
			},
			{
				content: createInterpolateElement(
					__( "Here's what we can improve:<br />1. Title<br />2. Meta description", 'jetpack' ),
					{ br: <br /> }
				),
				showIcon: false,
				id: '2',
			},
		],
		autoAdvance: 1500,
	};
};

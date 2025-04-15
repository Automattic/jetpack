/*
 * External Dependencies
 */
import { action } from '@storybook/addon-actions';
import React from 'react';
/*
 * Internal Dependencies
 */
import AiModalFooter from '../index.tsx';

export default {
	title: 'JS Packages/AI Client/AiModalFooter',
	component: AiModalFooter,
	decorators: [
		Story => (
			<div style={ { display: 'flex', justifyContent: 'space-between' } }>
				<Story />
			</div>
		),
	],
};

const DefaultTemplate = () => {
	return (
		<AiModalFooter
			onGuidelinesClick={ action( 'onGuidelinesClick' ) }
			onFeedbackClick={ action( 'onFeedbackClick' ) }
		/>
	);
};

export const Default = DefaultTemplate.bind( {} );

import type { Meta } from '@storybook/react';
import React from 'react';
import { VanillaPopOut } from '../pop-out';

const meta: Meta< typeof VanillaPopOut > = {
	title: 'Plugins/Boost/Features/Speed Score/Vanilla PopOut',
	component: VanillaPopOut,
	argTypes: {
		message: { control: 'object' },
		onClose: { action: 'onClose' },
		onDismiss: { action: 'onDismiss' },
		isVisible: { control: 'boolean' },
	},
	decorators: [
		Story => (
			<div style={ { maxWidth: '800px', minHeight: '600px', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
};

const defaultValues = {
	isVisible: true,
	message: {
		id: 'score_decrease',
		title: 'Speed score has fallen',
		body: (
			<>
				<p>
					Most of the time Jetpack Boost will increase your site speed, but there may be cases where your score does not increase.
				</p>
				<p>
					Try refreshing your score, and if it doesn’t help, check our guide on improving your site speed score:
				</p>
			</>
		),
		cta: 'Read the guide',
		ctaLink: 'https://example.com',
	},
	onClose: () => {
		defaultValues.isVisible = false;
	},
	onDismiss: () => {
		defaultValues.isVisible = false;
	},
};

export default meta;
const Template = args => {
	return <VanillaPopOut { ...args } />;
};
export const _default = Template.bind( {} );
_default.args = defaultValues;


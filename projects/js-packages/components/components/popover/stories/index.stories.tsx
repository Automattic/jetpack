import Button from '../../button';
import { CheckmarkIcon } from '../../icons';
import Popover from '../index';
import type { Meta } from '@storybook/react';

const meta: Meta< typeof Popover > = {
	title: 'JS Packages/Components/Popover',
	component: Popover,
	argTypes: {
		icon: { control: 'object' },
		action: { control: 'object' },
	},
	decorators: [
		Story => (
			<div style={ { width: '600px', maxWidth: '90%', height: '600px', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
};

export default meta;

const Template = args => {
	return (
		<Popover { ...args }>
			<p>
				This is line is just longer and in another paragraph.
				<br />
				This is the message.
			</p>
		</Popover>
	);
};
export const _default = Template.bind( {} );
_default.args = {
	icon: <CheckmarkIcon />,
	action: <Button>Click me</Button>,
};

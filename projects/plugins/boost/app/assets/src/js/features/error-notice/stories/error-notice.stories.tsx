import ErrorNotice from '../error-notice';
import type { Meta } from '@storybook/react';
import React from 'react';
import {Button} from '@automattic/jetpack-components'

const meta: Meta< typeof ErrorNotice > = {
	title: 'Plugins/Boost/ErrorNotice',
	component: ErrorNotice,
	argTypes: {
		title: { control: 'text' },
		error: { control: 'text' },
		variant: { control: 'select', options: [ 'normal', 'module' ] },
		data: { control: 'text' },
		description: { control: 'text' },
		suggestion: { control: 'text' },
	},
	decorators: [
		Story => (
			<div style={ { maxWidth: '1320px', padding: '0 100px', margin: '200px auto', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
};

const Template = args => <ErrorNotice { ...args } />;
export const _default = Template.bind( {} );
_default.args = {
	title: 'Error',
	error: 'This is an error message',
	variant: 'normal',
	data: "{\n\t\"errorData\": \"This is some more error data\"\n}",
	description: 'This is error description ErrorNotice is wrapping.',
	suggestion: 'Contact <support>support</support> for help.',
	vars: {
		support: <a href="#support" />,
		link: <a href="#link" />,
	},
	actionButton: <Button variant="secondary">
		Contact Support
	</Button>,
};
export default meta;

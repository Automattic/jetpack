/* istanbul ignore file -- Ignore code coverage */
import { useCallback, useState } from '@wordpress/element';
import MessageBoxControl, { MessageBoxControlProps } from '../';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Publicize Components/Message Box Control',
	component: MessageBoxControl,
	argTypes: {
		onChange: { action: 'changed' },
		maxLength: {
			control: { type: 'number', min: 10, max: 500 },
		},
		disabled: {
			control: 'boolean',
		},
		analyticsData: {
			control: 'object',
		},
		label: {
			control: 'text',
		},
		placeholder: {
			control: 'text',
		},
	},
} satisfies Meta< typeof MessageBoxControl >;

const Template: StoryFn< typeof MessageBoxControl > = ( args: MessageBoxControlProps ) => {
	const [ message, setMessage ] = useState( args.message );

	const handleChange = useCallback(
		( newMessage: string ) => {
			setMessage( newMessage );
			args.onChange( newMessage );
		},
		[ args ]
	);

	return (
		<MessageBoxControl
			message={ message }
			onChange={ handleChange }
			disabled={ args.disabled }
			maxLength={ args.maxLength }
			analyticsData={ args.analyticsData }
			label={ args.label }
			placeholder={ args.placeholder }
		/>
	);
};

const DefaultArgs = {
	message: 'Check out my latest blog post!',
	maxLength: 280,
	disabled: false,
	analyticsData: { location: 'storybook' },
};

// Export Default story
export const Default = Template.bind( {} );
Default.args = DefaultArgs;

// Empty state
export const Empty = Template.bind( {} );
Empty.args = {
	...DefaultArgs,
	message: '',
};

// Disabled state
export const Disabled = Template.bind( {} );
Disabled.args = {
	...DefaultArgs,
	disabled: true,
};

// Custom Label and Placeholder
export const CustomLabels = Template.bind( {} );
CustomLabels.args = {
	...DefaultArgs,
	message: '',
	label: 'Custom Social Message',
	placeholder: 'Type your personalized social media post here...',
};

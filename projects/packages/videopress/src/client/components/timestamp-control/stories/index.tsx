/**
 * Internal dependencies
 */
import TimestampControl from '..';
import Doc from './TimestampControl.mdx';
/**
 * Types
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Timestamp Control',
	component: TimestampControl,
	parameters: {
		docs: {
			page: Doc,
		},
	},
} as ComponentMeta< typeof TimestampControl >;

const Template: ComponentStory< typeof TimestampControl > = args => {
	return <TimestampControl { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = {
	label: 'Video frame',
	help: 'Use the control to set timestamp of the video frame.',
	max: 3600 * 1000 * 2, // 2 hours
	value: 236 * 1000 + 125, // 3:56.125
	wait: 100,
	decimalPlaces: undefined,
	fineAdjustment: 50,
	disabled: false,
	autoHideTimeInput: true,
	onChange: ( newTime: number ) => {
		console.log( { newTime } ); // eslint-disable-line no-console
	},
	onDebounceChange: ( newDebouncedTime: number ) => {
		console.log( { newDebouncedTime } ); // eslint-disable-line no-console
	},
};

_default.storyName = 'Timestamp Control';

export const decimalPlaces = Template.bind( {} );
decimalPlaces.args = {
	value: 3500, // 3.5 seconds
	max: 1000 * 5, // five seconds
	decimalPlaces: 2,
};

// disabled story
export const disabled = Template.bind( {} );
disabled.args = {
	max: 3600 * 1000 * 2, // 2 hours
	value: 3600 * 1000 + 15 * 60 * 1000 + 43 * 1000, // 1.5 hours
	disabled: true,
};

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
	max: 3600 * 1000 * 2, // 2 hours
	value: 236 * 1000, // 3:56
	onChange: ( newTime: number ) => {
		console.log( { newTime } ); // eslint-disable-line no-console
	},
};

_default.storyName = 'Timestamp Control';

import { WIDGET_GRID_KEYFRAMES } from '../keyframes';
import { WidgetGridAnimation } from '../widget-grid-animation';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof WidgetGridAnimation > = {
	title: 'Packages/Premium Analytics/UI/WidgetGridAnimation',
	component: WidgetGridAnimation,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The looping illustration at the top of the onboarding welcome modal: ' +
					'three widget tiles resize, move and swap to show what the dashboard ' +
					'lets a reader do, and the chart appears as its tile grows.\n\n' +
					'Every keyframe is data (`keyframes`), taken from the Figma ' +
					'"animation flow" frames. The component tweens between them: ' +
					'`hold` is the pause on each frame, `duration` the length of each ' +
					'tween, and either can be overridden per keyframe. Readers who ' +
					'prefer reduced motion get `staticFrame`, still.',
			},
		},
	},
	argTypes: {
		keyframes: { control: false },
		className: { control: false },
		frame: {
			control: { type: 'number', min: 0, max: WIDGET_GRID_KEYFRAMES.length - 1, step: 1 },
		},
		staticFrame: {
			control: { type: 'number', min: 0, max: WIDGET_GRID_KEYFRAMES.length - 1, step: 1 },
		},
	},
	decorators: [
		Story => (
			// The modal's width, with the same rounded top corners.
			<div style={ { width: 400, borderRadius: '8px 8px 0 0', overflow: 'hidden' } }>
				<Story />
			</div>
		),
	],
};
export default meta;

type Story = StoryObj< typeof WidgetGridAnimation >;

export const Default: Story = {};

export const SlowMotion: Story = {
	name: 'Slow motion',
	args: {
		hold: 2000,
		duration: 1500,
	},
};

export const Pinned: Story = {
	name: 'Pinned to a keyframe',
	args: {
		frame: 4,
	},
};

export const Paused: Story = {
	args: {
		paused: true,
	},
};

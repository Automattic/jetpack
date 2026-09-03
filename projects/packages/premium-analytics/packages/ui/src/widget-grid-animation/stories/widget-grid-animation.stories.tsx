import { Button, Stack, Text } from '@jetpack-premium-analytics/externals';
import { useState } from 'react';
import { WIDGET_GRID_KEYFRAME_CAPTIONS, WIDGET_GRID_KEYFRAMES } from '../keyframes';
import { WidgetGridAnimation } from '../widget-grid-animation';
import type { Meta, StoryObj } from '@storybook/react';

const LAST_FRAME = WIDGET_GRID_KEYFRAMES.length - 1;

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
			control: { type: 'number', min: 0, max: LAST_FRAME, step: 1 },
		},
		staticFrame: {
			control: { type: 'number', min: 0, max: LAST_FRAME, step: 1 },
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

/**
 * The loop as the modal plays it: each keyframe holds for 1.2 s, each tween
 * takes 600 ms, and the last keyframe tweens back into the first. Reload the
 * story to watch it from the collapsed start.
 */
export const Default: Story = {};

/**
 * The same loop slowed down, to follow how a tile grows, moves or swaps and
 * how the chart wipes in with its tile. The tween runs at `duration`, so
 * raising it is what stretches the motion; `hold` only lengthens the pauses.
 */
export const SlowMotion: Story = {
	name: 'Slow motion',
	args: {
		hold: 2000,
		duration: 1500,
	},
};

/**
 * One keyframe, no clock. Change the `frame` control to jump to any of the
 * eleven keyframes: the tween into the chosen one still plays, so this also
 * previews a single transition on its own.
 */
export const Pinned: Story = {
	name: 'Pinned to a keyframe',
	args: {
		frame: 4,
	},
};

/**
 * The clock stopped on the first keyframe. Turn `paused` off in the controls
 * to resume from there; the loop picks up where it stopped rather than
 * starting over.
 */
export const Paused: Story = {
	args: {
		paused: true,
	},
};

function KeyframeStepper() {
	const [ frame, setFrame ] = useState( 0 );

	return (
		<Stack direction="column" gap="md">
			<WidgetGridAnimation frame={ frame } />
			<Stack direction="row" align="center" justify="space-between" gap="sm">
				<Button
					variant="outline"
					tone="neutral"
					disabled={ frame === 0 }
					onClick={ () => setFrame( frame - 1 ) }
				>
					Previous
				</Button>
				<Text variant="body-md">
					Keyframe { frame + 1 } of { WIDGET_GRID_KEYFRAMES.length }
				</Text>
				<Button
					variant="outline"
					tone="neutral"
					disabled={ frame === LAST_FRAME }
					onClick={ () => setFrame( frame + 1 ) }
				>
					Next
				</Button>
			</Stack>
			<Text variant="body-md">{ WIDGET_GRID_KEYFRAME_CAPTIONS[ frame ] }</Text>
		</Stack>
	);
}

/**
 * Walk the storyboard one keyframe at a time. Each step plays the tween into
 * the next keyframe and shows what that keyframe changes, so a single
 * transition can be checked against its Figma frame.
 */
export const StepThrough: Story = {
	name: 'Step through keyframes',
	parameters: {
		controls: { disable: true },
	},
	render: () => <KeyframeStepper />,
};

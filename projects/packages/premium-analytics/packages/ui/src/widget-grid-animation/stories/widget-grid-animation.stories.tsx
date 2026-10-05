import { Button, Stack, Text } from '@jetpack-premium-analytics/externals';
import { useState } from 'react';
import { WIDGET_GRID_KEYFRAME_CAPTIONS, WIDGET_GRID_KEYFRAMES } from '../keyframes';
import { WidgetGridAnimation } from '../widget-grid-animation';
import type { Meta, StoryObj } from '@storybook/react';

const LAST_FRAME = WIDGET_GRID_KEYFRAMES.length - 1;

// The WPDS motion curves, plus `linear` to see the raw keyframes.
const EASINGS: Record< string, string > = {
	balanced: 'var(--wpds-motion-easing-balanced)',
	expressive: 'var(--wpds-motion-easing-expressive)',
	subtle: 'var(--wpds-motion-easing-subtle)',
	linear: 'linear',
};

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
					'lets a reader do. Each tile fills the room it gains: the chart wipes ' +
					'in, list rows fade in, and the tall tile gets a donut placeholder.\n\n' +
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
		hold: {
			control: { type: 'range', min: 0, max: 5000, step: 100 },
		},
		duration: {
			control: { type: 'range', min: 0, max: 3000, step: 50 },
		},
		easing: {
			control: 'select',
			options: Object.keys( EASINGS ),
			mapping: EASINGS,
		},
		paused: {
			control: 'boolean',
		},
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
			<div
				style={ {
					width: 400,
					borderRadius: 'var(--wpds-border-radius-lg) var(--wpds-border-radius-lg) 0 0',
					overflow: 'hidden',
				} }
			>
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
 * Every prop on the Controls panel, starting from the modal's defaults. Raise
 * `duration` to slow the tweens down (`hold` only lengthens the pauses), pick
 * an `easing` curve, flip `paused` to stop the clock where it is, or set
 * `frame` to pin one keyframe and preview the tween into it; clear `frame` to
 * let the loop run again.
 */
export const Playground: Story = {
	args: {
		hold: 1200,
		duration: 600,
		// The option key; Storybook maps it to the token through `mapping`.
		easing: 'balanced',
		paused: false,
		staticFrame: 4,
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

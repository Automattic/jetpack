import { TZDate } from '@date-fns/tz';
import { DateZoomOut } from '../date-zoom-out';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DateZoomOut > = {
	title: 'Packages/Premium Analytics/UI/DateZoomOut',
	component: DateZoomOut,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Zooms back out to the window a widget zoomed in from, by the name it has there. ' +
					'The panel renders it beside the arrows only while the URL carries such a window.',
			},
		},
	},
	argTypes: {
		onZoomOut: { control: false },
	},
	args: {
		onZoomOut: () => {},
	},
};

export default meta;

type Story = StoryObj< typeof DateZoomOut >;

/** A preset names the window: the control reads its label. */
export const Preset: Story = {
	args: {
		presetId: 'last-30-days',
		range: {
			from: new TZDate( '2026-08-01T00:00:00.000+00:00', 'UTC' ),
			to: new TZDate( '2026-08-30T23:59:59.999+00:00', 'UTC' ),
		},
	},
};

/** A hand-picked window is named by the period it covers. */
export const Custom: Story = {
	args: {
		presetId: 'custom',
		range: {
			from: new TZDate( '2026-09-01T00:00:00.000+00:00', 'UTC' ),
			to: new TZDate( '2026-09-30T23:59:59.999+00:00', 'UTC' ),
		},
	},
};

export const Disabled: Story = {
	args: { ...Preset.args, disabled: true },
};

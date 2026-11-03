/**
 * Internal dependencies
 */
import { WidgetCard } from '../../../stories/widget-card';
import { HighlightField, HighlightGroup } from '../highlight-group';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/HighlightGroup',
	component: HighlightGroup,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Labelled highlights for a widget body, as in Most popular time and Most popular day. ' +
					'The fields sit side by side when two columns fit and stack when they do not, ' +
					'vertically centered either way; a tile too short for them scrolls rather than clips.',
			},
		},
	},
} satisfies Meta< typeof HighlightGroup >;

export default meta;

type Story = StoryObj< typeof HighlightGroup >;

const fields = (
	<>
		<HighlightField label="Best day" value="Friday" caption="17% of views" />
		<HighlightField label="Best hour" value="7:00 pm" caption="5% of views" />
	</>
);

/**
 * A one-column tile on a desktop dashboard: two columns fit, so side by side.
 */
export const Default: Story = {
	render: () => (
		<WidgetCard width="460px" height="400px">
			<HighlightGroup>{ fields }</HighlightGroup>
		</WidgetCard>
	),
};

/**
 * A phone-width tile: too narrow for two columns, so stacked.
 */
export const Narrow: Story = {
	render: () => (
		<WidgetCard width="340px" height="400px">
			<HighlightGroup>{ fields }</HighlightGroup>
		</WidgetCard>
	),
};

/**
 * A height-1 tile: side by side, with the gaps inside each field shed so the
 * row fits without a scrollbar.
 */
export const Short: Story = {
	render: () => (
		<WidgetCard width="460px" height="140px">
			<HighlightGroup>{ fields }</HighlightGroup>
		</WidgetCard>
	),
};

/**
 * Phone width on a height-1 tile: the stack outgrows the body and top-anchors,
 * so the host can scroll to the second field instead of losing the first.
 */
export const NarrowShort: Story = {
	render: () => (
		<WidgetCard width="340px" height="140px">
			<div style={ { height: '100%', overflowY: 'auto' } }>
				<HighlightGroup>{ fields }</HighlightGroup>
			</div>
		</WidgetCard>
	),
};

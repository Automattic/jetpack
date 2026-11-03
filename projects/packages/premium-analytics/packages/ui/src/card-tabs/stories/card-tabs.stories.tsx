/**
 * External dependencies
 */
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { CardTabs } from '../index';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';

/** The Store performance cards, as the widget lays them out. */
const METRICS = [
	{ key: 'orders', label: 'Orders', value: '143' },
	{ key: 'visitors', label: 'Store visitors', value: '27' },
	{ key: 'conversion', label: 'Conversion rate', value: '3.2%' },
	{ key: 'revenue', label: 'Revenue', value: '$1,284' },
];

interface CardTabsStoryControls {
	containerWidth: number;
	activateOnFocus: boolean;
	disableLast: boolean;
}

/**
 * Four metric cards over a panel, inside a horizontally resizable container
 * that stands in for a widget of that width.
 */
function CardTabsStory( { containerWidth, activateOnFocus, disableLast }: CardTabsStoryControls ) {
	const [ value, setValue ] = useState( METRICS[ 0 ].key );

	return (
		<div
			style={ {
				width: `${ containerWidth }px`,
				border: '1px dashed #ccc',
				padding: '16px',
				resize: 'horizontal',
				overflow: 'auto',
			} }
		>
			<CardTabs.Root value={ value } onValueChange={ setValue }>
				<CardTabs.List aria-label="Select metric" activateOnFocus={ activateOnFocus }>
					{ METRICS.map( ( metric, index ) => (
						<CardTabs.Tab
							key={ metric.key }
							value={ metric.key }
							disabled={ disableLast && index === METRICS.length - 1 }
						>
							<span
								style={ {
									display: 'flex',
									flexDirection: 'column',
									gap: 'var(--wpds-dimension-gap-sm)',
								} }
							>
								<span>{ metric.label }</span>
								<span style={ { fontSize: 'var(--wpds-typography-font-size-2xl)', lineHeight: 1 } }>
									{ metric.value }
								</span>
							</span>
						</CardTabs.Tab>
					) ) }
				</CardTabs.List>
				{ METRICS.map( metric => (
					<CardTabs.Panel
						key={ metric.key }
						value={ metric.key }
						style={ { padding: 'var(--wpds-dimension-padding-md)' } }
					>
						{ metric.label } chart
					</CardTabs.Panel>
				) ) }
			</CardTabs.Root>
		</div>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/UI/CardTabs',
	component: CardTabs.Root,
	tags: [ 'autodocs' ],
	argTypes: {
		containerWidth: {
			control: { type: 'range', min: 240, max: 960, step: 8 },
			description: 'Width of the container, standing in for the widget.',
		},
		activateOnFocus: {
			control: 'boolean',
			description: 'Select a card as the arrow keys reach it, instead of on Enter or Space.',
		},
		disableLast: {
			control: 'boolean',
			description: 'Disable the last card.',
		},
	},
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'The `Tabs` of `@wordpress/ui` with each tab drawn as a card: Base UI tabs underneath, the selected card marked by its fill rather than an indicator, and the design system’s interactive tokens for every state. The row wraps on its own once the cards would fall under their minimum width; the padding, that width and the column count are set through `--jpa-card-tabs-padding`, `--jpa-card-tabs-min-inline-size` and `--jpa-card-tabs-columns`.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof CardTabs.Root > & CardTabsStoryControls >;

export default meta;

type Story = StoryObj< CardTabsStoryControls >;

/** Room for every card on one row. */
export const Default: Story = {
	render: args => <CardTabsStory { ...args } />,
	args: { containerWidth: 720, activateOnFocus: false, disableLast: false },
};

/** A container too narrow for one row: the cards wrap into two. */
export const Wrapping: Story = {
	render: args => <CardTabsStory { ...args } />,
	args: { containerWidth: 360, activateOnFocus: false, disableLast: false },
};

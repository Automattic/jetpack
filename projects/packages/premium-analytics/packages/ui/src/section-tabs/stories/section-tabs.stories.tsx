/**
 * External dependencies
 */
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { SectionTabs, SectionTabPanel, type SectionTab } from '../section-tabs';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';

/**
 * The UTM report's tab set — the longest one shipped, used here so the
 * overflow behavior is visible at realistic labels.
 */
const TABS: SectionTab[] = [
	{ id: 'source-medium', label: 'Source / Medium' },
	{ id: 'campaign-source-medium', label: 'Campaign / Source / Medium' },
	{ id: 'source', label: 'Source' },
	{ id: 'medium', label: 'Medium' },
	{ id: 'campaign', label: 'Campaign' },
];

interface SectionTabsStoryControls {
	containerWidth: number;
}

/**
 * The tab bar with panels, inside a horizontally resizable container that
 * stands in for a narrow viewport.
 *
 * @param {SectionTabsStoryControls} props - The story controls.
 * @return The story content.
 */
function SectionTabsStory( { containerWidth }: SectionTabsStoryControls ) {
	const [ activeTab, setActiveTab ] = useState( TABS[ 0 ].id );

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
			<SectionTabs tabs={ TABS } value={ activeTab } onChange={ setActiveTab }>
				{ TABS.map( tab => (
					<SectionTabPanel key={ tab.id } value={ tab.id }>
						{ tab.label } panel content
					</SectionTabPanel>
				) ) }
			</SectionTabs>
		</div>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/UI/SectionTabs',
	component: SectionTabs,
	tags: [ 'autodocs' ],
	argTypes: {
		containerWidth: {
			control: { type: 'range', min: 240, max: 900, step: 10 },
			description: 'Width of the container, standing in for the viewport.',
		},
	},
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'The shared section tab bar. When the tab set is wider than its container, the tablist scrolls inline and shows fade masks at the clipped edge(s) instead of overflowing the page — drag the container handle or use the width control to see it.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof SectionTabs > & SectionTabsStoryControls >;

export default meta;

type Story = StoryObj< SectionTabsStoryControls >;

/**
 * The full tab set with room to spare: the tab row is content-sized (it does
 * not stretch to fill the container) and nothing scrolls.
 */
export const Default: Story = {
	render: args => <SectionTabsStory { ...args } />,
	args: { containerWidth: 800 },
};

/**
 * The container is narrower than the tab set: the tab bar scrolls in place
 * with a fade hint at the clipped edge, and arrow-key navigation scrolls
 * offscreen tabs into view. The page itself must never scroll horizontally.
 */
export const Overflowing: Story = {
	render: args => <SectionTabsStory { ...args } />,
	args: { containerWidth: 320 },
};

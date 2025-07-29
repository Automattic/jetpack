import { sharedDecorator } from '../../../stories/decorator-config';
import { BarChart } from '../../bar-chart';
import sampleData from './sample-data';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof BarChart > = {
	title: 'JS Packages/Charts/Types/Bar Chart/Legend',
	component: BarChart,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: `
# Bar Chart Legends

The BarChart component provides flexible legend positioning using the modern **composition API** as the recommended approach, with backward compatibility for prop-based configuration.

## Recommended: Composition API

The composition API allows you to place legends exactly where you want them using child components. No \`chartId\` props required!

\`\`\`jsx
// ✨ Recommended: Clean composition syntax
<BarChart data={data}>
  <BarChart.Legend orientation="horizontal" alignmentHorizontal="center" />
</BarChart>
\`\`\`

## Key Benefits

- **✅ No Manual IDs**: Child components automatically inherit parent chart's data
- **✅ Flexible Positioning**: Place legends anywhere using familiar alignment props
- **✅ Clean Syntax**: Modern, declarative approach
- **✅ Backward Compatible**: All existing prop-based APIs continue to work

## Legacy: Prop-based Configuration

For backward compatibility, you can still use the traditional prop-based approach:

\`\`\`jsx
// Still works: Traditional prop-based approach
<BarChart 
  data={data} 
  showLegend={true} 
  legendOrientation="horizontal" 
  legendAlignmentHorizontal="center" 
/>
\`\`\`
`,
			},
		},
	},
	decorators: sharedDecorator,
} satisfies Meta< typeof BarChart >;

export default meta;

const storyArgs = {
	data: sampleData.slice( 0, 3 ), // Use first 3 countries for cleaner legend
	containerWidth: '800px',
	containerHeight: '500px',
	withTooltips: true,
};

// Primary examples using composition API (recommended)
export const Default: StoryObj< typeof BarChart > = {
	render: args => (
		<BarChart { ...args }>
			<BarChart.Legend orientation="horizontal" alignmentHorizontal="center" />
		</BarChart>
	),
	args: storyArgs,
	parameters: {
		docs: {
			description: {
				story: `
**Recommended approach** - Using the composition API for clean, declarative legend positioning.

The legend automatically inherits data from the parent chart without any manual configuration.
`,
			},
		},
	},
};

export const VerticalLegend: StoryObj< typeof BarChart > = {
	render: args => (
		<BarChart { ...args }>
			<BarChart.Legend orientation="vertical" alignmentHorizontal="right" alignmentVertical="top" />
		</BarChart>
	),
	args: storyArgs,
	parameters: {
		docs: {
			description: {
				story:
					'Vertical legend positioned on the right side of the chart using the composition API.',
			},
		},
	},
};

export const TopPositioned: StoryObj< typeof BarChart > = {
	render: args => (
		<BarChart { ...args }>
			<BarChart.Legend
				orientation="horizontal"
				alignmentHorizontal="center"
				alignmentVertical="top"
			/>
		</BarChart>
	),
	args: storyArgs,
	parameters: {
		docs: {
			description: {
				story:
					'Legend positioned at the top of the chart - easily achieved with the composition API.',
			},
		},
	},
};

export const HorizontalBarsWithLegend: StoryObj< typeof BarChart > = {
	render: args => (
		<BarChart { ...args } orientation="horizontal">
			<BarChart.Legend
				orientation="horizontal"
				alignmentHorizontal="center"
				alignmentVertical="bottom"
			/>
		</BarChart>
	),
	args: storyArgs,
	parameters: {
		docs: {
			description: {
				story:
					'Composition API works seamlessly with horizontal bar charts and all other chart variants.',
			},
		},
	},
};

export const WithPatterns: StoryObj< typeof BarChart > = {
	render: args => (
		<BarChart { ...args } withPatterns={ true }>
			<BarChart.Legend orientation="vertical" alignmentHorizontal="left" alignmentVertical="top" />
		</BarChart>
	),
	args: storyArgs,
	parameters: {
		docs: {
			description: {
				story:
					'The composition API automatically reflects all chart features including patterns and custom styling.',
			},
		},
	},
};

// Backward compatibility examples
export const LegacyPropBased: StoryObj< typeof BarChart > = {
	render: args => <BarChart { ...args } />,
	args: {
		...storyArgs,
		showLegend: true,
		legendOrientation: 'horizontal',
		legendAlignmentHorizontal: 'center',
	},
	parameters: {
		docs: {
			description: {
				story: `
**Legacy approach** - Traditional prop-based legend configuration for backward compatibility.

While this still works, the composition API above is recommended for new implementations.
`,
			},
		},
	},
};

export const ComparisonBothApproaches: StoryObj< typeof BarChart > = {
	render: args => (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '40px' } }>
			<div>
				<h3 style={ { margin: '0 0 16px 0', fontFamily: 'system-ui' } }>
					✨ Recommended: Composition API
				</h3>
				<BarChart { ...args }>
					<BarChart.Legend orientation="horizontal" alignmentHorizontal="center" />
				</BarChart>
			</div>
			<div>
				<h3 style={ { margin: '0 0 16px 0', fontFamily: 'system-ui' } }>Legacy: Prop-based</h3>
				<BarChart
					{ ...args }
					showLegend={ true }
					legendOrientation="horizontal"
					legendAlignmentHorizontal="center"
				/>
			</div>
		</div>
	),
	args: {
		...storyArgs,
		containerHeight: '900px',
	},
	parameters: {
		docs: {
			description: {
				story: `
**Side-by-side comparison** showing both approaches produce identical results.

The composition API provides better developer experience while maintaining full backward compatibility.
`,
			},
		},
	},
};

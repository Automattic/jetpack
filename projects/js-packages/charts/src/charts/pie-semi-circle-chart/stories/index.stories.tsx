import { Group } from '@visx/group';
import { Text } from '@visx/text';
import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	extractLegendConfig,
	legendArgTypes,
	partialOsUsageData as data,
	themeArgTypes,
	type LegendStoryControls,
} from '../../../stories';
import { PieSemiCircleChart } from '../index';
import type { ChartLegendConfig, DataPointPercentage } from '../../../types';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof PieSemiCircleChart > > &
	LegendStoryControls;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Pie Semi Circle Chart',
	component: PieSemiCircleChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
		...legendArgTypes,
		legendValueDisplay: {
			control: { type: 'select' as const },
			options: [ 'percentage', 'value', 'valueDisplay', 'none' ],
			table: { category: 'Legend' },
			description:
				'What type of value to display in the legend when showValues is true. Note: Enable "showLegend" to see the effect of this control.',
		},
		width: {
			control: {
				type: 'range',
				min: 100,
				max: 1000,
				step: 10,
			},
		},
		height: {
			control: {
				type: 'range',
				min: 100,
				max: 1000,
				step: 10,
			},
		},
		thickness: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
	},
	render: args => {
		const legend = extractLegendConfig< ChartLegendConfig< DataPointPercentage[] > >( args );
		return <PieSemiCircleChart { ...args } legend={ legend } />;
	},
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		thickness: 0.4,
		data,
		label: 'OS',
		note: 'Windows +10%',
		clockwise: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Responsive semi-circle pie chart. Resize the dashed container to see the chart adapt while maintaining a 2:1 width-to-height ratio.',
			},
		},
	},
};

export const FixedDimensions: Story = {
	render: args => (
		<PieSemiCircleChart
			width={ args.width }
			data={ args.data }
			label={ args.label }
			note={ args.note }
			thickness={ args.thickness }
			clockwise={ args.clockwise }
			height={ args.height }
		/>
	),
	args: {
		...Default.args,
		resize: 'none',
		width: 600,
		height: 300,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Semi-circle pie chart with fixed pixel dimensions. The chart will maintain a 2:1 width-to-height ratio within the provided dimensions.',
			},
		},
	},
};

export const Animation: Story = {
	args: {
		...Default.args,
		animation: true,
	},
};

export const WithTooltips: Story = {
	args: {
		...Default.args,
		withTooltips: true,
	},
	parameters: {
		docs: {
			description: {
				story: 'Semi-circle pie chart with interactive tooltips that appear on hover.',
			},
		},
	},
};

export const WithLegend: Story = {
	args: {
		...Default.args,
		showLegend: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Props-based legend using `showLegend` and the `legend` config object. Use Storybook controls to adjust legend position, alignment, orientation, shape, and interactivity.',
			},
		},
	},
};

export const WithCompositionLegend: Story = {
	render: args => {
		const legend = extractLegendConfig< ChartLegendConfig< DataPointPercentage[] > >( args );
		return (
			<PieSemiCircleChart
				{ ...Default.args }
				{ ...args }
				legend={ { interactive: legend?.interactive } }
				chartId="composition-semi-circle-chart"
			>
				<PieSemiCircleChart.Legend { ...legend } />
			</PieSemiCircleChart>
		);
	},
	args: {
		data,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Composition API using `<PieSemiCircleChart.Legend />` as a child component for explicit legend placement and configuration. This is the recommended approach for flexible legend positioning.',
			},
		},
	},
};

export const ErrorStates: Story = {
	render: () => (
		<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
			<div>
				<h3>Empty Data</h3>
				<PieSemiCircleChart width={ 300 } data={ [] } />
			</div>

			<div>
				<h3>Zero Total Value</h3>
				<PieSemiCircleChart
					width={ 300 }
					data={ [
						{ label: 'A', value: 0 },
						{ label: 'B', value: 0 },
					] }
				/>
			</div>

			<div>
				<h3>Negative Values</h3>
				<PieSemiCircleChart
					width={ 300 }
					data={ [
						{ label: 'A', value: -30 },
						{ label: 'B', value: 130 },
					] }
				/>
			</div>

			<div>
				<h3>Single Data Point</h3>
				<PieSemiCircleChart height={ 300 } data={ [ { label: 'Single Point', value: 100 } ] } />
			</div>
		</div>
	),
	args: {
		containerHeight: '600px',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Examples of how the semi-circle pie chart handles various error states and edge cases.',
			},
		},
	},
};

export const CompositionAPI: Story = {
	render: args => (
		<div style={ { padding: '2rem' } }>
			<h2>PieSemiCircleChart Composition API</h2>
			<p>Demonstrates the flexible composition API with SVG and HTML compound components.</p>

			<div
				style={ {
					display: 'grid',
					gap: '2rem',
					gridTemplateColumns: 'repeat(2, 1fr)',
					marginTop: '2rem',
				} }
			>
				<div>
					<h3>With Custom SVG Elements</h3>
					<PieSemiCircleChart
						height={ 300 }
						data={ args.data }
						label="OS Usage"
						note="Q4 2023"
						withTooltips={ true }
					>
						<PieSemiCircleChart.SVG>
							<Group>
								<Text
									x={ 0 }
									y={ -80 }
									textAnchor="middle"
									fontSize={ 14 }
									fill="#666"
									fontStyle="italic"
								>
									Custom SVG Annotation
								</Text>
								<circle cx={ 0 } cy={ -90 } r={ 3 } fill="#ff6b6b" />
							</Group>
						</PieSemiCircleChart.SVG>
						<PieSemiCircleChart.HTML>
							<div
								style={ {
									marginTop: '1rem',
									textAlign: 'center',
									fontSize: '12px',
									color: '#888',
								} }
							>
								✨ Enhanced with custom annotations
							</div>
						</PieSemiCircleChart.HTML>
					</PieSemiCircleChart>
				</div>

				<div>
					<h3>With Custom Legend and HTML Content</h3>
					<PieSemiCircleChart
						height={ 300 }
						data={ args.data }
						label="Performance"
						note="Latest Results"
					>
						<PieSemiCircleChart.HTML>
							<div
								style={ {
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '1rem',
									marginTop: '1rem',
								} }
							>
								<PieSemiCircleChart.Legend
									orientation="horizontal"
									alignment="center"
									shape="circle"
								/>
								<div
									style={ {
										padding: '0.5rem 1rem',
										backgroundColor: '#f0f0f0',
										borderRadius: '4px',
										fontSize: '12px',
									} }
								>
									🔍 Hover segments for details
								</div>
								<div
									style={ {
										fontSize: '10px',
										color: '#666',
										textAlign: 'center',
										lineHeight: 1.4,
									} }
								>
									Data updated: { new Date().toLocaleString() }
									<br />
									Source: Internal Analytics
								</div>
							</div>
						</PieSemiCircleChart.HTML>
					</PieSemiCircleChart>
				</div>
			</div>

			<div style={ { marginTop: '3rem' } }>
				<h3>Legacy Support - Direct Group Components</h3>
				<p style={ { fontSize: '14px', color: '#666', marginBottom: '1rem' } }>
					For backward compatibility, Group components are still supported directly:
				</p>
				<PieSemiCircleChart
					height={ 200 }
					data={ args.data }
					label="Legacy Mode"
					note="Still works!"
				>
					<Group>
						<Text x={ 0 } y={ -70 } textAnchor="middle" fontSize={ 12 } fill="#999">
							Direct Group usage
						</Text>
						<rect x={ -30 } y={ -85 } width={ 60 } height={ 2 } fill="#ddd" />
					</Group>
				</PieSemiCircleChart>
			</div>
		</div>
	),
	args: {
		data,
		containerHeight: '1000px',
		containerWidth: '1000px',
	},
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				story: `
**New Composition API Features:**

The \`PieSemiCircleChart\` now supports a comprehensive composition API that allows you to add custom content both inside the SVG and as HTML elements around the chart.

**Available Compound Components:**

- \`PieSemiCircleChart.SVG\` - For custom SVG elements rendered inside the chart
- \`PieSemiCircleChart.HTML\` - For HTML content rendered outside the SVG
- \`PieSemiCircleChart.Legend\` - For flexible legend placement

**Key Benefits:**

1. **Flexible Layout Control** - Place content exactly where you need it
2. **Type Safety** - Full TypeScript support for all compound components
3. **Backward Compatibility** - Existing Group-based usage continues to work
4. **Robust Type Checking** - Uses displayName-based component identification instead of fragile type comparisons

**Usage Examples:**

\`\`\`tsx
<PieSemiCircleChart data={data} width={400}>
  <PieSemiCircleChart.SVG>
    <Group>
      <Text x={0} y={-50} textAnchor="middle">Custom SVG Text</Text>
    </Group>
  </PieSemiCircleChart.SVG>

  <PieSemiCircleChart.HTML>
    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
      <PieSemiCircleChart.Legend orientation="horizontal" />
      <p>Custom HTML content</p>
    </div>
  </PieSemiCircleChart.HTML>
</PieSemiCircleChart>
\`\`\`
				`,
			},
		},
	},
};

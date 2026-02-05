import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { GlobalChartsProvider } from '../../../providers';
import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	legendArgTypes,
	partialOsUsageData as data,
	themeArgTypes,
} from '../../../stories';
import { PieSemiCircleChart, PieSemiCircleChartUnresponsive } from '../index';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof PieSemiCircleChart > >;

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
		width: {
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
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		containerWidth: '600px',
		resize: 'none',
		thickness: 0.4,
		data,
		label: 'OS',
		note: 'Windows +10%',
		clockwise: true,
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
};

export const WithCompositionLegend: Story = {
	render: args => (
		<div
			style={ {
				display: 'grid',
				gap: '2rem',
				gridTemplateColumns: 'repeat(2, 1fr)',
				alignItems: 'center',
			} }
		>
			<div>
				<h3>Traditional Props-based Legend</h3>
				<PieSemiCircleChart
					width={ 400 }
					data={ args.data }
					label="Performance Metrics"
					note="Q4 2023 Results"
					showLegend={ true }
					legendPosition={ args.legendPosition || 'bottom' }
					legendOrientation={ args.legendOrientation || 'horizontal' }
					legendAlignment={ args.legendAlignment || 'center' }
					legendMaxWidth={ args.legendMaxWidth }
					legendTextOverflow={ args.legendTextOverflow || 'wrap' }
				/>
			</div>
			<div>
				<h3>Composition API with Legend Component</h3>
				<PieSemiCircleChart
					width={ 400 }
					data={ args.data }
					label="Performance Metrics"
					note="Q4 2023 Results"
				>
					<PieSemiCircleChart.Legend
						position={ args.legendPosition || 'bottom' }
						orientation={ args.legendOrientation || 'horizontal' }
						alignment={ args.legendAlignment || 'center' }
						maxWidth={ args.legendMaxWidth }
						textOverflow={ args.legendTextOverflow || 'wrap' }
					/>
				</PieSemiCircleChart>
			</div>
		</div>
	),
	args: {
		data,
		containerWidth: '900px',
	},
	argTypes: {
		legendInteractive: {
			table: { disable: true },
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates the semi-circle chart composition API, allowing flexible component composition with explicit legend placement.',
			},
		},
	},
};

export const InteractiveLegend: Story = {
	render: args => (
		<GlobalChartsProvider>
			<div style={ { padding: '20px' } }>
				<h3>Interactive Semi-Circle Chart</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					Click legend items to show/hide segments. Percentages adjust automatically.
				</p>
				<PieSemiCircleChartUnresponsive
					chartId="interactive-semi-circle-chart"
					width={ args.width || 400 }
					data={ args.data }
					label="Performance Metrics"
					note="Click legend to filter"
					showLegend={ true }
					legendInteractive={ true }
					legendPosition={ args.legendPosition || 'bottom' }
					legendOrientation={ args.legendOrientation || 'horizontal' }
					legendAlignment={ args.legendAlignment || 'center' }
				/>
			</div>
		</GlobalChartsProvider>
	),
	args: {
		data,
		width: 400,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Interactive semi-circle chart with clickable legend items. Hidden segments are excluded and percentages recalculate. Requires chartId and GlobalChartsProvider.',
			},
		},
	},
};

export const CustomLegendPositioning: Story = {
	args: {
		containerWidth: '600px',
		containerHeight: '350px',
		resize: 'none',
		thickness: 0.4,
		data: [
			{
				label: 'MacOS',
				value: 30000,
				valueDisplay: '30K',
				percentage: 30,
			},
			{
				label: 'Linux',
				value: 22000,
				valueDisplay: '22K',
				percentage: 22,
			},
			{
				label: 'Windows',
				value: 48000,
				valueDisplay: '48K',
				percentage: 48,
			},
		],
		label: 'OS',
		note: 'Windows +10%',
		withTooltips: true,
		showLegend: true,
		legendOrientation: 'vertical',
		legendAlignment: 'end',
		legendPosition: 'top',
		legendShape: 'circle',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Semi-circle pie chart with right-top positioned vertical legend. This demonstrates non-default legend positioning to showcase different legend placement possibilities with OS usage data.',
			},
		},
	},
};

const responsiveArgs = { ...Default.args, resize: 'both' as const };
delete responsiveArgs.width;
export const Responsiveness: Story = {
	args: responsiveArgs,
	parameters: {
		docs: {
			description: {
				story:
					'Semi-circle pie chart with responsive behavior. Uses width prop for unified width/height handling.',
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
				<h3>Zero Total Percentage</h3>
				<PieSemiCircleChart
					width={ 300 }
					data={ [
						{ label: 'A', value: 0, percentage: 0 },
						{ label: 'B', value: 0, percentage: 0 },
					] }
				/>
			</div>

			<div>
				<h3>Negative Values</h3>
				<PieSemiCircleChart
					width={ 300 }
					data={ [
						{ label: 'A', value: -30, percentage: -30 },
						{ label: 'B', value: 130, percentage: 130 },
					] }
				/>
			</div>

			<div>
				<h3>Single Data Point</h3>
				<PieSemiCircleChart
					width={ 300 }
					data={ [ { label: 'Single Point', value: 100, percentage: 100 } ] }
				/>
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
						width={ 400 }
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
						width={ 400 }
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
					width={ 400 }
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
	argTypes: {
		legendInteractive: {
			table: { disable: true },
		},
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

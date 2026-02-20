import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	ecommerceFunnelData,
	lowConversionFunnelData,
	highConversionFunnelData,
	themeArgTypes,
} from '../../../stories';
import ConversionFunnelChart from '../conversion-funnel-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof ConversionFunnelChart > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Conversion Funnel Chart',
	component: ConversionFunnelChart,
	parameters: {
		layout: 'centered',
	},
	tags: [ 'autodocs' ],
	argTypes: {
		mainRate: {
			control: { type: 'number', min: 0, max: 100, step: 0.1 },
			description: 'Main conversion rate to highlight',
			table: {
				type: { summary: 'number' },
			},
		},
		changeIndicator: {
			control: 'text',
			description: 'Change indicator (e.g., +2%, -1.5%)',
			table: {
				type: { summary: 'string' },
			},
		},
		steps: {
			control: 'object',
			description: 'Array of funnel steps',
			table: {
				type: { summary: 'FunnelStep[]' },
			},
		},
		loading: {
			control: 'boolean',
			description: 'Whether the chart is in loading state',
			table: {
				defaultValue: { summary: 'false' },
			},
		},
		className: {
			control: 'text',
			description: 'Additional CSS class name',
			table: {
				type: { summary: 'string' },
			},
		},
		height: {
			control: 'text',
			description: 'Height of the chart container (e.g., "100%", "400px")',
			table: {
				type: { summary: 'string | number' },
			},
		},
		style: {
			control: 'object',
			description: 'Custom styling for the chart container',
			table: {
				type: { summary: 'React.CSSProperties' },
			},
		},
		...sharedChartArgTypes,
		...themeArgTypes,
	},
	decorators: [ chartDecorator ],
};

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: ecommerceFunnelData,
		loading: false,
	},
};

export const NegativeChange: Story = {
	args: {
		mainRate: 8.7,
		changeIndicator: '-1.6%',
		steps: lowConversionFunnelData,
		loading: false,
	},
};

export const HighConversion: Story = {
	args: {
		mainRate: 18.7,
		changeIndicator: '+5.2%',
		steps: highConversionFunnelData,
		loading: false,
	},
};

export const WithoutChangeIndicator: Story = {
	args: {
		mainRate: 10.3,
		steps: ecommerceFunnelData,
		loading: false,
	},
};

export const Loading: Story = {
	args: {
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: ecommerceFunnelData,
		loading: true,
	},
};

export const Animation: Story = {
	args: {
		...Default.args,
		animation: true,
	},
};

export const EmptyData: Story = {
	args: {
		mainRate: 0,
		steps: [],
		loading: false,
	},
};

export const FixedDimensions: Story = {
	args: {
		...sharedThemeArgs,
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: ecommerceFunnelData,
		loading: false,
		height: '200px',
	},
};

export const CustomRenderProps: Story = {
	args: {
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: ecommerceFunnelData,
		renderMainMetric: ( { mainRate, changeIndicator, className } ) => (
			<div
				className={ className }
				style={ {
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					borderRadius: '12px',
					padding: '24px',
					marginBottom: '32px',
					color: 'white',
					textAlign: 'center',
					height: 'fit-content',
				} }
			>
				<h3
					style={ {
						margin: '0 0 12px 0',
						fontSize: '14px',
						fontWeight: '500',
						opacity: 0.9,
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
					} }
				>
					Overall Conversion Rate
				</h3>
				<div
					style={ { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' } }
				>
					<span
						style={ {
							fontSize: '42px',
							fontWeight: 'bold',
							fontFamily: 'Inter, sans-serif',
							lineHeight: 1,
						} }
					>
						{ mainRate.toFixed( 1 ) }%
					</span>
					{ changeIndicator && (
						<span
							style={ {
								fontSize: '16px',
								fontWeight: '600',
								fontFamily: 'Inter, sans-serif',
								backgroundColor: changeIndicator.startsWith( '+' )
									? 'rgba(16, 185, 129, 0.2)'
									: 'rgba(239, 68, 68, 0.2)',
								color: changeIndicator.startsWith( '+' ) ? '#10b981' : '#ef4444',
								padding: '6px 12px',
								borderRadius: '8px',
								border: `1px solid ${ changeIndicator.startsWith( '+' ) ? '#10b981' : '#ef4444' }`,
							} }
						>
							{ changeIndicator }
						</span>
					) }
				</div>
				<p
					style={ {
						margin: '12px 0 0 0',
						fontSize: '12px',
						opacity: 0.8,
						fontFamily: 'Inter, sans-serif',
					} }
				>
					Last 30 days vs previous period
				</p>
			</div>
		),
		renderTooltip: ( { step } ) => (
			<div
				style={ {
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					borderRadius: '12px',
					padding: '16px 20px',
					color: 'white',
					fontFamily: 'Inter, sans-serif',
					boxShadow: '0 8px 32px rgba(118, 75, 162, 0.3)',
					border: 'none',
					minWidth: '200px',
				} }
			>
				<div
					style={ {
						fontSize: '11px',
						fontWeight: '500',
						opacity: 0.8,
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
						margin: '0 0 8px 0',
					} }
				>
					{ step.label }
				</div>
				<div
					style={ {
						fontSize: '18px',
						fontWeight: 'bold',
						margin: '0',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					} }
				>
					{ step.rate.toFixed( 1 ) }%
					{ step.count && (
						<span
							style={ {
								fontSize: '14px',
								fontWeight: '400',
								opacity: 0.9,
							} }
						>
							• { step.count.toLocaleString() } items
						</span>
					) }
				</div>
			</div>
		),
	},
	decorators: [ Story => <Story /> ],
};

export const WithoutTooltips: Story = {
	args: {
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: ecommerceFunnelData,
		renderMainMetric: () => null,
		renderTooltip: () => null,
	},
};

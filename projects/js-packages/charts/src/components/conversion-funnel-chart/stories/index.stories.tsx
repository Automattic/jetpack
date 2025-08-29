import { ThemeProvider, jetpackTheme, wooTheme } from '../../../providers/theme';
import {
	ecommerceFunnelData,
	lowConversionFunnelData,
	highConversionFunnelData,
} from '../../../stories/sample-data';
import { ConversionFunnelChart } from '../conversion-funnel-chart';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof ConversionFunnelChart > = {
	title: 'JS Packages/Charts/Types/Conversion Funnel Chart',
	component: ConversionFunnelChart,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: `
A focused conversion funnel chart component for visualizing step-by-step conversion rates with a prominent main metric display and change indicators.

## Features

- 📊 Clear funnel visualization with proportional bar heights and light backgrounds
- 📈 Main conversion rate highlighting with positive/negative change indicators
- 🎨 Dynamic color theming - bar backgrounds automatically adapt to primary color
- 🔧 **Render Props** - Complete customization control with \`renderMainMetric\`, \`renderStepLabel\`, and \`renderStepRate\`
- 🎭 **CSS Variables** - Easy theming with \`--funnel-font-family\` and \`--step-font-family\`
- 📱 Mobile-friendly responsive design with flexible layouts
- 🎯 TypeScript support with full type definitions
- ♿ Accessible design with semantic markup
- 🧪 Comprehensive test coverage

## Usage

### Basic Usage

\`\`\`typescript
import { ConversionFunnelChart } from '@automattic/charts';

const funnelData = [
  { id: 'sessions', label: 'Sessions', rate: 100, count: 10000 },
  { id: 'cart', label: 'Cart', rate: 71.1, count: 7110 },
  { id: 'checkout', label: 'Checkout', rate: 52.5, count: 5250 },
  { id: 'purchase', label: 'Purchase', rate: 10.3, count: 1030 },
];

function MyComponent() {
  return (
    <ConversionFunnelChart 
      mainRate={10.3}
      changeIndicator="+2%"
      steps={funnelData} 
    />
  );
}
\`\`\`

### With Header and Metrics

\`\`\`typescript
import { ConversionFunnelChart } from '@automattic/charts';

function FullDashboard() {
  return (
    <div>
      <header>
        <h2>Store conversion rate</h2>
        <div className="metrics">
          <span className="main-rate">10.3%</span>
          <span className="change positive">+2%</span>
        </div>
      </header>
      <ConversionFunnelChart 
        mainRate={10.3}
        changeIndicator="+2%"
        steps={funnelData} 
      />
    </div>
  );
}
\`\`\`

### E-commerce Conversion Funnel

\`\`\`typescript
const ecommerceFunnel = [
  { id: 'sessions', label: 'Sessions', rate: 100 },
  { id: 'product_views', label: 'Product Views', rate: 45.2 },
  { id: 'cart', label: 'Add to Cart', rate: 28.8 },
  { id: 'checkout', label: 'Checkout', rate: 18.1 },
  { id: 'purchase', label: 'Purchase', rate: 12.3 },
];

<ConversionFunnelChart 
  mainRate={12.3}
  changeIndicator="+3.2%"
  steps={ecommerceFunnel} 
/>
\`\`\`

### SaaS Signup Funnel

\`\`\`typescript
const saasFunnel = [
  { id: 'visitors', label: 'Visitors', rate: 100 },
  { id: 'trial', label: 'Trial Signup', rate: 12.5 },
  { id: 'activation', label: 'Activated', rate: 8.2 },
  { id: 'subscription', label: 'Paid Plan', rate: 3.1 },
];

<ConversionFunnelChart 
  mainRate={3.1}
  changeIndicator="-0.4%"
  steps={saasFunnel} 
/>
\`\`\`

## FunnelStep Interface

\`\`\`typescript
interface FunnelStep {
  id: string;           // Unique identifier
  label: string;        // Display name for the step
  rate: number;         // Conversion rate as percentage (0-100)
  count?: number;       // Optional absolute count
}
\`\`\`

## Customization

### Render Props

Complete control over component rendering with optional render functions:

\`\`\`typescript
<ConversionFunnelChart
  renderMainMetric={({ mainRate, changeIndicator, className, changeColor }) => (
    <div className={className}>
      <h2>Custom Header</h2>
      <span>{mainRate}%</span> <span style={{color: changeColor}}>{changeIndicator}</span>
    </div>
  )}
  renderStepLabel={({ step, index, className }) => (
    <span className={className}>#{index + 1} {step.label}</span>
  )}
  renderStepRate={({ step, className }) => (
    <strong className={className}>{step.rate}%</strong>
  )}
/>
\`\`\`

### CSS Variables

Easy theming with CSS custom properties:

\`\`\`css
.myCustomChart {
  --primary-color: #3858e9;
  --light-background-color: rgba(56, 88, 233, 0.08);
  --funnel-font-family: "SF Pro Text", sans-serif;
  --step-font-family: "SF Pro", sans-serif;
}
\`\`\`

**Available CSS Variables:**
- \`--primary-color\` - Chart bar colors
- \`--light-background-color\` - Bar container backgrounds  
- \`--funnel-font-family\` - Font for main rate and change indicator
- \`--step-font-family\` - Font for step labels and rates

## Accessibility

The component includes:
- Semantic HTML structure with proper headings
- Color contrast ratios meeting WCAG guidelines
- Screen reader compatible text and labels
- Keyboard navigation support

## Examples

### Marketing Funnel Analysis

Track user journey from awareness to conversion:
- Sessions → Lead Capture → Qualification → Sales

### Product Onboarding

Monitor user activation through key steps:
- Signup → Profile Setup → First Action → Active User

### Content Engagement

Measure content consumption funnel:
- Page Views → Scroll Depth → CTA Clicks → Conversions
				`,
			},
		},
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
		style: {
			control: 'object',
			description: 'Custom styling for the chart container',
			table: {
				type: { summary: 'React.CSSProperties' },
			},
		},
	},
	decorators: [
		Story => (
			<div style={ { width: '600px', padding: '20px' } }>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj< typeof meta >;

export const Default: Story = {
	args: {
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

export const EmptyData: Story = {
	args: {
		mainRate: 0,
		steps: [],
		loading: false,
	},
};

// Themed stories
export const JetpackTheme: Story = {
	args: {
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: ecommerceFunnelData,
		loading: false,
	},
	decorators: [
		Story => (
			<ThemeProvider theme={ jetpackTheme }>
				<Story />
			</ThemeProvider>
		),
	],
};

export const WooCommerceTheme: Story = {
	args: {
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: ecommerceFunnelData,
		loading: false,
	},
	decorators: [
		Story => (
			<ThemeProvider theme={ wooTheme }>
				<Story />
			</ThemeProvider>
		),
	],
};

export const CustomRenderProps: Story = {
	args: {
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: ecommerceFunnelData,
		style: {
			'--primary-color': '#4F46E5',
			'--light-background-color': 'rgba(79, 70, 229, 0.08)',
			'--step-font-family': 'Roboto, sans-serif',
		} as React.CSSProperties,
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
	parameters: {
		docs: {
			description: {
				story:
					'Custom typography with renderMainMetric and renderTooltip showing a dashboard-style header and custom tooltip, both with gradient background, larger fonts, and enhanced styling compared to the default display.',
			},
		},
	},
	decorators: [ Story => <Story /> ],
};

export const FunnelOnly: Story = {
	args: {
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: ecommerceFunnelData,
		renderMainMetric: () => null,
		renderTooltip: () => null,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Shows just the funnel visualization by disabling the main metric display and tooltips through null return values from render props.',
			},
		},
	},
};

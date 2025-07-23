import { ThemeProvider, jetpackTheme, wooTheme } from '../../../providers/theme';
import { ConversionFunnelChart } from '../conversion-funnel-chart';
import { sampleFunnelData, lowConversionData, highConversionData } from './sample-data';
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

## Styling

The component uses CSS Modules and CSS custom properties for theming:

\`\`\`css
.myCustomChart {
  --primary-color: #3858e9;
  --background-color: #f3f4f6;
  --light-background-color: rgba(56, 88, 233, 0.08);
  --change-color: #008a20;
}
\`\`\`

The component automatically creates a light background version of the primary color for the bar containers using 8% opacity.

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
		steps: sampleFunnelData,
		loading: false,
	},
};

export const NegativeChange: Story = {
	args: {
		mainRate: 8.7,
		changeIndicator: '-1.6%',
		steps: lowConversionData,
		loading: false,
	},
};

export const HighConversion: Story = {
	args: {
		mainRate: 18.7,
		changeIndicator: '+5.2%',
		steps: highConversionData,
		loading: false,
	},
};

export const WithoutChangeIndicator: Story = {
	args: {
		mainRate: 10.3,
		steps: sampleFunnelData,
		loading: false,
	},
};

export const Loading: Story = {
	args: {
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: sampleFunnelData,
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
		steps: sampleFunnelData,
		loading: false,
	},
	decorators: [
		Story => (
			<ThemeProvider theme={ jetpackTheme }>
				<div style={ { width: '600px', padding: '20px' } }>
					<Story />
				</div>
			</ThemeProvider>
		),
	],
};

export const WooCommerceTheme: Story = {
	args: {
		mainRate: 10.3,
		changeIndicator: '+2%',
		steps: sampleFunnelData,
		loading: false,
	},
	decorators: [
		Story => (
			<ThemeProvider theme={ wooTheme }>
				<div style={ { width: '600px', padding: '20px' } }>
					<Story />
				</div>
			</ThemeProvider>
		),
	],
};

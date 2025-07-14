# LeaderboardChart Component

A flexible and accessible leaderboard chart component for displaying ranked data with progress bars and optional comparison values.

## Features

- 📊 Clean, responsive leaderboard visualization
- 🎨 Customizable colors and styling
- 🔄 Optional comparison data support
- 📱 Mobile-friendly design
- 🎯 TypeScript support with full type definitions
- ♿ Accessible design
- 🧪 Comprehensive test coverage
- 📖 Storybook documentation

## Usage

### Basic Usage

```typescript
import { LeaderboardChart } from '@automattic/charts';

const data = [
  {
    id: 'direct',
    label: 'Direct',
    currentValue: 12500,
    previousValue: 10000,
    currentShare: 100,
    previousShare: 80,
    delta: 25,
  },
  // ... more entries
];

function MyComponent() {
  return (
    <LeaderboardChart
      data={data}
      withComparison={true}
      primaryColor="#3858E9"
      secondaryColor="#66BDFF"
    />
  );
}
```

### With Custom Formatters

```typescript
import { LeaderboardChart } from '@automattic/charts';

function CustomFormattedChart() {
  return (
    <LeaderboardChart
      data={data}
      withComparison={true}
      valueFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
      deltaFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
    />
  );
}
```

### Using with Raw Data

```typescript
import { LeaderboardChart, buildLeaderboardData } from '@automattic/charts';

const rawData = [
  {
    id: 'direct',
    name: 'Direct',
    current_period: { value: 12500 },
    previous_period: { value: 10000 },
  },
  // ... more raw data
];

function ProcessedDataChart() {
  const processedData = buildLeaderboardData(rawData, 4);
  
  return (
    <LeaderboardChart
      data={processedData}
      withComparison={true}
    />
  );
}
```

## API Reference

### LeaderboardChart Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `LeaderboardEntry[]` | **required** | Array of leaderboard entries to display |
| `withComparison` | `boolean` | `false` | Whether to show comparison data |
| `loading` | `boolean` | `false` | Whether the chart is in loading state |
| `primaryColor` | `string` | `#3858E9` | Primary color for current period bars |
| `secondaryColor` | `string` | `#66BDFF` | Secondary color for comparison period bars |
| `valueFormatter` | `(value: number) => string` | *compact formatter* | Custom formatter for values |
| `deltaFormatter` | `(value: number) => string` | *percentage formatter* | Custom formatter for delta values |
| `className` | `string` | `undefined` | Additional CSS class name |
| `style` | `React.CSSProperties` | `undefined` | Custom styling for the chart container |

### LeaderboardEntry Interface

```typescript
interface LeaderboardEntry {
  id: string;              // Unique identifier
  label: string;           // Display name
  currentValue: number;    // Current period value
  previousValue: number;   // Previous period value
  currentShare: number;    // Current bar width (0-100)
  previousShare: number;   // Previous bar width (0-100)
  delta: number;           // Percentage change
}
```

## Utility Functions

### buildLeaderboardData

Processes raw data into the format expected by LeaderboardChart.

```typescript
function buildLeaderboardData(
  data: LeaderboardDataItem[],
  maxItems?: number
): LeaderboardEntry[]
```

**Parameters:**
- `data`: Array of raw data items
- `maxItems`: Maximum number of items to return (default: 4)

**Returns:** Processed and sorted array of LeaderboardEntry objects

### calculateDelta

Calculates percentage change between two values.

```typescript
function calculateDelta(current: number, previous: number): number
```

**Parameters:**
- `current`: Current period value
- `previous`: Previous period value

**Returns:** Percentage change as a number

## Styling

The component uses CSS Modules for styling. You can customize colors using CSS custom properties:

```css
.myCustomChart {
  --primary-color: #ff6b6b;
  --secondary-color: #4ecdc4;
}
```

## Accessibility

The component includes:
- Semantic HTML structure
- Proper color contrast ratios
- Keyboard navigation support
- Screen reader compatible markup

## Examples

### E-commerce Sales Channels

```typescript
const salesData = [
  { id: 'organic', label: 'Organic Search', currentValue: 45000, previousValue: 38000, currentShare: 100, previousShare: 84, delta: 18 },
  { id: 'paid', label: 'Paid Advertising', currentValue: 32000, previousValue: 35000, currentShare: 71, previousShare: 78, delta: -9 },
  { id: 'social', label: 'Social Media', currentValue: 18000, previousValue: 15000, currentShare: 40, previousShare: 33, delta: 20 },
  { id: 'email', label: 'Email Marketing', currentValue: 12000, previousValue: 11000, currentShare: 27, previousShare: 24, delta: 9 },
];

<LeaderboardChart data={salesData} withComparison={true} />
```

### Traffic Sources

```typescript
const trafficData = buildLeaderboardData([
  { id: 'direct', name: 'Direct', current_period: { value: 15420 }, previous_period: { value: 13200 } },
  { id: 'search', name: 'Search Engines', current_period: { value: 12350 }, previous_period: { value: 11800 } },
  { id: 'social', name: 'Social Networks', current_period: { value: 8760 }, previous_period: { value: 9200 } },
]);

<LeaderboardChart data={trafficData} withComparison={true} />
```

## Testing

The component includes comprehensive tests covering:
- Component rendering
- Data formatting
- Comparison functionality
- Custom formatters
- Loading states
- Utility functions

Run tests with:
```bash
pnpm test
```

## Storybook

Interactive examples and documentation are available in Storybook:
```bash
pnpm storybook
```
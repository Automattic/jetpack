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

### Preparing Your Data

The LeaderboardChart expects pre-processed data. You'll need to transform your raw data into the required format:

```typescript
import { LeaderboardChart } from '@automattic/charts';

// Transform your raw data into LeaderboardEntry format
function transformRawData(rawData) {
  const maxValue = Math.max(...rawData.map(item => item.current_period.value));
  
  return rawData.map(item => ({
    id: item.id,
    label: item.name,
    currentValue: item.current_period.value,
    previousValue: item.previous_period.value,
    currentShare: (item.current_period.value / maxValue) * 100,
    previousShare: (item.previous_period.value / maxValue) * 100,
    delta: ((item.current_period.value - item.previous_period.value) / item.previous_period.value) * 100,
  }));
}

function ProcessedDataChart() {
  const processedData = transformRawData(rawData);
  
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

## Data Transformation

Since the LeaderboardChart expects pre-processed data, you'll need to handle data transformation in your application. This gives you full control over how your specific data structures are converted and allows for custom business logic.

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
const trafficData = [
  { id: 'direct', label: 'Direct', currentValue: 15420, previousValue: 13200, currentShare: 100, previousShare: 86, delta: 17 },
  { id: 'search', label: 'Search Engines', currentValue: 12350, previousValue: 11800, currentShare: 80, previousShare: 77, delta: 5 },
  { id: 'social', label: 'Social Networks', currentValue: 8760, previousValue: 9200, currentShare: 57, previousShare: 60, delta: -5 },
];

<LeaderboardChart data={trafficData} withComparison={true} />
```

## Testing

The component includes comprehensive tests covering:
- Component rendering
- Data formatting
- Comparison functionality
- Custom formatters
- Loading states
- Empty data handling

Run tests with:
```bash
pnpm test
```

## Storybook

Interactive examples and documentation are available in Storybook:
```bash
pnpm storybook
```
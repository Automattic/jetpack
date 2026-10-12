# Widgets

Dashboard widget components for Jetpack Premium Analytics.

## Available Widgets

| Widget                         | Chart Component                                 | Description                                       |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------------- |

## Chart Components

| Component              | Type        | Use Case                            |
| ---------------------- | ----------- | ----------------------------------- |
| `DonutChart`           | Pie/Donut   | Category breakdowns (2-4 segments)  |
| `SemiCircleChart`      | Half-pie    | Top N rankings with "Other" segment |
| `ComparativeLineChart` | Line        | Time series with comparison periods |
| `MetricWithComparison` | Metric      | Single value with delta indicator   |
| `LeaderboardChart`     | Leaderboard | Top N items with bars and labels    |

## Common Utilities

Shared code is located in `common/`:

### Hooks

- `useSegmentStyles( chartData )` - Builds segment colors from theme provider

# Widgets

Dashboard widget components for Jetpack Premium Analytics.

## Available Widgets

| Widget                         | Chart Component                                 | Description                                       |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------------- |
| `ConversionRateWidget`         | `MetricWithComparison`                          | Funnel conversion rate metric                     |
| `MetricComparisonWidget`       | `MetricWithComparison` + `ComparativeLineChart` | Generic metric with time series                   |
| `RevenueByCustomerTypeWidget`  | `BarChart`                                      | Revenue breakdown by customer type                |
| `NewVsReturningCustomerWidget` | `DonutChart`                                    | Customer counts by new vs returning               |
| `OrderMetricWidget`            | `ReportMetricWidget`                            | Order-based metrics (revenue, orders, AOV)        |
| `SalesByCouponWidget`          | `SemiCircleChart`                               | Coupon sales for all product types                |
| `SalesByDeviceWidget`          | `DonutChart`                                    | Sales breakdown by device type                    |
| `TotalReturnsWidget`           | `DonutChart`                                    | Returns/refunds for all product types             |
| `TopPerformingProductsWidget`  | `LeaderboardChart`                              | Top products by revenue                           |
| `TopPerformingBookingsWidget`  | `LeaderboardChart`                              | Top bookings by revenue                           |

## Chart Components

| Component              | Type        | Use Case                            |
| ---------------------- | ----------- | ----------------------------------- |
| `DonutChart`           | Pie/Donut   | Category breakdowns (2-4 segments)  |
| `SemiCircleChart`      | Half-pie    | Top N rankings with "Other" segment |
| `ComparativeLineChart` | Line        | Time series with comparison periods |
| `MetricWithComparison` | Metric      | Single value with delta indicator   |
| `ReportMetricWidget`   | Metric      | Report-based metrics with sparkline |
| `LeaderboardChart`     | Leaderboard | Top N items with bars and labels    |

## Common Utilities

Shared code is located in `common/`:

### Styles

- `donut-widget.module.scss` - Container styles for DonutChart widgets

### Hooks

- `useSegmentStyles( chartData )` - Builds segment colors from theme provider

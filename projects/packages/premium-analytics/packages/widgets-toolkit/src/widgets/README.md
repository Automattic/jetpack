# Widgets

Dashboard widget components for Jetpack Premium Analytics.

## Available Widgets

| Widget                         | Chart Component                                 | Description                                       |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------------- |
| `ConversionRateWidget`         | `MetricWithComparison`                          | Funnel conversion rate metric                     |
| `RevenueByCustomerTypeWidget`  | `BarChart`                                      | Revenue breakdown by customer type                |
| `NewVsReturningCustomerWidget` | `Donut`                                         | Customer counts by new vs returning               |
| `SalesByCouponWidget`          | `SemiCircleChart`                               | Coupon sales for all product types                |
| `SalesByDeviceWidget`          | `BarChart`                                      | Sales breakdown by device type                    |
| `TotalReturnsWidget`           | `BarChart`                                      | Returns/refunds for all product types             |
| `TopPerformingProductsWidget`  | `LeaderboardChart`                              | Top products by revenue                           |
| `TopPerformingBookingsWidget`  | `LeaderboardChart`                              | Top bookings by revenue                           |

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

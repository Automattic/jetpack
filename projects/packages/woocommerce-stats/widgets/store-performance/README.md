# Store performance

Tabs over a comparison chart, one per metric. The widget owns five metrics (`metrics.ts`); a plugin adds its own through a filter, and the user picks what shows from the Metrics menu in the widget header. The Chart type toggle beside it draws them as lines or bars.

## Add a metric

Register a `StorePerformanceMetric` (contract in `src/store-performance/metric.ts`) on the `jetpack.woocommerceStats.storePerformance.metrics` filter of `@wordpress/hooks`. Return the list with your metric in; never replace it.

```ts
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const refunds = {
	id: 'my-plugin/refunds',
	order: 45,
	label: __( 'Refunds', 'my-plugin' ),
	description: __( 'Orders refunded in the period.', 'my-plugin' ),
	field: 'refunds_no',
	dataFormat: { type: 'number' },
	useReport: params => useReport( refundsQuery, params ),
};

addFilter(
	'jetpack.woocommerceStats.storePerformance.metrics',
	'my-plugin/store-performance',
	metrics => [ ...metrics, refunds ]
);
```

`refundsQuery( params, queryType )` returns the SDK's `ReportQuery` for one period: a query key and a fetcher. `useReport` runs it for the selected period and, when the dashboard compares, for the previous one.

| Field                  | What it does                                                                                                                                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | Keys the tab and names the metric in the `hiddenMetrics` attribute. Unique: a repeat is dropped.                                                                                                                                                                                              |
| `order`                | Tab position, lowest first. The widget's own run 10 to 50. Absent, the tab goes after every placed one, in registration order.                                                                                                                                                                |
| `label`, `description` | The tab and the text shown with it.                                                                                                                                                                                                                                                           |
| `field`                | The key the chart reads from the report's summary and from each of its rows.                                                                                                                                                                                                                  |
| `dataFormat`           | How values are formatted: `{ type: 'number' \| 'currency' \| 'percentage', options? }`.                                                                                                                                                                                                       |
| `countLabel`           | Optional. The pill text for a count, as `_n( '%s Order', '%s Orders', count )`.                                                                                                                                                                                                               |
| `useReport`            | A React hook. Takes the dashboard's `ReportParams` (`from`, `to`, `interval`, the comparison range) and returns the SDK's `ReportResult`: `primary` and `comparison`, `timezone`, the status flags and `refetch`. Build it on the SDK's `useReport`, so the dashboard's query client runs it. |

An entry missing any of these, or with an `order` that is not a number, is dropped. A filter that returns no array is ignored.

## When to register

Whenever the module is ready. The widget reads the list again each time the filter gains or loses a registrant (`hookAdded`, `hookRemoved`), so the chart follows it live, and only the reports of the shown metrics run. `@wordpress/hooks` is externalized to the `wp.hooks` global, so a separate script module shares the registry with the widget.

A metric registered later shows on every widget until the user unticks it: the `hiddenMetrics` attribute stores what was switched off, not what was picked.

## Reference registrant

`packages/store-performance-bookings/` adds Bookings after Orders (`order: 25`): a script module the package enqueues on a store running WooCommerce Bookings, which registers once its translation catalog is in. Its README says what it is written against.

## Files

- `metrics.ts`: the widget's metrics and `getStorePerformanceMetrics()`, which applies the filter, validates, drops repeats and sorts by `order`.
- `use-store-performance-metrics.ts`: the list as a React external store, read again on filter changes.
- `widget.json`: the header order, with `hiddenMetrics` named by id only so it leads, and the `chartType` attribute, a `jpa/toggle-group` of line and bar.
- `widget.ts`: the `hiddenMetrics` attribute, a `jpa/array-checkbox` field whose options are the metrics on offer.
- `render.tsx`: one `MetricReport` child per shown metric, which runs the metric's hook; the chart draws from their reports.

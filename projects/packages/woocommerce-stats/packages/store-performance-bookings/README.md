# Store performance: the Bookings metric

A script module that offers the Bookings metric to the Store performance widget, through the `jetpack.woocommerceStats.storePerformance.metrics` filter. The package enqueues it on the dashboard page on a store running the WooCommerce Bookings extension, until the extension offers the metric itself.

It imports nothing from the package's `src/`, on purpose: it is written as WooCommerce Bookings would ship it, against three contracts only.

- The widget's: the filter name and the metric shape (`StorePerformanceMetric` in `src/bookings-metric.ts` mirrors `src/store-performance/metric.ts`).
- The package's proxy: `orders-by-product-type/by-date` with a `product_type` filter, read for `orders_no` alone. `src/use-bookings-report.ts` is a trimmed copy of the package's orders report client (`src/reports`: the orders query, `fetchPreservingStatus` and the error shaping of `fetch-report.ts`, row parsing and the site zone).
- The dashboard SDK: `useReport` and `toBucketStamp`.

Keep the copies in step when the contract, the route or the row shape changes.

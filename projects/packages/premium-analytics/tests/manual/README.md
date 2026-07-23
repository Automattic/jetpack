# Bookings CSV export manual test helper

This test-only WordPress plugin supplies representative responses for the two
Bookings analytics routes used by the Premium Analytics CSV export. It is useful
when WooCommerce Bookings or synced Bookings analytics data is unavailable.

## Set up

Copy or symlink `bookings-export-mock.php` into the test site's
`wp-content/mu-plugins` directory. Ensure Jetpack, WooCommerce, and the Premium
Analytics plugin are active and Jetpack is connected.

The helper is opt-in: no mock is active unless this file is installed as a
plugin. It intercepts only analytics proxy calls nested inside the
`bookingsovertime` and `bookingstatusbreakdown` CSV exports.

## Test

1. In WP Admin, open **Tools → Bookings export mock**.
2. Download the **Bookings over time** CSV.
3. Confirm the columns are `Day`, `Bookings created`, and their
   `Previous Period` counterparts.
4. Confirm the two current-period counts are `71` and `72`, and the previous
   period counts are `61` and `62`.
5. Download the **Booking status breakdown** CSV.
6. Confirm the columns are `Day`, `Completed`, `Pending`, `Cancelled`, and
   their `Previous Period` counterparts.
7. Confirm the current-period rows contain `8, 11, 1` and `9, 14, 2`, while
   the previous-period rows contain `7, 10, 1` and `8, 13, 2`.

Remove the test helper from `wp-content/mu-plugins` when testing is complete.

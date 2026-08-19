/**
 * Rows a list widget requests from Stats.
 *
 * Widgets sit in fixed-height tiles and only render the rows that fit, so the
 * count is not something a reader can usefully tune from the widget itself —
 * report pages own "show me more rows" through their own pagination control.
 */
export const WIDGET_ROW_LIMIT = 10;

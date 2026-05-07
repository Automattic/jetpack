// The clear-filters block is a thin wrapper around the shared store's
// `actions.clearFilters` action and `state.hasActiveFilters` getter — both
// already live in `../../store`. Importing the store here ensures the bundle
// picks up the shared module so `data-wp-on--click` and `data-wp-bind--hidden`
// resolve when the block is hydrated in isolation (e.g. dropped onto a
// page outside the parent wrapper).
import '../../store';
import './style.scss';

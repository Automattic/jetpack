// Same shape as filter-checkbox + the attribute filter — every
// checkbox-shaped product filter block reads `state.filterItems` /
// `state.hasFilterBuckets` / `actions.onFilterChange` from the shared
// store. This file just hooks the bundle up so the bindings hydrate.
import '../../store';
import './style.scss';

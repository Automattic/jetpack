// The attribute block reuses every state getter and action of the shared
// store — same DOM shape as filter-checkbox, same `state.filterItems` /
// `state.hasFilterBuckets` / `actions.onFilterChange` bindings. This file
// exists so the block has its own webpack entry (and its own style.scss
// hook); all behavior lives in `../../store`.
import '../../store';
import './style.scss';

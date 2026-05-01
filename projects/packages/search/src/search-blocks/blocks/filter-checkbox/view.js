// View bundle for jetpack/filter-checkbox.
//
// The block's runtime behavior — `hasFilterBuckets`, `allBucketsSelected`,
// `filterItems`, `actions.onFilterChange` — lives on the shared
// `jetpack-search` namespace in `store/index.js`. Each filter block type
// would otherwise re-register identically-named getters into the same
// namespace and clobber its siblings (Interactivity API merges later
// `store()` patches), so this file only pulls in styles and the shared
// store. Keeping the import means the block continues to ship its CSS
// independently and stays a recognizable per-block bundle in webpack
// stats — a future filter-block pattern (e.g. a UI-only sub-control)
// can hook into the same module without disturbing the shared layer.
import '../../store';
import './style.scss';

// View bundle for jetpack/filter-date.
//
// The block's runtime behavior — `hasFilterBuckets`, `allBucketsSelected`,
// `filterItems`, `actions.onFilterChange` — lives on the shared
// `jetpack-search` namespace in `store/index.js`, type-dispatching on
// `filterConfigs[filterKey].filterType === 'date'`. Co-locating the
// dispatch in one place is what prevents the two view bundles from
// clobbering each other's getters when a page mounts both.
import '../../store';
import './style.scss';

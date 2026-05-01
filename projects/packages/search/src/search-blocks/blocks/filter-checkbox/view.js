// The filter-checkbox block reads `state.filterItems`, `state.hasFilterBuckets`,
// `state.allBucketsSelected`, and `actions.onFilterChange` — all of which live
// in the shared store (`../../store`) so the new product-shape filter blocks
// (attribute, taxonomy) can reuse the same getters without each view bundle
// re-implementing them. Importing the store here ensures the bundle
// hydrates the shared module so the bindings in render.php resolve.
import '../../store';
import './style.scss';

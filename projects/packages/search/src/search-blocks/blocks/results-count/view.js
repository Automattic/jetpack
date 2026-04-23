// The results-count block binds `data-wp-text="state.resultsCountText"`; the
// getter lives in `../../store` where it can read the seeded `state.strings`
// (including the translated `resultsCountTemplate` default and any per-render
// override from render.php). Importing the store here guarantees the module
// ships whenever this block is on the page, and the stylesheet import brings
// in the block's flex-row styling.
import '../../store';
import './style.scss';

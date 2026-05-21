// Runtime behavior lives on the shared store in `store/index.js`. Per-block
// re-registration would clobber sibling filter blocks (Interactivity API
// merges later `store()` patches).
import 'jetpack-search/store';
import './style.scss';

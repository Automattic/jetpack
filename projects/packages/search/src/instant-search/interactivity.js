import './components/search-app.scss';
import './components/gridicon/style.scss';
import './components/jetpack-colophon.scss';
import './components/notice.scss';
import './components/overlay.scss';
import './components/path-breadcrumbs.scss';
import './components/product-price.scss';
import './components/product-ratings.scss';
import './components/scroll-button.scss';
import './components/search-box.scss';
import './components/search-controls.scss';
import './components/search-filters.scss';
import './components/search-result-comments.scss';
import './components/search-result-expanded.scss';
import './components/search-result-minimal.scss';
import './components/search-result-product.scss';
import './components/search-result.scss';
import './components/search-results.scss';
import './components/search-sort.scss';
import './components/sidebar.scss';
import './components/tabbed-search-filters.scss';
import './components/widget-area-container.scss';

import * as iAPI from '@wordpress/interactivity';

console.log( iAPI.getConfig( 'jetpack/instant-search' ).options );
const { state } = iAPI.store( 'jetpack/instant-search', {} );

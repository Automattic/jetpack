import { render } from '@wordpress/element';
import Layout from 'components/layout';
import 'styles.scss';

/**
 * Initializes the widgets screen
 *
 * @param {string} id - Id of the root element to render the screen.
 */
function initialize( id ) {
	render( <Layout />, document.getElementById( id ) );
}

global.jetpackSearchConfigureInit = initialize;

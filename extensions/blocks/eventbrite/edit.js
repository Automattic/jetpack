/**
 * External dependencies
 */
import { Component } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

class EventbriteEdit extends Component {
	componentDidMount = () => {
		apiFetch( {
			path: '/jetpack/v4/integrations/eventbrite',
		} );
	};

	render() {
		return 'HELLO WORLD!';
	}
}

export default EventbriteEdit;

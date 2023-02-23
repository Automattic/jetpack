import { render } from '@wordpress/element';
import { Provider } from 'react-redux';
import Inbox from './inbox';
import store from './state';

window.addEventListener( 'load', () => {
	const container = document.getElementById( 'jp-forms-dashboard' );

	render(
		<Provider store={ store }>
			<Inbox />
		</Provider>,
		container
	);
} );

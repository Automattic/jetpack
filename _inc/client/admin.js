import ReactDOM from 'react-dom';
import React from 'react';
import {Provider} from 'react-redux';

import store from 'state/redux-store';
import Navigation from 'components/navigation';

ReactDOM.render(
	<div>
		<Provider store={store}>
			<Navigation />
		</Provider>
	</div>,
	document.getElementById( 'react-plugin-container' )
);

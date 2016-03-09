import ReactDOM from 'react-dom';
import React from 'react';
import Container from './components/container';
import Navigation from './components/navigation';

ReactDOM.render(
	<div>
		<Container />
		<Navigation />
	</div>,
	document.getElementById( 'react-plugin-container' )
);
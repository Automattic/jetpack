/**
 * External dependencies
 */
import React, { Component, createRef } from 'react';

/**
 * Internal dependencies
 */
import './widget-area-container.scss';

// NOTE:
//
// We use Preact.Component instead of a Hooks based component because
// we need to set shouldComponentUpdate to always return false.
//
export default class WidgetAreaContainer extends Component {
	container = createRef();

	componentDidMount() {
		const widgetArea = document.getElementsByClassName(
			'jetpack-instant-search__widget-area'
		)[ 0 ];

		if ( widgetArea ) {
			widgetArea.style.removeProperty( 'display' );
			this.container.current.appendChild( widgetArea );
		}
	}

	shouldComponentUpdate() {
		return false;
	}

	render() {
		return (
			<div className="jetpack-instant-search__widget-area-container" ref={ this.container }></div>
		);
	}
}

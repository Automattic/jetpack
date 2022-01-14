/**
 * External dependencies
 */
import { Component } from 'react';

/**
 * Internal dependencies
 */
import { bindCustomizerChanges, bindCustomizerMessages } from '../lib/customize';

// This component is used to bind WordPress Customizer events to the Jetpack Search application.
export default class CustomizerEventHandler extends Component {
	componentDidMount() {
		bindCustomizerChanges( this.handleOverlayOptionsUpdate );
		bindCustomizerMessages( this.props.toggleResults );
	}

	handleOverlayOptionsUpdate = newOverlayOptions => {
		this.props.updateOverlayOptions( newOverlayOptions, () => this.props.showResults() );
	};

	render() {
		return null;
	}
}

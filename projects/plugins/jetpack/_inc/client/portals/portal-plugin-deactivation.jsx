/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import JetpackDisconnectModal from '../components/jetpack-termination-dialog/disconnect-modal';
import PortalSidecar from './utilities/portal-sidecar';

const deactivationLink = document.getElementById( 'deactivate-jetpack' ); // ID set by WP on the deactivation link

// this is a class component to avoid passing an arrow function as a prop for toggleModal
// could refactor to functional component, but would need to ignore some linter rules
class PluginDeactivationPortal extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			modalOpen: false,
		};

		// modify the deactivation link
		// deactivate_dialog is a localized variable
		const deactivate_dialog = window.deactivate_dialog;
		deactivationLink.setAttribute( 'title', deactivate_dialog.title );
		deactivationLink.textContent = deactivate_dialog.deactivate_label;
	}

	componentDidMount() {
		deactivationLink.addEventListener( 'click', this.handleLinkClick );
		deactivationLink.addEventListener( 'keydown', this.handleLinkKeyDown );
	}

	componentWillUnmount() {
		deactivationLink.removeEventListener( 'click', this.handleLinkClick );
		deactivationLink.removeEventListener( 'keydown', this.handleLinkKeyDown );
	}

	toggleVisibility = () => {
		this.setState( { modalOpen: ! this.state.modalOpen } );
	};

	handleLinkClick = e => {
		e.preventDefault();
		this.toggleVisibility();
	};

	handleLinkKeyDown = e => {
		if ( [ 'Enter', 'Space', 'Spacebar', ' ' ].indexOf( e.key ) > -1 ) {
			e.preventDefault();
			this.toggleVisibility();
		}
	};

	render() {
		return (
			<PortalSidecar>
				<JetpackDisconnectModal
					show={ this.state.modalOpen }
					showSurvey={ false }
					toggleModal={ this.toggleVisibility }
				/>
			</PortalSidecar>
		);
	}
}

export default PluginDeactivationPortal;

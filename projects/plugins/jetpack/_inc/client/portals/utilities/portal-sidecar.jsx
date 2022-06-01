import React from 'react';
import ReactDOM from 'react-dom';

// Portal entry point loaded in the footer.
const portalSidecar = document.getElementById( 'jetpack-plugin-portal-sidecar' );

// Portal pattern from React docs: https://reactjs.org/docs/portals.html.
// This approach (creating arbitrary DOM nodes to bind to) does not seem to work with a functional component.
class PortalSidecar extends React.Component {
	constructor( props ) {
		super( props );
		this.portalNode = document.createElement( 'div' );
	}

	componentDidMount() {
		portalSidecar.appendChild( this.portalNode );
	}

	componentWillUnmount() {
		portalSidecar.removeChild( this.portalNode );
	}

	render() {
		return ReactDOM.createPortal( this.props.children, this.portalNode );
	}
}

export default PortalSidecar;

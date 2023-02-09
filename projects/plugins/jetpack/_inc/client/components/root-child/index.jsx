/** @ssr-ready **/

import * as WPElement from '@wordpress/element';
import PropTypes from 'prop-types';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

export default class RootChild extends React.Component {
	static displayName = 'RootChild';

	static propTypes = {
		children: PropTypes.node,
	};

	static contextTypes = {
		store: PropTypes.object,
	};

	componentDidMount() {
		this.container = document.createElement( 'div' );
		document.body.appendChild( this.container );
		// @todo: Remove fallback when we drop support for WP 6.1
		if ( WPElement.createRoot ) {
			this.containerRoot = WPElement.createRoot( this.container );
		} else {
			const theContainer = this.container;
			this.containerRoot = {
				render: component => WPElement.render( component, theContainer ),
				unmount: () => WPElement.unmountComponentAtNode( theContainer ),
			};
		}
		this.renderChildren();
	}

	componentDidUpdate() {
		this.renderChildren();
	}

	componentWillUnmount() {
		if ( ! this.container ) {
			return;
		}

		// Root has to be unmounted asynchronously.
		const root = this.containerRoot;
		setTimeout( () => {
			root.unmount();
		} );

		document.body.removeChild( this.container );
		delete this.container;
		delete this.containerRoot;
	}

	renderChildren = () => {
		let content;

		if ( this.props && ( Object.keys( this.props ).length > 1 || ! this.props.children ) ) {
			content = <div { ...this.props }>{ this.props.children }</div>;
		} else {
			content = this.props.children;
		}

		// Context is lost when creating a new render hierarchy, so ensure that
		// we preserve the context that we care about
		if ( this.context.store ) {
			content = <ReduxProvider store={ this.context.store }>{ content }</ReduxProvider>;
		}

		this.containerRoot.render( content );
	};

	render() {
		return null;
	}
}

// Catches render-time errors anywhere under the SPA so a broken tab doesn't
// blank the whole admin page. Sites left in this state can recover with a
// reload — we surface that affordance instead of a stack trace.

import { Notice } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
	children: ReactNode;
}

interface State {
	error: Error | null;
}

export default class ErrorBoundary extends Component< Props, State > {
	state: State = { error: null };

	static getDerivedStateFromError( error: Error ): State {
		return { error };
	}

	componentDidCatch( error: Error, info: ErrorInfo ) {
		// eslint-disable-next-line no-console
		console.error( '[jetpack-podcast]', error, info.componentStack );
	}

	render() {
		if ( this.state.error ) {
			return (
				<Notice status="error" isDismissible={ false }>
					{ __( 'Something went wrong loading the Podcast dashboard.', 'jetpack-podcast' ) }
				</Notice>
			);
		}
		return this.props.children;
	}
}

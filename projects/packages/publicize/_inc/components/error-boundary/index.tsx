// Contains render errors so a crash in a panel doesn't blank the whole editor.

import { Component } from '@wordpress/element';
import type { ReactNode } from 'react';

interface Props {
	children: ReactNode;
	/** Rendered in place of the children after an error is caught. */
	fallback?: ReactNode;
}

interface State {
	error: Error | null;
}

export default class ErrorBoundary extends Component< Props, State > {
	state: State = { error: null };

	static getDerivedStateFromError( error: Error ): State {
		return { error };
	}

	componentDidCatch( error: Error ) {
		// eslint-disable-next-line no-console
		console.error( '[jetpack-social]', error );
	}

	render() {
		if ( this.state.error ) {
			return this.props.fallback ?? null;
		}

		return this.props.children;
	}
}

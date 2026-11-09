import { Component } from 'react';
import { reportError } from './report-error';
import type { ErrorInfo, ReactNode } from 'react';

interface State {
	caught: Error | null;
	rethrow: boolean;
}

export class StatsErrorBoundary extends Component< { children: ReactNode }, State > {
	state: State = { caught: null, rethrow: false };

	static getDerivedStateFromError( error: Error ): Partial< State > {
		return { caught: error };
	}

	componentDidCatch( error: Error, info: ErrorInfo ) {
		reportError( error, 'boundary', { componentStack: info.componentStack ?? undefined } );
		// Rethrowing needs a commit to schedule from, so render null once and throw on the sync re-render.
		this.setState( { rethrow: true } );
	}

	render() {
		if ( this.state.rethrow && this.state.caught ) {
			throw this.state.caught;
		}
		return this.state.caught ? null : this.props.children;
	}
}

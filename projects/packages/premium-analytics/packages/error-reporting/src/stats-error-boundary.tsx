import { Component } from 'react';
import { reportError } from './report-error';
import type { ErrorInfo, ReactNode } from 'react';

interface State {
	caught: { error: unknown } | null;
	rethrow: boolean;
}

export class StatsErrorBoundary extends Component< { children: ReactNode }, State > {
	state: State = { caught: null, rethrow: false };

	static getDerivedStateFromError( error: unknown ): Partial< State > {
		return { caught: { error } };
	}

	componentDidCatch( error: unknown, info: ErrorInfo ) {
		reportError( error, 'boundary', { componentStack: info.componentStack ?? undefined } );
		// Rethrowing needs a commit to schedule from, so render null once and throw on the sync re-render.
		this.setState( { rethrow: true } );
	}

	render() {
		const { caught, rethrow } = this.state;
		if ( caught && rethrow ) {
			throw caught.error;
		}
		return caught ? null : this.props.children;
	}
}

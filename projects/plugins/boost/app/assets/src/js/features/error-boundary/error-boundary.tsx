import type { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
	fallback: ( error: Error ) => ReactNode;
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

class ErrorBoundary extends Component< Props, State > {
	constructor( props: Props ) {
		super( props );
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError( error: Error ): State {
		return { hasError: true, error };
	}

	componentDidCatch( error: Error, errorInfo: ErrorInfo ): void {
		// eslint-disable-next-line no-console
		console.error( error, errorInfo );
	}

	render(): ReactNode {
		if ( this.state.hasError && this.state.error ) {
			return this.props.fallback( this.state.error );
		}
		return this.props.children;
	}
}

export default ErrorBoundary;

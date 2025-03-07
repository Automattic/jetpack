import React from 'react';

interface Props {
	fallback: React.ReactElement< { error?: Error } >;
	children: React.ReactNode;
}

interface State {
	error?: Error;
}

class ErrorBoundary extends React.Component< Props, State > {
	constructor( props: Props ) {
		super( props );
		this.state = { error: undefined };
	}

	static getDerivedStateFromError( error: Error ): State {
		return { error };
	}

	componentDidCatch( error: Error, errorInfo: React.ErrorInfo ): void {
		// eslint-disable-next-line no-console
		console.error( error, errorInfo );
	}

	render(): React.ReactNode {
		if ( this.state.error ) {
			// If fallback is a React element, pass the error as a prop
			if ( React.isValidElement( this.props.fallback ) ) {
				return React.cloneElement( this.props.fallback, { error: this.state.error } );
			}
			return this.props.fallback || null;
		}
		return this.props.children;
	}
}

export default ErrorBoundary;

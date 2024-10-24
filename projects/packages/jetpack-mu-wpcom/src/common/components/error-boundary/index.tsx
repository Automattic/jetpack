import { __ } from '@wordpress/i18n';
import React from 'react';

interface Props {
	fallback?: React.ReactNode;
	children: React.ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

class ErrorBoundary extends React.Component< Props, State > {
	constructor( props: Props ) {
		super( props );
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError( error: Error ): State {
		return { hasError: true, error };
	}

	componentDidCatch( error: Error, errorInfo: React.ErrorInfo ): void {
		// eslint-disable-next-line no-console
		console.error( error, errorInfo );
	}

	render(): React.ReactNode {
		const { children, fallback } = this.props;
		const { hasError } = this.state;

		if ( hasError ) {
			return fallback !== undefined ? (
				fallback
			) : (
				<p>{ __( 'Something went wrong', 'jetpack-mu-wpcom' ) } </p>
			);
		}

		return children;
	}
}

export default ErrorBoundary;

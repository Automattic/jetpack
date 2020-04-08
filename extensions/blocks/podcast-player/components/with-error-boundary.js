/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function withErrorBoundary( WrappedComponent ) {
	class ErrorBoundary extends Component {
		state = {
			didError: false,
		};

		componentDidCatch = ( error, errorInfo ) => {
			this.props.onError( error, errorInfo );
		};

		static getDerivedStateFromError = () => {
			return { didError: true };
		};

		render() {
			if ( this.state.didError ) {
				return (
					<section className="jetpack-podcast-player">
						<p className="jetpack-podcast-player__error">
							{ __(
								'An unexpected error occured within the Podcast Player. Please reload the page.',
								'jetpack'
							) }
						</p>
					</section>
				);
			}

			return <WrappedComponent { ...this.props } />;
		}
	}

	ErrorBoundary.defaultProps = {
		onError: () => {},
	};

	return ErrorBoundary;
}

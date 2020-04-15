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
				// There is a known error where IE11 doesn't support the <audio> element by
				// default but errors instead. If the user is using IE11 we thus provide
				// additional instructions on how they can turn on <audio> support.
				const isIE11 = window.navigator.userAgent.match( /Trident\/7\./ );
				return (
					<section className="jetpack-podcast-player">
						<p className="jetpack-podcast-player__error">
							{ isIE11
								? __(
										'The podcast player cannot be displayed as your browser settings do not allow for sounds to be played in webpages. This can be changed in your browser’s "Internet options" settings. In the "Advanced" tab you will have to check the box next to "Play sounds in webpages" in the "Multimedia" section. Once you have confirmed that the box is checked, please press "Apply" and then reload this page.',
										'jetpack'
								  )
								: __(
										'An unexpected error occured within the Podcast Player. Reloading this page might fix the problem.',
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

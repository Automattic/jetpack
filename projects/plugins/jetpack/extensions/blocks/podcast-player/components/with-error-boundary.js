import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function withErrorBoundary( WrappedComponent ) {
	class ErrorBoundary extends Component {
		state = {
			didError: false,
			isIE11AudioIssue: false,
		};

		componentDidCatch = ( error, errorInfo ) => {
			this.props.onError( error, errorInfo );
		};

		static getDerivedStateFromError = error => {
			// There is a known error where IE11 doesn't support the <audio> element by
			// default but errors instead. If the user is using IE11 we thus provide
			// additional instructions on how they can turn on <audio> support.
			return { didError: true, isIE11AudioIssue: error.message.match( /IE11/ ) ? true : false };
		};

		render() {
			const { didError, isIE11AudioIssue } = this.state;
			if ( didError ) {
				return (
					<section className="jetpack-podcast-player">
						<p className="jetpack-podcast-player__error">
							{ isIE11AudioIssue
								? __(
										'The podcast player cannot be displayed as your browser settings do not allow for sounds to be played in webpages. This can be changed in your browser’s "Internet options" settings. In the "Advanced" tab you will have to check the box next to "Play sounds in webpages" in the "Multimedia" section. Once you have confirmed that the box is checked, please press "Apply" and then reload this page.',
										'jetpack'
								  )
								: __(
										'An unexpected error occured within the Podcast Player. Reloading this page might fix the problem.',
										'jetpack',
										/* dummy arg to avoid bad minification */ 0
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

/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';

class Overlay extends Component {
	closeOnEscapeKey = event => {
		if ( event.key === 'Escape' ) {
			this.props.toggleOverlay();
		}
	};

	componentDidMount() {
		window.addEventListener( 'keydown', this.closeOnEscapeKey );
	}

	componentWillUnmount() {
		window.removeEventListener( 'keydown', this.closeOnEscapeKey );
	}

	render() {
		const { showOverlay, toggleOverlay, children } = this.props;

		const classNames = [ 'jetpack-instant-search__overlay' ];
		if ( ! showOverlay ) {
			classNames.push( 'is-hidden' );
		}

		return (
			<div className={ classNames.join( ' ' ) }>
				<button className="jetpack-instant-search__overlay-close" onClick={ toggleOverlay }>
					{ __( 'Close', 'jetpack' ) }
				</button>
				{ children }
			</div>
		);
	}
}

export default Overlay;

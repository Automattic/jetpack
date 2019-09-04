/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import Spinner from './spinner';

class ScrollButton extends Component {
	render() {
		const { loading = false, onClick } = this.props;
		if ( loading ) {
			return (
				<button className="jetpack-instant-search__more-button" disabled={ true }>
					{ __( 'Loading' ) }
					<Spinner size={ 24 } />
				</button>
			);
		}
		return (
			<button className="jetpack-instant-search__more-button" onclick={ onClick }>
				<Gridicon icon="chevron-down" size={ 24 } />
				<span>{ __( 'More' ) }</span>
				<Gridicon icon="chevron-down" size={ 24 } />
			</button>
		);
	}
}

export default ScrollButton;

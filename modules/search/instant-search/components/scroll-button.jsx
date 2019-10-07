/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';

class ScrollButton extends Component {
	render() {
		return (
			<button
				className="jetpack-instant-search__more-button"
				disabled={ this.props.isLoading }
				onclick={ this.props.onClick }
			>
				{ this.props.isLoading ? (
					<span>{ __( 'Loading results…', 'jetpack' ) }</span>
				) : (
					<span>{ __( 'Load more results', 'jetpack' ) }</span>
				) }
			</button>
		);
	}
}

export default ScrollButton;

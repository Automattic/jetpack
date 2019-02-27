/**
 * External dependencies
 */
const PropTypes = require( 'prop-types' );
const React = require( 'react' ),
	map = require( 'lodash/map' );
import { translate as __ } from 'i18n-calypso';

export default class ValidationErrorList extends React.Component {
	static displayName = 'ValidationErrorList';

	static propTypes = {
		messages: PropTypes.array.isRequired,
	};

	render() {
		return (
			<div>
				<p>
					{ __(
						'Please correct the issue below and try again.',
						'Please correct the issues listed below and try again.',
						{
							count: this.props.messages.length,
						}
					) }
				</p>
				<ul>
					{ map( this.props.messages, function( message, index ) {
						return <li key={ index }>{ message }</li>;
					} ) }
				</ul>
			</div>
		);
	}
}

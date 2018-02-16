/**
 * External dependencies
 */
const PropTypes = require( 'prop-types' );
const React = require( 'react' ),
	map = require( 'lodash/map' );
import { translate as __ } from 'i18n-calypso';

module.exports = React.createClass( {
	displayName: 'ValidationErrorList',

	propTypes: {
		messages: PropTypes.array.isRequired
	},

	render: function() {
		return (
			<div>
				<p>
					{ __(
						'Please correct the issue below and try again.',
						'Please correct the issues listed below and try again.',
						{
							count: this.props.messages.length
						}
					) }
				</p>
				<ul>
					{ map( this.props.messages, function( message, index ) {
						return ( <li key={ index }>{ message }</li> );
					} ) }
				</ul>
			</div>
		);
	}
} );

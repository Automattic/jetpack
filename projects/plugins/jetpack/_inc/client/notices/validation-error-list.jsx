/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { map } from 'lodash';
import { _n } from '@wordpress/i18n';

export default class ValidationErrorList extends React.Component {
	static displayName = 'ValidationErrorList';

	static propTypes = {
		messages: PropTypes.array.isRequired,
	};

	render() {
		return (
			<div>
				<p>
					{ _n(
						'Please correct the issue below and try again.',
						'Please correct the issues listed below and try again.',
						this.props.messages.length,
						'jetpack'
					) }
				</p>
				<ul>
					{ map( this.props.messages, function ( message, index ) {
						return <li key={ index }>{ message }</li>;
					} ) }
				</ul>
			</div>
		);
	}
}

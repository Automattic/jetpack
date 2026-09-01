import { _n } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { Component } from 'react';

export default class ValidationErrorList extends Component {
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
					{ this.props.messages.map( function ( message, index ) {
						return <li key={ index }>{ message }</li>;
					} ) }
				</ul>
			</div>
		);
	}
}

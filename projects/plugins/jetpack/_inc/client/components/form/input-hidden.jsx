/**
 * External Dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { withFormsy } from 'formsy-react';

export default withFormsy(
	class extends React.Component {
		static displayName = 'HiddenInput';

		static propTypes = {
			name: PropTypes.string.isRequired,
		};

		render() {
			return <input type="hidden" value={ this.getValue() } />;
		}
	}
);

/**
 * External Dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import Formsy from 'formsy-react';
import createReactClass from 'create-react-class';

export default createReactClass( {
	displayName: 'HiddenInput',

	mixins: [ Formsy.Mixin ],

	propTypes: {
		name: PropTypes.string.isRequired,
	},

	render: function () {
		return <input type="hidden" value={ this.getValue() } />;
	},
} );

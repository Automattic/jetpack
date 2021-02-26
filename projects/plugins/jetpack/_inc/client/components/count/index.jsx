/** @ssr-ready **/

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import createReactClass from 'create-react-class';
import PureRenderMixin from 'react-pure-render/mixin';

import './style.scss';

export default createReactClass( {
	displayName: 'Count',

	mixins: [ PureRenderMixin ],

	propTypes: {
		count: PropTypes.number.isRequired,
	},

	render() {
		return <span className="dops-count">{ this.numberFormat( this.props.count ) }</span>;
	},
} );

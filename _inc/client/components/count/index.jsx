/** @ssr-ready **/

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

import React from 'react';
import PureRenderMixin from 'react-pure-render/mixin';

require( './style.scss' );

export default React.createClass( {

	displayName: 'Count',

	mixins: [ PureRenderMixin ],

	propTypes: {
		count: PropTypes.number.isRequired,
	},

	render() {
		return (
			<span className="dops-count">{ this.numberFormat( this.props.count ) }</span>
		);
	}
} );

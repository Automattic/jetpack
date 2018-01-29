/**
 * External dependencies
 */
import React from 'react';
import PureRenderMixin from 'react-pure-render/mixin';
import classnames from 'classnames';
import assign from 'lodash/assign';
import omit from 'lodash/omit';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';

require( './style.scss' );

export default React.createClass( {

	displayName: 'ExternalLink',

	mixins: [ PureRenderMixin ],

	propTypes: {
		className: React.PropTypes.string,
		href: React.PropTypes.string,
		onClick: React.PropTypes.func,
		icon: React.PropTypes.bool,
		iconSize: React.PropTypes.number
	},

	getDefaultProps() {
		return {
			iconSize: 18
		};
	},

	render() {
		const classes = classnames( 'dops-external-link', this.props.className, {
			'has-icon': !! this.props.icon,
		} );

		const props = assign( {}, omit( this.props, 'icon', 'iconSize' ), {
			className: classes,
			rel: 'external'
		} );

		return (
			<a { ...props }>
				{ this.props.children }
				{ this.props.icon ? <Gridicon icon="external" size={ this.props.iconSize } /> : null }
			</a>
		);
	}
} );

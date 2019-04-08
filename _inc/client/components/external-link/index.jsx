/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import createReactClass from 'create-react-class';
import PureRenderMixin from 'react-pure-render/mixin';
import classnames from 'classnames';
import { assign, omit } from 'lodash';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';
import './style.scss';

export default createReactClass( {
	displayName: 'ExternalLink',

	mixins: [ PureRenderMixin ],

	propTypes: {
		className: PropTypes.string,
		href: PropTypes.string,
		onClick: PropTypes.func,
		icon: PropTypes.bool,
		iconSize: PropTypes.number,
	},

	getDefaultProps() {
		return {
			iconSize: 18,
		};
	},

	render() {
		const classes = classnames( 'dops-external-link', this.props.className, {
			'has-icon': !! this.props.icon,
		} );

		const props = assign( {}, omit( this.props, 'icon', 'iconSize' ), {
			className: classes,
			rel: 'external',
		} );

		return (
			<a { ...props }>
				{ this.props.children }
				{ this.props.icon ? <Gridicon icon="external" size={ this.props.iconSize } /> : null }
			</a>
		);
	},
} );

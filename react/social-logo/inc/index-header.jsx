
/* !!!
IF YOU ARE EDITING social-logo/index.jsx
THEN YOU ARE EDITING A FILE THAT GETS OUTPUT FROM THE SOCIAL LOGO REPO!
DO NOT EDIT THAT FILE! EDIT index-header.jsx and index-footer.jsx instead
OR if you're looking to change now SVGs get output, you'll need to edit strings in the Gruntfile :)
!!! */

/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import PureRenderMixin from 'react-pure-render/mixin';
import classNames from 'classnames';

export default React.createClass( {
	displayName: 'SocialLogo',
	mixins: [ PureRenderMixin ],

	getDefaultProps() {
		return {
			className: '',
			size: 24
		};
	},

	propTypes: {
		icon: PropTypes.string.isRequired,
		size: PropTypes.number,
		onClick: PropTypes.func,
		className: PropTypes.string
	},

	render() {
		const icon = this.props.icon;

		const iconClass = classNames(
			this.props.className,
			icon,
			'social-logo'
		);
		let svg = null;

		switch ( icon ) {
			default:
				svg = <svg height={ this.props.size } width={ this.props.size } />;
				break;

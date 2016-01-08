
/* !!!
IF YOU ARE EDITING gridicon/index.jsx
THEN YOU ARE EDITING A FILE THAT GETS OUTPUT FROM THE GRIDICONS REPO!
DO NOT EDIT THAT FILE! EDIT index-header.jsx and index-footer.jsx instead
OR if you're looking to change now SVGs get output, you'll need to edit strings in the Gruntfile :)
!!! */

/**
 * External dependencies
 */
import React from 'react';
import classNames  from 'classnames';

export default React.createClass( {

	getDefaultProps() {
		return {
			className: '',
			size: 24
		};
	},

	propTypes: {
		icon: React.PropTypes.string.isRequired,
		size: React.PropTypes.number,
		onClick: React.PropTypes.func,
		className: React.PropTypes.string
	},

	render() {
		const icon = 'social-logo-' + this.props.icon;

		const iconClass = classNames(
			this.props.className,
			icon,
			'social-logo'
		);

		switch ( icon ) {
			default:
				let svg = <svg height={ this.props.size } width={ this.props.size } />;
				break;

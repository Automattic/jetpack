/** @ssr-ready **/

/* !!!
IF YOU ARE EDITING build/index.jsx
THEN YOU ARE EDITING A FILE THAT GETS OUTPUT FROM THE SOCIAL LOGOS REPO!
DO NOT EDIT THAT FILE! EDIT index-header.jsx and index-footer.jsx instead
OR if you're looking to change now SVGs get output, you'll need to edit strings in the Gruntfile :)
!!! */

/**
 * External dependencies
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class SocialLogo extends PureComponent {

	static defaultProps = {
		size: 24
	};

	static propTypes = {
		icon: PropTypes.string.isRequired,
		size: PropTypes.number,
		onClick: PropTypes.func,
		className: PropTypes.string
	};

	render() {
		const { size, onClick, icon: iconProp, className, ...otherProps } = this.props;
		const icon = 'social-logo-' + iconProp;

		let svg;

		const iconClass = [
			'social-logo',
			icon,
			className,
		].filter( Boolean ).join( ' ' );

		switch ( icon ) {
			default:
				svg = <svg height={ size } width={ size } { ...otherProps } />;
				break;

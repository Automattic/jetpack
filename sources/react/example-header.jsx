/* eslint-disable no-alert */
/**
 * External dependencies
 */
import React, { PureComponent } from 'react';

/**
 * Internal dependencies
 */
import SocialLogo from './index.js';

export default class SocialLogos extends PureComponent {
	static displayName = 'Social Logos';

	handleClick = ( icon ) => {
		const toCopy = '<SocialLogo icon="' + icon + '" />';
		window.prompt( 'Copy component code:', toCopy );
	};

	render() {
		return (
			<div>

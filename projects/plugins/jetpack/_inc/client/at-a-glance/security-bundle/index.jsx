/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * WordPress dependencies
 */
 import { createInterpolateElement } from '@wordpress/element';
 import { __, _x } from '@wordpress/i18n';



class DashSecurityBundle extends Component {

	render() {
		return ( <div>
			<h2>{ __(  'Comprehensive Site Security', 'jetpacl') }</h2>
		</div>
		);
	}

}

export default DashSecurityBundle;

/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
 import { __ } from '@wordpress/i18n';
 import { Button } from '@wordpress/components';
 import { getProductDescriptionUrl } from 'product-descriptions/utils';

/**
 * Internal dependencies
 */
 import Card from 'components/card';

/**
 * Style dependencies
 */
import './style.scss'

class DashSecurityBundle extends Component {

	render() {
		return ( 
			<Card>
				<h2>{ __( 'Comprehensive Site Security', 'jetpack' ) }</h2>
				<Button href={ this.props.productDescriptionUrl }>{ __( 'Upgrade', 'jetpack' ) }</Button>
			</Card>
		);
	}
}



export default connect(
	state => ( { productDescriptionUrl:  getProductDescriptionUrl( state, 'security' ), } )
)( DashSecurityBundle );

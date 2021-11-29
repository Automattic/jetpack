/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';


/**
 * Internal dependencies
 */
import Card from 'components/card';
import bundleImageUrl from './shield-with-check.svg';
import cloudImageUrl from './cloud.svg';
import shieldImageUrl from './shield.svg';
import removeBugImageUrl from './remove-bug.svg';
import { getProductDescriptionUrl } from 'product-descriptions/utils';

/**
 * Style dependencies
 */
import './style.scss'
import { padStart } from 'lodash';


class DashSecurityBundle extends Component {

	render() {
		return ( 
			<Card>
				<h2>{ __( 'Comprehensive Site Security', 'jetpack' ) }</h2>
				<img src={ bundleImageUrl } />
				{ createInterpolateElement(
					__(
						'Total protection for your site, including Backup, Scan, and Anti-spam. <a>Learn More.</a>',
						'jetpack'
					),
					{
						a: (
							<a
								href={ getRedirectUrl( 'jetpack-features-security' ) }
								rel="noopener noreferrer"
								target="_blank"
							></a>
						),
					}
				) }
				<div>
					<div>
						<img src={ cloudImageUrl } />
						<p>{ __( 'Backup', 'jetpack' ) }</p>
					</div>
					<div>
						<img src={ shieldImageUrl } />
						<p>{ __( 'Scan', 'jetpack' ) }</p>
					</div>
					<div>
						<img src={ removeBugImageUrl } />
						<p>{ __( 'Anti-spam', 'jetpack' ) }</p>
					</div>
				</div>
				<Button href={ this.props.productDescriptionUrl }>{ __( 'Upgrade', 'jetpack' ) }</Button>
			</Card>
		);
	}
}



export default connect(
	state => ( { productDescriptionUrl:  getProductDescriptionUrl( state, 'security' ), } )
)( DashSecurityBundle );

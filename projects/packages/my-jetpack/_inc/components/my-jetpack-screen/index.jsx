/* global myJetpackInitialState */

/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import {
	AdminSection,
	AdminSectionHero,
	AdminPage,
	Row,
	Col,
} from '@automattic/jetpack-components';
import { ConnectionStatusCard } from '@automattic/jetpack-connection';

import './style.scss';
import PlansSection from '../plans-section';
import useProducts from '../../hooks/use-products';

const getProductProps = ( { name, slug, description, status } ) => ( {
	name,
	slug,
	description,
	status,
} );

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	const redirectAfterDisconnect = useCallback( () => {
		window.location = myJetpackInitialState.topJetpackMenuItemUrl;
	}, [] );
	const { products } = useProducts();

	return (
		<div className="jp-my-jetpack-screen">
			<AdminPage>
				<AdminSectionHero>
					<Row>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							<h1>
								{ __(
									'Manage your Jetpack plan and products all in one place',
									'jetpack-my-jetpack'
								) }
							</h1>
							<div className="jp-row">
								<ProductCard { ...getProductProps( products.backup ) } />
								<ProductCard { ...getProductProps( products.scan ) } />
								<ProductCard { ...getProductProps( products[ 'anti-spam' ] ) } />
								<ProductCard { ...getProductProps( products.boost ) } />
								<ProductCard { ...getProductProps( products.search ) } />
								<ProductCard { ...getProductProps( products.videopress ) } />
								<ProductCard { ...getProductProps( products.crm ) } />
								<ProductCard { ...getProductProps( products.extras ) } />
							</div>
						</Col>
					</Row>
				</AdminSectionHero>

				<AdminSection>
					<Row>
						<Col lg={ 6 } sm={ 4 }>
							<PlansSection />
						</Col>
						<Col lg={ 6 } sm={ 4 }>
							<ConnectionStatusCard
								apiRoot={ myJetpackInitialState.apiRoot }
								apiNonce={ myJetpackInitialState.apiNonce }
								redirectUri={ myJetpackInitialState.redirectUri }
								onDisconnected={ redirectAfterDisconnect }
							/>
						</Col>
					</Row>
				</AdminSection>
			</AdminPage>
		</div>
	);
}

const ProductCard = ( { slug, name, description, status } ) => {
	const disabledClass = status === 'active' ? '' : 'is-disabled';
	return (
		<div className={ `jp-product ${ disabledClass } ${ slug }__card` }>
			<div className="jp-product__name">
				<span>{ name }</span>
				<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="m15.82 11.373.013-1.277v-.03c0-1.48-1.352-2.899-3.3-2.899-1.627 0-2.87 1.014-3.205 2.207l-.32 1.143-1.186-.048a2.192 2.192 0 0 0-.089-.002c-1.19 0-2.233 1.008-2.233 2.35 0 1.34 1.04 2.348 2.23 2.35H16.8c.895 0 1.7-.762 1.7-1.8 0-.926-.649-1.643-1.423-1.776l-1.258-.218ZM7.883 8.97l-.15-.003C5.67 8.967 4 10.69 4 12.817c0 2.126 1.671 3.85 3.733 3.85H16.8c1.767 0 3.2-1.478 3.2-3.3 0-1.635-1.154-2.993-2.667-3.255v-.045c0-2.43-2.149-4.4-4.8-4.4-2.237 0-4.118 1.404-4.65 3.303Z"
						fill="#1E1E1E"
					/>
				</svg>
			</div>
			<span className="jp-product__description">{ description } </span>
			<div className="jp-product__actions">
				{ status === 'active' && (
					<>
						<span className="split-button">
							<button type="button" className="button split-button__main is-primary">
								Manage
							</button>
							<button
								title="Toggle menu"
								type="button"
								className="button split-button__toggle is-primary"
							>
								<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="m18.004 10.555-6.005 5.459-6.004-5.459 1.009-1.11 4.995 4.542 4.996-4.542 1.009 1.11Z"
										fill="#fff"
									/>
								</svg>
							</button>
						</span>
						<div className="jp-product__status">Active</div>
					</>
				) }
			</div>
		</div>
	);
};

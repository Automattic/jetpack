/**
 * External dependencies
 */

import classnames from 'classnames';
import SubmitButton from '../../utils/submit-button';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '../../utils/i18n';
import { trimEnd } from 'lodash';
import { getCurrencyDefaults } from '@automattic/format-currency';

import {
	Button,
	PanelBody,
	Placeholder,
	Spinner,
	TextControl,
	withNotices,
	SelectControl,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/editor';
import { Fragment, Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { icon, SUPPORTED_CURRENCY_LIST } from '.';
import { formatPrice } from '../simple-payments/utils';

const API_STATE_LOADING = 0;
const API_STATE_CONNECTED = 1;
const API_STATE_NOTCONNECTED = 2;

class MembershipsButtonEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			connected: API_STATE_LOADING,
			connectURL: null,
			addingMembershipAmount: false,
			products: [],
			editedProductCurrency: 'USD',
			editedProductPrice: 5,
			editedProductTitle: '',
			editedProductRenewInterval: '1 month',
		};
		this.timeout = null;
	}

	componentDidMount = () => {
		this.apiCall();
	};

	onError = message => {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	};

	apiCall = () => {
		const path = '/wpcom/v2/memberships/status';
		const method = 'GET';
		const fetch = { path, method };
		apiFetch( fetch ).then(
			result => {
				const connectURL = result.connect_url;
				const products = result.products;
				const connected = result.connected_account_id
					? API_STATE_CONNECTED
					: API_STATE_NOTCONNECTED;
				this.setState( { connected, connectURL, products } );
			}
			// result => {
			// 	const connectURL = null;
			// 	const connected = API_STATE_NOTCONNECTED;
			// 	this.setState( { connected, connectURL } );
			// 	this.onError( result.message );
			// }
		);
	};
	getCurrencyList = SUPPORTED_CURRENCY_LIST.map( value => {
		const { symbol } = getCurrencyDefaults( value );
		// if symbol is equal to the code (e.g., 'CHF' === 'CHF'), don't duplicate it.
		// trim the dot at the end, e.g., 'kr.' becomes 'kr'
		const label = symbol === value ? value : `${ value } ${ trimEnd( symbol, '.' ) }`;
		return { value, label };
	} );

	handleCurrencyChange = editedProductCurrency => this.setState( { editedProductCurrency } );
	handleRenewIntervalChange = editedProductRenewInterval =>
		this.setState( { editedProductRenewInterval } );

	handlePriceChange = price => {
		price = parseFloat( price );
		if ( ! isNaN( price ) ) {
			this.setState( { editedProductPrice: price } );
		} else {
			this.setState( { editedProductPrice: undefined } );
		}
	};

	handleTitleChange = editedProductTitle => this.setState( { editedProductTitle } );
	// eslint-disable-next-line
	saveProduct = () => {
		const path = '/wpcom/v2/memberships/product';
		const method = 'POST';
		const data = {
			currency: this.state.editedProductCurrency,
			price: this.state.editedProductPrice,
			title: this.state.editedProductTitle,
			interval: this.state.editedProductRenewInterval,
		};
		const fetch = { path, method, data };
		apiFetch( fetch ).then(
			result => {
				this.setState( {
					products: this.state.products.concat( [
						{
							id: result.id,
							title: result.title,
							interval: result.interval,
							price: result.price,
						},
					] ),
				} );
			}
			// result => {
			// 	const connectURL = null;
			// 	const connected = API_STATE_NOTCONNECTED;
			// 	this.setState( { connected, connectURL } );
			// 	this.onError( result.message );
			// }
		);
	};

	renderAddMembershipAmount = () => {
		if ( ! this.state.addingMembershipAmount ) {
			return (
				<Button
					isDefault
					isLarge
					onClick={ () => this.setState( { addingMembershipAmount: true } ) }
				>
					{ __( 'Add Memberships Amounts' ) }
				</Button>
			);
		}

		return (
			<div className="wp-block-jetpack-simple-payments">
				<div>
					<div className="simple-payments__price-container">
						<SelectControl
							className="simple-payments__field simple-payments__field-currency"
							label={ __( 'Currency' ) }
							onChange={ this.handleCurrencyChange }
							options={ this.getCurrencyList }
							value={ this.state.editedProductCurrency }
						/>
						<TextControl
							label={ __( 'Price' ) }
							onChange={ this.handlePriceChange }
							placeholder={ formatPrice( 0, this.state.editedProductCurrency, false ) }
							required
							step="1"
							type="number"
							value={ this.state.editedProductPrice || '' }
						/>
					</div>
					<TextControl
						className="simple-payments__field simple-payments__field-content"
						label={ __( 'Describe your item in a few words' ) }
						onChange={ this.handleTitleChange }
						placeholder={ __( 'Describe your item in a few words' ) }
						value={ this.state.editedProductTitle }
					/>
					<SelectControl
						label={ __( 'Renew interval' ) }
						onChange={ this.handleRenewIntervalChange }
						options={ [
							{
								label: __( 'Monthly' ),
								value: '1 month',
							},
							{
								label: __( 'Yearly' ),
								value: '1 year',
							},
						] }
						value={ this.state.editedProductRenewInterval }
					/>
				</div>
				<Button isDefault isLarge onClick={ this.saveProduct }>
					{ __( 'Add Amount' ) }
				</Button>
				<Button isLarge onClick={ () => this.setState( { addingMembershipAmount: false } ) }>
					{ __( 'Cancel' ) }
				</Button>
			</div>
		);
	};
	getFormattedPriceByProductId = id => {
		const product = this.state.products.filter( prod => prod.id === id ).pop();
		return formatPrice( parseFloat( product.price ), product.currency );
	};

	setMembershipAmount = id =>
		this.props.setAttributes( {
			planId: id,
			submitButtonText: this.getFormattedPriceByProductId( id ) + __( ' Contribution' ),
		} );

	renderMembershipAmounts = () => (
		<div>
			{' '}
			{ this.state.products.map( product => (
				<Button isLarge key={ product.id } onClick={ () => this.setMembershipAmount( product.id ) }>
					{ formatPrice( parseFloat( product.price ), product.currency ) }
				</Button>
			) ) }{' '}
		</div>
	);

	render = () => {
		const { className, notices } = this.props;
		const { connected, connectURL, products } = this.state;

		const inspectorControls = (
			<InspectorControls>
				<PanelBody title={ __( 'Product' ) }>
					<SelectControl
						label="Membership plan"
						value={ this.props.attributes.planId }
						onChange={ this.setMembershipAmount }
						options={ this.state.products.map( product => ( {
							label: formatPrice( parseFloat( product.price ), product.currency ),
							value: product.id,
							key: product.id,
						} ) ) }
					/>
				</PanelBody>
			</InspectorControls>
		);
		const blockClasses = classnames( className, [
			'components-button',
			'is-primary',
			'is-button',
		] );
		const blockContent = (
			<SubmitButton
				className={ blockClasses }
				submitButtonText={ this.props.attributes.submitButtonText }
				attributes={ this.props.attributes }
				setAttributes={ this.props.setAttributes }
			/>
		);
		return (
			<Fragment>
				{ connected === API_STATE_LOADING && (
					<Placeholder icon={ icon } notices={ notices }>
						<Spinner />
					</Placeholder>
				) }
				{ ! this.props.attributes.planId && connected === API_STATE_NOTCONNECTED && (
					<Placeholder icon={ icon } label={ __( 'Memberships' ) } notices={ notices }>
						<div className="components-placeholder__instructions">
							{ __( 'In order to start selling Membership plans, you have to connect to Stripe:' ) }
							<br />
							<br />
							<Button isDefault isLarge href={ connectURL } target="_blank">
								{ __( 'Connect to Stripe or set up account' ) }
							</Button>
							<br />
							<br />
							<Button isLink onClick={ this.apiCall }>
								{ __( 'Re-check Connection' ) }
							</Button>
						</div>
					</Placeholder>
				) }
				{ ! this.props.attributes.planId &&
					connected === API_STATE_CONNECTED &&
					products.length === 0 && (
						<Placeholder icon={ icon } label={ __( 'Memberships' ) } notices={ notices }>
							<div className="components-placeholder__instructions">
								{ __( 'Add your first Membership amount:' ) }
								<br />
								<br />
								{ this.renderAddMembershipAmount() }
							</div>
						</Placeholder>
					) }
				{ ! this.props.attributes.planId &&
					connected === API_STATE_CONNECTED &&
					products.length > 0 && (
						<Placeholder icon={ icon } label={ __( 'Memberships' ) } notices={ notices }>
							<div className="components-placeholder__instructions">
								{ __( 'Select payment amount:' ) }
								{ this.renderMembershipAmounts() }
								{ __( 'Or add another membership amount:' ) }
								<br />
								{ this.renderAddMembershipAmount() }
							</div>
						</Placeholder>
					) }
				{ connected !== API_STATE_LOADING && this.props.attributes.planId && inspectorControls }
				{ connected !== API_STATE_LOADING && this.props.attributes.planId && blockContent }
			</Fragment>
		);
	};
}

export default withNotices( MembershipsButtonEdit );

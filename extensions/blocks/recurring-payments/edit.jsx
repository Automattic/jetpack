/**
 * External dependencies
 */

import classnames from 'classnames';
import SubmitButton from '../../shared/submit-button';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { trimEnd } from 'lodash';
import formatCurrency, { getCurrencyDefaults } from '@automattic/format-currency';

import {
	Button,
	ExternalLink,
	PanelBody,
	Placeholder,
	Spinner,
	TextControl,
	withNotices,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { InspectorControls, BlockIcon, RichText } from '@wordpress/editor';
import { Fragment, Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { icon, SUPPORTED_CURRENCY_LIST } from '.';

const API_STATE_LOADING = 0;
const API_STATE_CONNECTED = 1;
const API_STATE_NOTCONNECTED = 2;

const PRODUCT_NOT_ADDING = 0;
const PRODUCT_FORM = 1;
const PRODUCT_FORM_SUBMITTED = 2;

class MembershipsButtonEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			connected: API_STATE_LOADING,
			connectURL: null,
			addingMembershipAmount: PRODUCT_NOT_ADDING,
			shouldUpgrade: false,
			upgradeURL: '',
			products: [],
			siteSlug: '',
			editedProductCurrency: 'USD',
			editedProductPrice: 5,
			editedProductPriceValid: true,
			editedProductTitle: '',
			editedProductTitleValid: true,
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
				if (
					result.errors &&
					Object.values( result.errors ) &&
					Object.values( result.errors )[ 0 ][ 0 ]
				) {
					this.setState( { connected: null, connectURL: API_STATE_NOTCONNECTED } );
					this.onError( Object.values( result.errors )[ 0 ][ 0 ] );
					return;
				}
				const {
					connect_url: connectURL,
					products,
					should_upgrade_to_access_memberships: shouldUpgrade,
					upgrade_url: upgradeURL,
					site_slug: siteSlug,
				} = result;
				const connected = result.connected_account_id
					? API_STATE_CONNECTED
					: API_STATE_NOTCONNECTED;
				this.setState( { connected, connectURL, products, shouldUpgrade, upgradeURL, siteSlug } );
			},
			result => {
				const connectURL = null;
				const connected = API_STATE_NOTCONNECTED;
				this.setState( { connected, connectURL } );
				this.onError( result.message );
			}
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
		this.setState( {
			editedProductPrice: price,
			editedProductPriceValid: ! isNaN( price ) && price >= 5,
		} );
	};

	handleTitleChange = editedProductTitle =>
		this.setState( {
			editedProductTitle,
			editedProductTitleValid: editedProductTitle.length > 0,
		} );
	// eslint-disable-next-line
	saveProduct = () => {
		if ( ! this.state.editedProductTitle || this.state.editedProductTitle.length === 0 ) {
			this.setState( { editedProductTitleValid: false } );
			return;
		}
		if (
			! this.state.editedProductPrice ||
			isNaN( this.state.editedProductPrice ) ||
			this.state.editedProductPrice < 5
		) {
			this.setState( { editedProductPriceValid: false } );
			return;
		}
		this.setState( { addingMembershipAmount: PRODUCT_FORM_SUBMITTED } );
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
					addingMembershipAmount: PRODUCT_NOT_ADDING,
					products: this.state.products.concat( [
						{
							id: result.id,
							title: result.title,
							interval: result.interval,
							price: result.price,
							currency: result.currency,
						},
					] ),
				} );
				// After successful adding of product, we want to select it. Presumably that is the product user wants.
				this.setMembershipAmount( result.id );
			},
			result => {
				this.setState( { addingMembershipAmount: PRODUCT_FORM } );
				this.onError( result.message );
			}
		);
	};

	renderAmount = product => {
		const amount = formatCurrency( parseFloat( product.price ), product.currency );
		if ( product.interval === '1 month' ) {
			return sprintf( __( '%s / month', 'jetpack' ), amount );
		}
		if ( product.interval === '1 year' ) {
			return sprintf( __( '%s / year', 'jetpack' ), amount );
		}
		if ( product.interval === 'one-time' ) {
			return amount;
		}
		return sprintf( __( '%s / %s', 'jetpack' ), amount, product.interval );
	};

	renderAddMembershipAmount = () => {
		if ( this.state.addingMembershipAmount === PRODUCT_NOT_ADDING ) {
			return (
				<Button
					isDefault
					isLarge
					onClick={ () => this.setState( { addingMembershipAmount: PRODUCT_FORM } ) }
				>
					{ __( 'Add a Recurring Payments Plan', 'jetpack' ) }
				</Button>
			);
		}
		if ( this.state.addingMembershipAmount === PRODUCT_FORM_SUBMITTED ) {
			return;
		}

		return (
			<div>
				<div className="membership-button__price-container">
					<SelectControl
						className="membership-button__field membership-button__field-currency"
						label={ __( 'Currency', 'jetpack' ) }
						onChange={ this.handleCurrencyChange }
						options={ this.getCurrencyList }
						value={ this.state.editedProductCurrency }
					/>
					<TextControl
						label={ __( 'Price', 'jetpack' ) }
						className={ classnames( {
							'membership-membership-button__field': true,
							'membership-button__field-price': true,
							'membership-button__field-error': ! this.state.editedProductPriceValid,
						} ) }
						onChange={ this.handlePriceChange }
						placeholder={ formatCurrency( 0, this.state.editedProductCurrency ) }
						required
						min="5.00"
						step="1"
						type="number"
						value={ this.state.editedProductPrice || '' }
					/>
				</div>
				<TextControl
					className={ classnames( {
						'membership-button__field': true,
						'membership-button__field-error': ! this.state.editedProductTitleValid,
					} ) }
					label={ __( 'Describe your subscription in a few words', 'jetpack' ) }
					onChange={ this.handleTitleChange }
					placeholder={ __( 'Subscription description', 'jetpack' ) }
					value={ this.state.editedProductTitle }
				/>
				<SelectControl
					label={ __( 'Renew interval', 'jetpack' ) }
					onChange={ this.handleRenewIntervalChange }
					options={ [
						{
							label: __( 'Monthly', 'jetpack' ),
							value: '1 month',
						},
						{
							label: __( 'Yearly', 'jetpack' ),
							value: '1 year',
						},
					] }
					value={ this.state.editedProductRenewInterval }
				/>
				<div>
					<Button
						isDefault
						isLarge
						className="membership-button__field-button membership-button__add-amount"
						onClick={ this.saveProduct }
					>
						{ __( 'Add Amount', 'jetpack' ) }
					</Button>
					<Button
						isLarge
						className="membership-button__field-button"
						onClick={ () => this.setState( { addingMembershipAmount: PRODUCT_NOT_ADDING } ) }
					>
						{ __( 'Cancel', 'jetpack' ) }
					</Button>
				</div>
			</div>
		);
	};
	getFormattedPriceByProductId = id => {
		const product = this.state.products
			.filter( prod => parseInt( prod.id ) === parseInt( id ) )
			.pop();
		return formatCurrency( parseFloat( product.price ), product.currency );
	};

	setMembershipAmount = id =>
		this.props.setAttributes( {
			planId: id,
			submitButtonText: this.getFormattedPriceByProductId( id ) + __( ' Contribution', 'jetpack' ),
			loginButtonText: __( 'Log In', 'jetpack' ),
		} );

	renderMembershipAmounts = () => (
		<div>
			{ this.state.products.map( product => (
				<Button
					className="membership-button__field-button"
					isLarge
					key={ product.id }
					onClick={ () => this.setMembershipAmount( product.id ) }
				>
					{ this.renderAmount( product ) }
				</Button>
			) ) }
		</div>
	);

	renderDisclaimer = () => {
		return (
			<div className="membership-button__disclaimer">
				<ExternalLink href="https://en.support.wordpress.com/recurring-payments-button/#related-fees">
					{ __( 'Read more about Recurring Payments and related fees.', 'jetpack' ) }
				</ExternalLink>
			</div>
		);
	};

	render = () => {
		const { className, notices } = this.props;
		const { connected, connectURL, products } = this.state;

		const inspectorControls = (
			<InspectorControls>
				<PanelBody title={ __( 'Product', 'jetpack' ) }>
					<SelectControl
						label={ __( 'Payment plan', 'jetpack' ) }
						value={ this.props.attributes.planId }
						onChange={ this.setMembershipAmount }
						options={ this.state.products.map( product => ( {
							label: this.renderAmount( product ),
							value: product.id,
							key: product.id,
						} ) ) }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Paywall', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'This block is a paywall', 'jetpack' ) }
						help={ 'Hide the rest of this post for anonymous users.' }
						checked={ this.props.attributes.paywall }
						onChange={ paywall => this.props.setAttributes( { paywall } ) }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Management', 'jetpack' ) }>
					<ExternalLink href={ `https://wordpress.com/earn/payments/${ this.state.siteSlug }` }>
						{ __( 'See your earnings, subscriber list, and products.', 'jetpack' ) }
					</ExternalLink>
				</PanelBody>
			</InspectorControls>
		);
		const blockClasses = classnames( className, [
			'wp-block-button__link',
			'components-button',
			'is-primary',
			'is-button',
		] );
		const blockContent = (
			<div>
				<SubmitButton
					className={ blockClasses }
					submitButtonText={ this.props.attributes.submitButtonText }
					attributes={ this.props.attributes }
					setAttributes={ this.props.setAttributes }
				/>
				{ this.props.attributes.paywall && (
					<SubmitButton
						className={ blockClasses }
						submitButtonText={ this.props.attributes.loginButtonText }
						attributes={ this.props.attributes }
						setAttributes={ newAttributes => {
							const mappedAttributes = {};
							Object.keys( newAttributes ).forEach( function( key ) {
								if ( key === 'submitButtonText' ) {
									mappedAttributes.loginButtonText = newAttributes[ key ];
								} else {
									mappedAttributes[ key ] = newAttributes[ key ];
								}
							} );
							this.props.setAttributes( mappedAttributes );
						} }
					/>
				) }
				{ this.props.attributes.paywall && (
					<RichText
						tagName="div"
						inlineToolbar
						placeholder={ __( 'Message for the anonymous user', 'jetpack' ) }
						value={ this.props.attributes.subscriberMessage }
						onChange={ nextValue => this.props.setAttributes( { subscriberMessage: nextValue } ) }
					/>
				) }
			</div>
		);
		return (
			<Fragment>
				{ this.props.noticeUI }
				{ this.state.shouldUpgrade && (
					<div className="wp-block-jetpack-recurring-payments">
						<Placeholder
							icon={ <BlockIcon icon={ icon } /> }
							label={ __( 'Recurring Payments', 'jetpack' ) }
							notices={ notices }
						>
							<div className="components-placeholder__instructions">
								<p>
									{ __(
										"You'll need to upgrade your plan to use the Recurring Payments button.",
										'jetpack'
									) }
								</p>
								<Button isDefault isLarge href={ this.state.upgradeURL } target="_blank">
									{ __( 'Upgrade Your Plan', 'jetpack' ) }
								</Button>
								{ this.renderDisclaimer() }
							</div>
						</Placeholder>
					</div>
				) }
				{ ( connected === API_STATE_LOADING ||
					this.state.addingMembershipAmount === PRODUCT_FORM_SUBMITTED ) &&
					! this.props.attributes.planId && (
						<Placeholder icon={ <BlockIcon icon={ icon } /> } notices={ notices }>
							<Spinner />
						</Placeholder>
					) }
				{ ! this.state.shouldUpgrade &&
					! this.props.attributes.planId &&
					connected === API_STATE_NOTCONNECTED && (
						<div className="wp-block-jetpack-recurring-payments">
							<Placeholder
								icon={ <BlockIcon icon={ icon } /> }
								label={ __( 'Recurring Payments', 'jetpack' ) }
								notices={ notices }
							>
								<div className="components-placeholder__instructions">
									<p>
										{ __(
											'In order to start selling Recurring Payments plans, you have to connect to Stripe:',
											'jetpack'
										) }
									</p>
									<Button isDefault isLarge href={ connectURL } target="_blank">
										{ __( 'Connect to Stripe or set up an account', 'jetpack' ) }
									</Button>
									<br />
									<Button isLink onClick={ this.apiCall }>
										{ __( 'Re-check Connection', 'jetpack' ) }
									</Button>
									{ this.renderDisclaimer() }
								</div>
							</Placeholder>
						</div>
					) }
				{ ! this.state.shouldUpgrade &&
					! this.props.attributes.planId &&
					connected === API_STATE_CONNECTED &&
					products.length === 0 && (
						<div className="wp-block-jetpack-recurring-payments">
							<Placeholder
								icon={ <BlockIcon icon={ icon } /> }
								label={ __( 'Recurring Payments', 'jetpack' ) }
								notices={ notices }
							>
								<div className="components-placeholder__instructions">
									<p>{ __( 'Add your first Recurring Payments plan:', 'jetpack' ) }</p>
									{ this.renderAddMembershipAmount() }
									{ this.renderDisclaimer() }
								</div>
							</Placeholder>
						</div>
					) }
				{ ! this.state.shouldUpgrade &&
					! this.props.attributes.planId &&
					this.state.addingMembershipAmount !== PRODUCT_FORM_SUBMITTED &&
					connected === API_STATE_CONNECTED &&
					products.length > 0 && (
						<div className="wp-block-jetpack-recurring-payments">
							<Placeholder
								icon={ <BlockIcon icon={ icon } /> }
								label={ __( 'Recurring Payments', 'jetpack' ) }
								notices={ notices }
							>
								<div className="components-placeholder__instructions">
									<p>{ __( 'Select payment plan:', 'jetpack' ) }</p>
									{ this.renderMembershipAmounts() }
									<p>{ __( 'Or add another Recurring Payments plan:', 'jetpack' ) }</p>
									{ this.renderAddMembershipAmount() }
									{ this.renderDisclaimer() }
								</div>
							</Placeholder>
						</div>
					) }
				{ this.state.products && inspectorControls }
				{ this.props.attributes.planId && blockContent }
			</Fragment>
		);
	};
}

export default withNotices( MembershipsButtonEdit );

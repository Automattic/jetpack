/**
 * External dependencies
 */
import classnames from 'classnames';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import formatCurrency from '@automattic/format-currency';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	Button,
	ExternalLink,
	PanelBody,
	Placeholder,
	Spinner,
	TextControl,
	withNotices,
	SelectControl,
} from '@wordpress/components';
import { InspectorControls, InnerBlocks, BlockIcon } from '@wordpress/block-editor';
import { Fragment, Component } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';
import StripeNudge from '../../shared/components/stripe-nudge';
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';
import getSiteFragment from '../../shared/get-site-fragment';
import { icon, isPriceValid, removeInvalidProducts, CURRENCY_OPTIONS } from '.';

const API_STATE_LOADING = 0;
const API_STATE_CONNECTED = 1;
const API_STATE_NOTCONNECTED = 2;

const PRODUCT_NOT_ADDING = 0;
const PRODUCT_FORM = 1;
const PRODUCT_FORM_SUBMITTED = 2;

/**
 * Formats a price with the right format for a numeric input value.
 *
 * @param {number} price Price to format.
 * @param {string} currency Currency code.
 * @returns {string} Formatted price.
 */
const formatPriceForNumberInputValue = ( price, currency ) => {
	// By using `formatCurrency` we ensure the resulting price contains the relevant decimals for the given currency (i.e. 0.5 > 0.50).
	return formatCurrency( price, currency, {
		decimal: '.', // Values for numeric inputs need to use a dot notation for decimals.
		symbol: '', // Values for numeric inputs cannot contain any currency symbol, only numbers.
	} );
};

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
			editedProductCurrency: 'USD',
			editedProductPrice: formatPriceForNumberInputValue(
				minimumTransactionAmountForCurrency( 'USD' ),
				'USD'
			),
			editedProductPriceValid: true,
			editedProductTitle: '',
			editedProductTitleValid: true,
			editedProductRenewInterval: '1 month',
		};
		this.timeout = null;

		const recurringPaymentsAvailability = getJetpackExtensionAvailability( 'recurring-payments' );
		this.hasUpgradeNudge =
			! recurringPaymentsAvailability.available &&
			recurringPaymentsAvailability.unavailableReason === 'missing_plan';

		this.isPremiumContentChild = this.props.context.isPremiumContentChild || false;
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
				} = result;
				const connected = result.connected_account_id
					? API_STATE_CONNECTED
					: API_STATE_NOTCONNECTED;
				this.setState( {
					connected,
					connectURL,
					shouldUpgrade,
					upgradeURL,
					products: removeInvalidProducts( products ),
				} );
			},
			result => {
				const connectURL = null;
				const connected = API_STATE_NOTCONNECTED;
				this.setState( { connected, connectURL } );
				this.onError( result.message );
			}
		);
	};

	handleCurrencyChange = editedProductCurrency => {
		let editedProductPrice = this.state.editedProductPrice;

		if ( ! isPriceValid( editedProductCurrency, editedProductPrice ) ) {
			editedProductPrice = formatPriceForNumberInputValue(
				minimumTransactionAmountForCurrency( editedProductCurrency ),
				editedProductCurrency
			);
		}

		this.setState( {
			editedProductCurrency,
			editedProductPrice,
			editedProductPriceValid: true,
		} );
	};

	handleRenewIntervalChange = editedProductRenewInterval =>
		this.setState( { editedProductRenewInterval } );

	handlePriceChange = price => {
		const editedProductPrice = parseFloat( price );
		const editedProductPriceValid = isPriceValid(
			this.state.editedProductCurrency,
			editedProductPrice
		);

		this.setState( {
			editedProductPrice,
			editedProductPriceValid,
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
			! isPriceValid( this.state.editedProductCurrency, this.state.editedProductPrice )
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

	renderAddMembershipAmount = forceShowForm => {
		if ( this.state.addingMembershipAmount === PRODUCT_NOT_ADDING && ! forceShowForm ) {
			return (
				<Button
					isPrimary
					isLarge
					onClick={ () => this.setState( { addingMembershipAmount: PRODUCT_FORM } ) }
				>
					{ __( 'Add a payment plan', 'jetpack' ) }
				</Button>
			);
		}
		if ( this.state.addingMembershipAmount === PRODUCT_FORM_SUBMITTED ) {
			return;
		}

		const minPrice = formatCurrency(
			minimumTransactionAmountForCurrency( this.state.editedProductCurrency ),
			this.state.editedProductCurrency
		);
		const minimumPriceNote = sprintf( __( 'Minimum allowed price is %s.' ), minPrice );
		return (
			<div>
				<div className="membership-button__price-container">
					<SelectControl
						className="membership-button__field membership-button__field-currency"
						label={ __( 'Currency', 'jetpack' ) }
						onChange={ this.handleCurrencyChange }
						options={ CURRENCY_OPTIONS }
						value={ this.state.editedProductCurrency }
					/>
					<div className="membership-membership-button__field membership-button__field-price">
						<TextControl
							label={ __( 'Price', 'jetpack' ) }
							className={ classnames( {
								'membership-button__field-error': ! this.state.editedProductPriceValid,
							} ) }
							onChange={ this.handlePriceChange }
							placeholder={ minPrice }
							required
							min="0"
							step="1"
							type="number"
							value={ this.state.editedProductPrice || '' }
						/>
						<p>{ minimumPriceNote }</p>
					</div>
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
						{
							label: __( 'One-Time Payment', 'jetpack' ),
							value: 'one-time',
						},
					] }
					value={ this.state.editedProductRenewInterval }
				/>
				<div>
					<Button
						isPrimary
						isLarge
						className="membership-button__field-button membership-button__add-amount"
						onClick={ this.saveProduct }
					>
						{ __( 'Add this payment plan', 'jetpack' ) }
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

	setMembershipAmount = id => {
		const { innerButtons, updateBlockAttributes, setAttributes } = this.props;
		const currentPlanId = this.props.attributes.planId;
		const defaultTextForNewPlan =
			this.getFormattedPriceByProductId( id ) + __( ' Contribution', 'jetpack' );
		const defaultTextForCurrentPlan = currentPlanId
			? this.getFormattedPriceByProductId( currentPlanId ) + __( ' Contribution', 'jetpack' )
			: undefined;
		if ( innerButtons.length ) {
			innerButtons[ 0 ].innerBlocks.forEach( block => {
				const currentText = block.attributes.text;
				const text =
					currentText === defaultTextForCurrentPlan ? defaultTextForNewPlan : currentText;
				updateBlockAttributes( block.clientId, { text } );
			} );
		}

		return setAttributes( { planId: parseInt( id ) } );
	};

	renderMembershipAmounts = () => (
		<div>
			{ this.state.products.map( product => (
				<Button
					className="membership-button__field-button"
					isLarge
					isSecondary
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
				<ExternalLink href="https://wordpress.com/support/wordpress-editor/blocks/payments/#related-fees">
					{ __( 'Read more about Payments and related fees.', 'jetpack' ) }
				</ExternalLink>
			</div>
		);
	};

	renderUpgradeNudges = () => {
		const { notices, postId } = this.props;
		const { connected, connectURL } = this.state;

		return (
			<>
			{ ! this.hasUpgradeNudge &&
				! this.state.shouldUpgrade &&
				connected === API_STATE_NOTCONNECTED && (
					<StripeNudge
						blockName="recurring-payments"
						postId={ postId }
						stripeConnectUrl={ connectURL }
					/>
				) }
			{ ! this.hasUpgradeNudge && this.state.shouldUpgrade && (
				<div className="wp-block-jetpack-recurring-payments">
					<Placeholder
						icon={ <BlockIcon icon={ icon } /> }
						label={ __( 'Payments', 'jetpack' ) }
						notices={ notices }
						instructions={ __(
							"You'll need to upgrade your plan to use the Payments block.",
							'jetpack'
						) }
					>
						<Button isSecondary isLarge href={ this.state.upgradeURL } target="_blank">
							{ __( 'Upgrade your plan', 'jetpack' ) }
						</Button>
						{ this.renderDisclaimer() }
					</Placeholder>
				</div>
			) }
			</>
		);
	}

	renderPlanNotices = () => {
		const { notices } = this.props;
		const { connected, products } = this.state;

		return (
			<>
			{ ( connected === API_STATE_LOADING ||
				this.state.addingMembershipAmount === PRODUCT_FORM_SUBMITTED ) &&
				! this.props.attributes.planId && (
					<Placeholder icon={ <BlockIcon icon={ icon } /> } notices={ notices }>
						<Spinner />
					</Placeholder>
				) }
			{ ! this.state.shouldUpgrade &&
				! this.props.attributes.planId &&
				connected === API_STATE_CONNECTED &&
				products.length === 0 && (
					<div className="wp-block-jetpack-recurring-payments">
						<Placeholder
							icon={ <BlockIcon icon={ icon } /> }
							label={ __( 'Payments', 'jetpack' ) }
							notices={ notices }
						>
							<div className="components-placeholder__instructions">
								<p>
									{ __( 'To use this block, first add at least one payment plan.', 'jetpack' ) }
								</p>
								{ this.renderAddMembershipAmount( true ) }
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
							label={ __( 'Payments', 'jetpack' ) }
							notices={ notices }
						>
							<div className="components-placeholder__instructions">
								<p>
									{ __(
										'To use this block, select a previously created payment plan.',
										'jetpack'
									) }
								</p>
								{ this.renderMembershipAmounts() }
								<p>{ __( 'Or a new one.', 'jetpack' ) }</p>
								{ this.renderAddMembershipAmount( false ) }
								{ this.renderDisclaimer() }
							</div>
						</Placeholder>
					</div>
				) }
			</>
		);
	};

	render = () => {
		const { products } = this.state;

		/**
		 * Filters the flag that determines if the Recurring Payments block controls should be shown in the inspector.
		 *
		 * @param {bool} showControls Whether inspectors controls are shown.
		 * @param {string} showControls Block ID.
		 */
		const showControls = applyFilters(
			'jetpack.RecurringPayments.showControls',
			products.length > 0,
			this.props.clientId
		);

		const inspectorControls = (
			<InspectorControls>
				<PanelBody title={ __( 'Payment plan', 'jetpack' ) }>
					<SelectControl
						label={ __( 'Payment plan', 'jetpack' ) }
						value={ this.props.attributes.planId }
						onChange={ this.setMembershipAmount }
						options={ products.map( product => ( {
							label: this.renderAmount( product ),
							value: product.id,
							key: product.id,
						} ) ) }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Management', 'jetpack' ) }>
					<ExternalLink href={ `https://wordpress.com/earn/payments/${ getSiteFragment() }` }>
						{ __( 'See your earnings, subscriber list, and payment plans.', 'jetpack' ) }
					</ExternalLink>
				</PanelBody>
			</InspectorControls>
		);

		return (
			<Fragment>
				{ this.props.noticeUI }
				{ ! this.isPremiumContentChild && this.renderUpgradeNudges() }
				{ ! this.isPremiumContentChild && this.renderPlanNotices() }

				{ showControls && inspectorControls }

				<InnerBlocks
					template={ [
						[
							'jetpack/button',
							{
								element: 'a',
								uniqueId: 'recurring-payments-id',
							},
						],
					] }
					templateLock="all"
				/>
			</Fragment>
		);
	};
}

export default compose( [
	withSelect( ( select ) => ( {
		postId: select( 'core/editor' ).getCurrentPostId(),
	} ) ),
	withDispatch( dispatch => {
		const { updateBlockAttributes } = dispatch( 'core/editor' );
		return { updateBlockAttributes };
	} ),
	withNotices,
] )( MembershipsButtonEdit );

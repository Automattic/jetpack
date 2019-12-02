/**
 * External dependencies
 */
import classnames from 'classnames';
import SubmitButton from '../../shared/submit-button';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { trimEnd } from 'lodash';
import formatCurrency, { getCurrencyDefaults } from '@automattic/format-currency';
import { addQueryArgs, getQueryArg, isURL } from '@wordpress/url';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
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
import { InspectorControls, BlockIcon } from '@wordpress/block-editor';
import { Fragment, Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';
import StripeNudge from '../../shared/components/stripe-nudge';
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

		const recurringPaymentsAvailability = getJetpackExtensionAvailability( 'recurring-payments' );
		this.hasUpgradeNudge =
			! recurringPaymentsAvailability.available &&
			recurringPaymentsAvailability.unavailableReason === 'missing_plan';
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

	renderAddMembershipAmount = forceShowForm => {
		if ( this.state.addingMembershipAmount === PRODUCT_NOT_ADDING && ! forceShowForm ) {
			return (
				<Button
					isPrimary
					isLarge
					onClick={ () => this.setState( { addingMembershipAmount: PRODUCT_FORM } ) }
				>
					{ __( 'Add a plan', 'jetpack' ) }
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
						isPrimary
						isLarge
						className="membership-button__field-button membership-button__add-amount"
						onClick={ this.saveProduct }
					>
						{ __( 'Add this plan', 'jetpack' ) }
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

	getConnectUrl() {
		const { postId } = this.props;
		const { connectURL } = this.state;

		if ( ! isURL( connectURL ) ) {
			return null;
		}

		if ( ! postId ) {
			return connectURL;
		}

		let decodedState;
		try {
			const state = getQueryArg( connectURL, 'state' );
			decodedState = JSON.parse( atob( state ) );
		} catch ( err ) {
			if ( process.env.NODE_ENV !== 'production' ) {
				console.error( err ); // eslint-disable-line no-console
			}
			return connectURL;
		}

		decodedState.from_editor_post_id = postId;

		return addQueryArgs( connectURL, { state: btoa( JSON.stringify( decodedState ) ) } );
	}

	render = () => {
		const { attributes, className, notices } = this.props;
		const { connected, products } = this.state;
		const { align } = attributes;

		const stripeConnectUrl = this.getConnectUrl();

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
			`align${ align }`,
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
				{ this.props.noticeUI }
				{ ! this.hasUpgradeNudge &&
					! this.state.shouldUpgrade &&
					connected === API_STATE_NOTCONNECTED && (
						<StripeNudge blockName="recurring-payments" stripeConnectUrl={ stripeConnectUrl } />
					) }
				{ ! this.hasUpgradeNudge && this.state.shouldUpgrade && (
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
					connected === API_STATE_CONNECTED &&
					products.length === 0 && (
						<div className="wp-block-jetpack-recurring-payments">
							<Placeholder
								icon={ <BlockIcon icon={ icon } /> }
								label={ __( 'Recurring Payments', 'jetpack' ) }
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
								label={ __( 'Recurring Payments', 'jetpack' ) }
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
				{ this.state.products && inspectorControls }
				{ ( ( ( this.hasUpgradeNudge || ! this.state.shouldUpgrade ) &&
					connected !== API_STATE_LOADING ) ||
					this.props.attributes.planId ) &&
					blockContent }
				{ this.hasUpgradeNudge && connected === API_STATE_NOTCONNECTED && (
					<div className="wp-block-jetpack-recurring-payments disclaimer-only">
						{ this.renderDisclaimer() }
					</div>
				) }
			</Fragment>
		);
	};
}

export default compose( [
	withSelect( select => ( { postId: select( 'core/editor' ).getCurrentPostId() } ) ),
	withNotices,
] )( MembershipsButtonEdit );

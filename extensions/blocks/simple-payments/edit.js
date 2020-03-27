/**
 * External dependencies
 */
import classNames from 'classnames';
import emailValidator from 'email-validator';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { compose, withInstanceId } from '@wordpress/compose';
import { dispatch, withSelect } from '@wordpress/data';
import { get, isEmpty, isEqual, pick, trimEnd } from 'lodash';
import { getCurrencyDefaults } from '@automattic/format-currency';
import {
	Disabled,
	ExternalLink,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import HelpMessage from '../../shared/help-message';
import ProductPlaceholder from './product-placeholder';
import FeaturedMedia from './featured-media';
import { decimalPlaces, formatPrice } from './utils';
import { SIMPLE_PAYMENTS_PRODUCT_POST_TYPE, SUPPORTED_CURRENCY_LIST } from './constants';

class SimplePaymentsEdit extends Component {
	constructor( props ) {
		super( props );
		this.emailInput = createRef();
	}

	state = {
		fieldEmailError: null,
		fieldEmailPasteListenerAdded: false,
		fieldPriceError: null,
		fieldTitleError: null,
		isSavingProduct: false,
	};

	/**
	 * We'll use this flag to inject attributes one time when the product entity is loaded.
	 *
	 * It is based on the presence of a `productId` attribute.
	 *
	 * If present, initially we are waiting for attributes to be injected.
	 * If absent, we may save the product in the future but do not need to inject attributes based
	 * on the response as they will have come from our product submission.
	 */
	shouldInjectPaymentAttributes = !! this.props.attributes.productId;

	componentDidMount() {
		// Try to get the simplePayment loaded into attributes if possible.
		this.injectPaymentAttributes();

		const { attributes, hasPublishAction } = this.props;
		const { productId } = attributes;

		// If the user can publish save an empty product so that we have an ID and can save
		// concurrently with the post that contains the Simple Payment.
		if ( ! productId && hasPublishAction ) {
			this.saveProduct();
		}
	}

	componentDidUpdate( prevProps ) {
		const { hasPublishAction, isSelected } = this.props;

		if ( ! isEqual( prevProps.simplePayment, this.props.simplePayment ) ) {
			this.injectPaymentAttributes();
		}

		if (
			! prevProps.isSaving &&
			this.props.isSaving &&
			hasPublishAction &&
			this.validateAttributes()
		) {
			// Validate and save product on post save
			this.saveProduct();
		} else if ( prevProps.isSelected && ! isSelected ) {
			// Validate on block deselect
			this.validateAttributes();
		}

		// currently the Gutenberg paste handler isn't bypassed for inputs with type="email" which breaks
		// the block on cut or paste, so this prevents the cut and paste events bubbling up for now
		if ( this.emailInput.current ) {
			this.emailInput.current.removeEventListener( 'paste', this.trapEmailFieldEvents );
			this.emailInput.current.removeEventListener( 'cut', this.trapEmailFieldEvents );
			this.emailInput.current.addEventListener( 'paste', this.trapEmailFieldEvents );
			this.emailInput.current.addEventListener( 'cut', this.trapEmailFieldEvents );
		}
	}

	trapEmailFieldEvents( event ) {
		event.stopPropagation();
	}

	injectPaymentAttributes() {
		/**
		 * Prevent injecting the product attributes when not desired.
		 *
		 * When we first load a product, we should inject its attributes as our initial form state.
		 * When subsequent saves occur, we should avoid injecting attributes so that we do not
		 * overwrite changes that the user has made with stale state from the previous save.
		 */

		const { simplePayment } = this.props;
		if ( ! this.shouldInjectPaymentAttributes || isEmpty( simplePayment ) ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { content, currency, email, featuredMediaId, multiple, price, title } = attributes;

		setAttributes( {
			content: get( simplePayment, [ 'content', 'raw' ], content ),
			currency: get( simplePayment, [ 'meta', 'spay_currency' ], currency ),
			email: get( simplePayment, [ 'meta', 'spay_email' ], email ),
			featuredMediaId: get( simplePayment, [ 'featured_media' ], featuredMediaId ),
			multiple: Boolean( get( simplePayment, [ 'meta', 'spay_multiple' ], Boolean( multiple ) ) ),
			price: get( simplePayment, [ 'meta', 'spay_price' ], price || undefined ),
			title: get( simplePayment, [ 'title', 'raw' ], title ),
		} );

		this.shouldInjectPaymentAttributes = ! this.shouldInjectPaymentAttributes;
	}

	toApi() {
		const { attributes } = this.props;
		const {
			content,
			currency,
			email,
			featuredMediaId,
			multiple,
			price,
			productId,
			title,
		} = attributes;

		return {
			id: productId,
			content,
			featured_media: featuredMediaId,
			meta: {
				spay_currency: currency,
				spay_email: email,
				spay_multiple: multiple,
				spay_price: price,
			},
			status: productId ? 'publish' : 'draft',
			title,
		};
	}

	saveProduct() {
		if ( this.state.isSavingProduct ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { email } = attributes;
		const { saveEntityRecord } = dispatch( 'core' );

		this.setState( { isSavingProduct: true }, () => {
			saveEntityRecord( 'postType', SIMPLE_PAYMENTS_PRODUCT_POST_TYPE, this.toApi() )
				.then( record => {
					if ( record ) {
						setAttributes( { productId: record.id } );
					}

					return record;
				} )
				.catch( error => {
					// Nothing we can do about errors without details at the moment
					if ( ! error || ! error.data ) {
						return;
					}

					const {
						data: { key: apiErrorKey },
					} = error;

					// @TODO errors in other fields
					this.setState( {
						fieldEmailError:
							apiErrorKey === 'spay_email'
								? sprintf( __( '%s is not a valid email address.', 'jetpack' ), email )
								: null,
						fieldPriceError:
							apiErrorKey === 'spay_price' ? __( 'Invalid price.', 'jetpack' ) : null,
					} );
				} )
				.finally( () => {
					this.setState( {
						isSavingProduct: false,
					} );
				} );
		} );
	}

	validateAttributes = () => {
		const isPriceValid = this.validatePrice();
		const isTitleValid = this.validateTitle();
		const isEmailValid = this.validateEmail();
		const isCurrencyValid = this.validateCurrency();

		return isPriceValid && isTitleValid && isEmailValid && isCurrencyValid;
	};

	/**
	 * Validate currency
	 *
	 * This method does not include validation UI. Currency selection should not allow for invalid
	 * values. It is primarily to ensure that the currency is valid to save.
	 *
	 * @return  {boolean} True if currency is valid
	 */
	validateCurrency = () => {
		const { currency } = this.props.attributes;
		return SUPPORTED_CURRENCY_LIST.includes( currency );
	};

	/**
	 * Validate price
	 *
	 * Stores error message in state.fieldPriceError
	 *
	 * @returns {Boolean} True when valid, false when invalid
	 */
	validatePrice = () => {
		const { currency, price } = this.props.attributes;
		const { precision } = getCurrencyDefaults( currency );

		if ( ! price || parseFloat( price ) === 0 ) {
			this.setState( {
				fieldPriceError: __(
					'If you’re selling something, you need a price tag. Add yours here.',
					'jetpack'
				),
			} );
			return false;
		}

		if ( Number.isNaN( parseFloat( price ) ) ) {
			this.setState( {
				fieldPriceError: __( 'Invalid price', 'jetpack' ),
			} );
			return false;
		}

		if ( parseFloat( price ) < 0 ) {
			this.setState( {
				fieldPriceError: __(
					'Your price is negative — enter a positive number so people can pay the right amount.',
					'jetpack'
				),
			} );
			return false;
		}

		if ( decimalPlaces( price ) > precision ) {
			if ( precision === 0 ) {
				this.setState( {
					fieldPriceError: __(
						'We know every penny counts, but prices in this currency can’t contain decimal values.',
						'jetpack'
					),
				} );
				return false;
			}

			this.setState( {
				fieldPriceError: sprintf(
					_n(
						'The price cannot have more than %d decimal place.',
						'The price cannot have more than %d decimal places.',
						precision,
						'jetpack'
					),
					precision
				),
			} );
			return false;
		}

		if ( this.state.fieldPriceError ) {
			this.setState( { fieldPriceError: null } );
		}

		return true;
	};

	/**
	 * Validate email
	 *
	 * Stores error message in state.fieldEmailError
	 *
	 * @returns {Boolean} True when valid, false when invalid
	 */
	validateEmail = () => {
		const { email } = this.props.attributes;
		if ( ! email ) {
			this.setState( {
				fieldEmailError: __(
					'We want to make sure payments reach you, so please add an email address.',
					'jetpack'
				),
			} );
			return false;
		}

		if ( ! emailValidator.validate( email ) ) {
			this.setState( {
				fieldEmailError: sprintf( __( '%s is not a valid email address.', 'jetpack' ), email ),
			} );
			return false;
		}

		if ( this.state.fieldEmailError ) {
			this.setState( { fieldEmailError: null } );
		}

		return true;
	};

	/**
	 * Validate title
	 *
	 * Stores error message in state.fieldTitleError
	 *
	 * @returns {Boolean} True when valid, false when invalid
	 */
	validateTitle = () => {
		const { title } = this.props.attributes;
		if ( ! title ) {
			this.setState( {
				fieldTitleError: __(
					'Please add a brief title so that people know what they’re paying for.',
					'jetpack'
				),
			} );
			return false;
		}

		if ( this.state.fieldTitleError ) {
			this.setState( { fieldTitleError: null } );
		}

		return true;
	};

	handleEmailChange = email => {
		this.props.setAttributes( { email } );
		this.setState( { fieldEmailError: null } );
	};

	handleFeaturedMediaSelect = media => {
		this.props.setAttributes( { featuredMediaId: get( media, 'id', 0 ) } );
	};

	handleContentChange = content => {
		this.props.setAttributes( { content } );
	};

	handlePriceChange = price => {
		price = parseFloat( price );
		if ( ! isNaN( price ) ) {
			this.props.setAttributes( { price } );
		} else {
			this.props.setAttributes( { price: undefined } );
		}
		this.setState( { fieldPriceError: null } );
	};

	handleCurrencyChange = currency => {
		this.props.setAttributes( { currency } );
	};

	handleMultipleChange = multiple => {
		this.props.setAttributes( { multiple: !! multiple } );
	};

	handleTitleChange = title => {
		this.props.setAttributes( { title } );
		this.setState( { fieldTitleError: null } );
	};

	getCurrencyList = SUPPORTED_CURRENCY_LIST.map( value => {
		const { symbol } = getCurrencyDefaults( value );
		// if symbol is equal to the code (e.g., 'CHF' === 'CHF'), don't duplicate it.
		// trim the dot at the end, e.g., 'kr.' becomes 'kr'
		const label = symbol === value ? value : `${ value } ${ trimEnd( symbol, '.' ) }`;
		return { value, label };
	} );

	render() {
		const { fieldEmailError, fieldPriceError, fieldTitleError } = this.state;
		const {
			attributes,
			featuredMedia,
			instanceId,
			isSelected,
			setAttributes,
			simplePayment,
		} = this.props;
		const {
			content,
			currency,
			email,
			featuredMediaId,
			featuredMediaUrl: featuredMediaUrlAttribute,
			featuredMediaTitle: featuredMediaTitleAttribute,
			multiple,
			price,
			productId,
			title,
		} = attributes;

		const featuredMediaUrl =
			featuredMediaUrlAttribute || ( featuredMedia && featuredMedia.source_url );
		const featuredMediaTitle =
			featuredMediaTitleAttribute || ( featuredMedia && featuredMedia.alt_text );

		/**
		 * The only disabled state that concerns us is when we expect a product but don't have it in
		 * local state.
		 */
		const isDisabled = productId && isEmpty( simplePayment );

		if ( ! isSelected && isDisabled ) {
			return (
				<div className="simple-payments__loading">
					<ProductPlaceholder
						aria-busy="true"
						content="█████"
						formattedPrice="█████"
						title="█████"
					/>
				</div>
			);
		}

		if (
			! isSelected &&
			email &&
			price &&
			title &&
			! fieldEmailError &&
			! fieldPriceError &&
			! fieldTitleError
		) {
			return (
				<ProductPlaceholder
					aria-busy="false"
					content={ content }
					featuredMediaUrl={ featuredMediaUrl }
					featuredMediaTitle={ featuredMediaTitle }
					formattedPrice={ formatPrice( price, currency ) }
					multiple={ multiple }
					title={ title }
				/>
			);
		}

		const Wrapper = isDisabled ? Disabled : 'div';

		return (
			<Wrapper className="wp-block-jetpack-simple-payments">
				<FeaturedMedia
					{ ...{ featuredMediaId, featuredMediaUrl, featuredMediaTitle, setAttributes } }
				/>
				<div>
					<TextControl
						aria-describedby={ `${ instanceId }-title-error` }
						className={ classNames( 'simple-payments__field', 'simple-payments__field-title', {
							'simple-payments__field-has-error': fieldTitleError,
						} ) }
						label={ __( 'Item name', 'jetpack' ) }
						onChange={ this.handleTitleChange }
						placeholder={ __( 'Item name', 'jetpack' ) }
						required
						type="text"
						value={ title }
					/>
					<HelpMessage id={ `${ instanceId }-title-error` } isError>
						{ fieldTitleError }
					</HelpMessage>

					<TextareaControl
						className="simple-payments__field simple-payments__field-content"
						label={ __( 'Describe your item in a few words', 'jetpack' ) }
						onChange={ this.handleContentChange }
						placeholder={ __( 'Describe your item in a few words', 'jetpack' ) }
						value={ content }
					/>

					<div className="simple-payments__price-container">
						<SelectControl
							className="simple-payments__field simple-payments__field-currency"
							label={ __( 'Currency', 'jetpack' ) }
							onChange={ this.handleCurrencyChange }
							options={ this.getCurrencyList }
							value={ currency }
						/>
						<TextControl
							aria-describedby={ `${ instanceId }-price-error` }
							className={ classNames( 'simple-payments__field', 'simple-payments__field-price', {
								'simple-payments__field-has-error': fieldPriceError,
							} ) }
							label={ __( 'Price', 'jetpack' ) }
							onChange={ this.handlePriceChange }
							placeholder={ formatPrice( 0, currency, false ) }
							required
							step="1"
							type="number"
							value={ price || '' }
						/>
						<HelpMessage id={ `${ instanceId }-price-error` } isError>
							{ fieldPriceError }
						</HelpMessage>
					</div>

					<div className="simple-payments__field-multiple">
						<ToggleControl
							checked={ Boolean( multiple ) }
							label={ __( 'Allow people to buy more than one item at a time', 'jetpack' ) }
							onChange={ this.handleMultipleChange }
						/>
					</div>
					{ /* temporary wrapper until Gutenberg paste handler is bypassed for inputs with type="email" */ }
					<div ref={ this.emailInput }>
						<TextControl
							aria-describedby={ `${ instanceId }-email-${ fieldEmailError ? 'error' : 'help' }` }
							className={ classNames( 'simple-payments__field', 'simple-payments__field-email', {
								'simple-payments__field-has-error': fieldEmailError,
							} ) }
							label={ __( 'Email', 'jetpack' ) }
							onChange={ this.handleEmailChange }
							placeholder={ __( 'Email', 'jetpack' ) }
							required
							type="email"
							value={ email }
						/>
					</div>
					<HelpMessage id={ `${ instanceId }-email-error` } isError>
						{ fieldEmailError }
					</HelpMessage>
					<HelpMessage id={ `${ instanceId }-email-help` }>
						{ __(
							'Enter the email address associated with your PayPal account. Don’t have an account?',
							'jetpack'
						) + ' ' }
						<ExternalLink href="https://www.paypal.com/">
							{ __( 'Create one on PayPal', 'jetpack' ) }
						</ExternalLink>
					</HelpMessage>
				</div>
			</Wrapper>
		);
	}
}

const mapSelectToProps = withSelect( ( select, props ) => {
	const { getEntityRecord, getMedia } = select( 'core' );
	const { isSavingPost, getCurrentPost } = select( 'core/editor' );

	const { productId, featuredMediaId } = props.attributes;

	const fields = [
		[ 'content' ],
		[ 'meta', 'spay_currency' ],
		[ 'meta', 'spay_email' ],
		[ 'meta', 'spay_multiple' ],
		[ 'meta', 'spay_price' ],
		[ 'title', 'raw' ],
		[ 'featured_media' ],
	];

	const simplePayment = productId
		? pick( getEntityRecord( 'postType', SIMPLE_PAYMENTS_PRODUCT_POST_TYPE, productId ), fields )
		: undefined;

	return {
		hasPublishAction: !! get( getCurrentPost(), [ '_links', 'wp:action-publish' ] ),
		isSaving: !! isSavingPost(),
		simplePayment,
		featuredMedia: featuredMediaId ? getMedia( featuredMediaId ) : null,
	};
} );

export default compose( mapSelectToProps, withInstanceId )( SimplePaymentsEdit );

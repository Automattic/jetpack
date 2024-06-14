import { getCurrencyDefaults } from '@automattic/format-currency';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Disabled,
	ExternalLink,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { dispatch, withSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { getWidgetIdFromBlock } from '@wordpress/widgets';
import clsx from 'clsx';
import emailValidator from 'email-validator';
import { get, isEmpty, pick, trimEnd } from 'lodash';
import HelpMessage from '../../shared/help-message';
import { SIMPLE_PAYMENTS_PRODUCT_POST_TYPE, SUPPORTED_CURRENCY_LIST } from './constants';
import { PanelControls } from './controls';
import FeaturedMedia from './featured-media';
import ProductPlaceholder from './product-placeholder';
import { decimalPlaces, formatPrice } from './utils';

export const SimplePaymentsEdit = ( {
	attributes,
	instanceId,
	isSelected,
	setAttributes,
	simplePayment,
	featuredMedia,
	hasPublishAction,
	postLinkUrl,
	isPostEditor,
	block,
	isSaving,
} ) => {
	const {
		content,
		currency,
		email,
		featuredMediaId,
		featuredMediaUrl,
		featuredMediaTitle,
		multiple,
		price,
		productId,
		title,
	} = attributes;
	/**
	 * The only disabled state that concerns us is when we expect a product but don't have it in
	 * local state.
	 */
	const isDisabled = productId && isEmpty( simplePayment );

	const blockProps = useBlockProps();

	const [ fieldEmailError, setFieldEmailError ] = useState( null );
	const [ fieldPriceError, setFieldPriceError ] = useState( null );
	const [ fieldTitleError, setFieldTitleError ] = useState( null );
	const [ isSavingProduct, setIsSavingProduct ] = useState( false );
	/**
	 * We'll use this flag to inject attributes one time when the product entity is loaded.
	 *
	 * It is based on the presence of a `productId` attribute.
	 *
	 * If present, initially we are waiting for attributes to be injected.
	 * If absent, we may save the product in the future but do not need to inject attributes based
	 * on the response as they will have come from our product submission.
	 */
	const shouldInjectPaymentAttributes = useRef( !! productId );

	const injectPaymentAttributes = () => {
		/**
		 * Prevent injecting the product attributes when not desired.
		 *
		 * When we first load a product, we should inject its attributes as our initial form state.
		 * When subsequent saves occur, we should avoid injecting attributes so that we do not
		 * overwrite changes that the user has made with stale state from the previous save.
		 */

		if ( ! shouldInjectPaymentAttributes.current || isEmpty( simplePayment ) ) {
			return;
		}

		setAttributes( {
			content: get( simplePayment, [ 'content', 'raw' ], content ),
			currency: get( simplePayment, [ 'meta', 'spay_currency' ], currency ),
			email: get( simplePayment, [ 'meta', 'spay_email' ], email ),
			featuredMediaId: get( simplePayment, [ 'featured_media' ], featuredMediaId ),
			featuredMediaUrl: get( featuredMedia, 'url', featuredMediaUrl ),
			featuredMediaTitle: get( featuredMedia, 'title', featuredMediaTitle ),
			multiple: Boolean( get( simplePayment, [ 'meta', 'spay_multiple' ], Boolean( multiple ) ) ),
			price: get( simplePayment, [ 'meta', 'spay_price' ], price || undefined ),
			title: get( simplePayment, [ 'title', 'raw' ], title ),
		} );

		shouldInjectPaymentAttributes.current = false;
	};

	const saveProduct = () => {
		if ( isSavingProduct ) {
			return;
		}

		const { saveEntityRecord } = dispatch( 'core' );

		setIsSavingProduct( true );

		saveEntityRecord( 'postType', SIMPLE_PAYMENTS_PRODUCT_POST_TYPE, {
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
		} )
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
				setFieldEmailError(
					apiErrorKey === 'spay_email'
						? sprintf(
								/* translators: Placeholder is an email address. */
								__( '%s is not a valid email address.', 'jetpack' ),
								email
						  )
						: null
				);
				setFieldPriceError(
					apiErrorKey === 'spay_price' ? __( 'Invalid price.', 'jetpack' ) : null
				);
			} )
			.finally( () => {
				setIsSavingProduct( false );
			} );
	};

	const validateAttributes = () => {
		const isPriceValid = validatePrice();
		const isTitleValid = validateTitle();
		const isEmailValid = validateEmail();
		const isCurrencyValid = validateCurrency();

		return isPriceValid && isTitleValid && isEmailValid && isCurrencyValid;
	};

	/**
	 * Validate currency
	 *
	 * This method does not include validation UI. Currency selection should not allow for invalid
	 * values. It is primarily to ensure that the currency is valid to save.
	 *
	 * @returns  {boolean} True if currency is valid
	 */
	const validateCurrency = () => SUPPORTED_CURRENCY_LIST.includes( currency );

	/**
	 * Validate price
	 *
	 * Stores error message in state.fieldPriceError
	 *
	 * @returns {boolean} True when valid, false when invalid
	 */
	const validatePrice = () => {
		const { precision } = getCurrencyDefaults( currency );

		if ( ! price || parseFloat( price ) === 0 ) {
			setFieldPriceError(
				__( 'If you’re selling something, you need a price tag. Add yours here.', 'jetpack' )
			);
			return false;
		}

		if ( Number.isNaN( parseFloat( price ) ) ) {
			setFieldPriceError( __( 'Invalid price', 'jetpack' ) );
			return false;
		}

		if ( parseFloat( price ) < 0 ) {
			setFieldPriceError(
				__(
					'Your price is negative — enter a positive number so people can pay the right amount.',
					'jetpack'
				)
			);
			return false;
		}

		if ( decimalPlaces( price ) > precision ) {
			if ( precision === 0 ) {
				setFieldPriceError(
					__(
						'We know every penny counts, but prices in this currency can’t contain decimal values.',
						'jetpack'
					)
				);
				return false;
			}

			setFieldPriceError(
				sprintf(
					/* translators: Placeholder is a number of decimals in a number. */
					_n(
						'The price cannot have more than %d decimal place.',
						'The price cannot have more than %d decimal places.',
						precision,
						'jetpack'
					),
					precision
				)
			);
			return false;
		}

		if ( fieldPriceError ) {
			setFieldPriceError( null );
		}

		return true;
	};

	/**
	 * Validate email
	 *
	 * Stores error message in state.fieldEmailError
	 *
	 * @returns {boolean} True when valid, false when invalid
	 */
	const validateEmail = () => {
		if ( ! email ) {
			setFieldEmailError(
				__( 'We want to make sure payments reach you, so please add an email address.', 'jetpack' )
			);
			return false;
		}

		if ( ! emailValidator.validate( email ) ) {
			setFieldEmailError(
				sprintf(
					/* translators: Placeholder is an email address. */
					__( '%s is not a valid email address.', 'jetpack' ),
					email
				)
			);
			return false;
		}

		if ( fieldEmailError ) {
			setFieldEmailError( null );
		}

		return true;
	};

	/**
	 * Validate title
	 *
	 * Stores error message in state.fieldTitleError
	 *
	 * @returns {boolean} True when valid, false when invalid
	 */
	const validateTitle = () => {
		if ( ! title ) {
			setFieldTitleError(
				__( 'Please add a brief title so that people know what they’re paying for.', 'jetpack' )
			);
			return false;
		}

		if ( fieldTitleError ) {
			setFieldTitleError( null );
		}

		return true;
	};

	const handleEmailChange = value => {
		setAttributes( { email: value } );
		setFieldEmailError( null );
	};

	const handleContentChange = value => {
		setAttributes( { content: value } );
	};

	const handlePriceChange = value => {
		const p = parseFloat( value );
		if ( ! isNaN( p ) ) {
			setAttributes( { price: p } );
		} else {
			setAttributes( { price: undefined } );
		}
		setFieldPriceError( null );
	};

	const handleCurrencyChange = value => {
		setAttributes( { currency: value } );
	};

	const handleMultipleChange = value => {
		setAttributes( { multiple: !! value } );
	};

	const handleTitleChange = value => {
		setAttributes( { title: value } );
		setFieldTitleError( null );
	};

	const getCurrencyList = SUPPORTED_CURRENCY_LIST.map( value => {
		const { symbol } = getCurrencyDefaults( value );
		// if symbol is equal to the code (e.g., 'CHF' === 'CHF'), don't duplicate it.
		// trim the dot at the end, e.g., 'kr.' becomes 'kr'
		const label = symbol === value ? value : `${ value } ${ trimEnd( symbol, '.' ) }`;
		return { value, label };
	} );

	useEffect( () => {
		// If the user can publish save an empty product so that we have an ID and can save
		// concurrently with the post that contains the Simple Payment.
		if ( ( ! productId && hasPublishAction ) || ! isPostEditor ) {
			saveProduct();
		}

		window.wp?.customize?.bind( 'change', setting => {
			// See if the widget that has changed is our block.
			// Code inspired by https://github.com/WordPress/gutenberg/blob/dbeebb9985e8112689d1143fbe18c12d7cb5eb53/packages/customize-widgets/src/utils.js#L19.
			let widgetId;
			const matches = setting.id.match( /^widget_(.+)(?:\[(\d+)\])$/ );
			if ( matches ) {
				const idBase = matches[ 1 ];
				const number = parseInt( matches[ 2 ], 10 );
				widgetId = `${ idBase }-${ number }`;
			} else {
				widgetId = setting.id;
			}

			if ( widgetId === getWidgetIdFromBlock( block ) && validateAttributes() ) {
				saveProduct();
			}
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		if ( simplePayment ) {
			injectPaymentAttributes();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ simplePayment ] );

	useEffect( () => {
		if ( isSaving && ( hasPublishAction || ! isPostEditor ) && validateAttributes() ) {
			// Validate and save product on post save
			saveProduct();
		} else if ( ! isSelected ) {
			// Validate on block deselect
			validateAttributes();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isSaving, isSelected ] );

	useEffect( () => {
		const shouldUpdatePostLinkUrl = postLinkUrl && postLinkUrl !== attributes.postLinkUrl;
		const shouldUpdatePostLinkText = ! attributes.postLinkText;

		if ( shouldUpdatePostLinkUrl || shouldUpdatePostLinkText ) {
			setAttributes( {
				...( shouldUpdatePostLinkUrl && { postLinkUrl } ),
				...( shouldUpdatePostLinkText && {
					postLinkText: __( 'Click here to purchase.', 'jetpack' ),
				} ),
			} );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ postLinkUrl, attributes ] );

	let elt;

	if ( ! isSelected && isDisabled ) {
		elt = (
			<div className="simple-payments__loading">
				<ProductPlaceholder aria-busy="true" content="█████" formattedPrice="█████" title="█████" />
			</div>
		);
	} else if (
		! isSelected &&
		email &&
		price &&
		title &&
		! fieldEmailError &&
		! fieldPriceError &&
		! fieldTitleError
	) {
		elt = (
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
	} else {
		const Wrapper = isDisabled ? Disabled : 'div';

		elt = (
			<Wrapper className="simple-payments__wrapper">
				<InspectorControls>
					<PanelControls postLinkText={ attributes.postLinkText } setAttributes={ setAttributes } />
				</InspectorControls>
				<FeaturedMedia
					{ ...{ featuredMediaId, featuredMediaUrl, featuredMediaTitle, setAttributes } }
				/>
				<div>
					<TextControl
						aria-describedby={ `${ instanceId }-title-error` }
						className={ clsx( 'simple-payments__field', 'simple-payments__field-title', {
							'simple-payments__field-has-error': fieldTitleError,
						} ) }
						label={ __( 'Item name', 'jetpack' ) }
						onChange={ handleTitleChange }
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
						onChange={ handleContentChange }
						placeholder={ __( 'Describe your item in a few words', 'jetpack' ) }
						aria-label={ __( 'Describe your item in a few words', 'jetpack' ) }
						value={ content }
					/>

					<div className="simple-payments__price-container">
						<SelectControl
							className="simple-payments__field simple-payments__field-currency"
							label={ __( 'Currency', 'jetpack' ) }
							onChange={ handleCurrencyChange }
							options={ getCurrencyList }
							value={ currency }
						/>
						<TextControl
							aria-describedby={ `${ instanceId }-price-error` }
							className={ clsx( 'simple-payments__field', 'simple-payments__field-price', {
								'simple-payments__field-has-error': fieldPriceError,
							} ) }
							label={ __( 'Price', 'jetpack' ) }
							onChange={ handlePriceChange }
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
							onChange={ handleMultipleChange }
						/>
					</div>

					<TextControl
						aria-describedby={ `${ instanceId }-email-${ fieldEmailError ? 'error' : 'help' }` }
						className={ clsx( 'simple-payments__field', 'simple-payments__field-email', {
							'simple-payments__field-has-error': fieldEmailError,
						} ) }
						label={ __( 'Email', 'jetpack' ) }
						onChange={ handleEmailChange }
						placeholder={ __( 'Email', 'jetpack' ) }
						required
						// TODO: switch this back to type="email" once Gutenberg paste handler ignores inputs of type email
						type="text"
						value={ email }
					/>
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

	return <div { ...blockProps }>{ elt }</div>;
};

const mapSelectToProps = withSelect( ( select, props ) => {
	const { getEntityRecord, getMedia } = select( 'core' );
	const { getCurrentPost } = select( 'core/editor' );
	const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } = select( 'core' );
	const getDirtyEntityRecords = __experimentalGetDirtyEntityRecords;
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

	const post = getCurrentPost();

	return {
		block: select( 'core/block-editor' ).getBlock( props.clientId ),
		hasPublishAction: !! get( post, [ '_links', 'wp:action-publish' ] ),
		isSaving: getDirtyEntityRecords().some( record =>
			isSavingEntityRecord( record.kind, record.name, record.key )
		),
		simplePayment,
		featuredMedia: featuredMediaId ? getMedia( featuredMediaId ) : null,
		postLinkUrl: post?.guid?.raw,
		isPostEditor: Object.keys( getCurrentPost() ).length > 0,
	};
} );

export default compose( mapSelectToProps, withInstanceId )( SimplePaymentsEdit );

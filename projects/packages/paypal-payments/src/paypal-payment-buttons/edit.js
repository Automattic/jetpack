import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { PlainText, useBlockProps } from '@wordpress/block-editor';
import {
	ExternalLink,
	Notice,
	Placeholder,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalItemGroup as ItemGroup,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalItem as Item,
} from '@wordpress/components';
import { createInterpolateElement, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PayPalIcon from './icon';
import './editor.scss';

const extractScriptSrc = codeHead => {
	const match = codeHead.match(
		/src="(https:\/\/(www\.)?(sandbox\.)?paypal\.com\/sdk\/js\?[^"]+)"/
	);
	return match ? match[ 1 ] : '';
};

const extractHostedButtonId = codeBody => {
	// Try to extract from hostedButtonId property first (stacked buttons)
	const hostedButtonMatch = codeBody.match( /hostedButtonId:\s*["']([^"']+)["']/ );
	if ( hostedButtonMatch ) {
		return hostedButtonMatch[ 1 ];
	}

	// Try to extract from container ID (stacked buttons)
	const containerMatch = codeBody.match( /paypal-container-([^"']+)/ );
	if ( containerMatch ) {
		return containerMatch[ 1 ];
	}

	// Try to extract from form action URL (single buttons)
	const actionMatch = codeBody.match(
		/action=["']https:\/\/www\.paypal\.com\/ncp\/payment\/([^"']+)["']/
	);
	if ( actionMatch ) {
		return actionMatch[ 1 ];
	}

	// Try to extract from CSS class (single buttons)
	const cssMatch = codeBody.match( /\.pp-([A-Z0-9]+)/ );
	if ( cssMatch ) {
		return cssMatch[ 1 ];
	}

	return '';
};

const extractButtonText = codeBody => {
	// Extract button text from input value attribute (single buttons)
	const inputMatch = codeBody.match( /<input[^>]*value=["']([^"']+)["'][^>]*\/>/ );
	return inputMatch ? inputMatch[ 1 ] : '';
};

const generateHeadCode = scriptSrc => {
	if ( ! scriptSrc ) {
		return '';
	}
	return `<script src="${ scriptSrc }"></script>`;
};

const generateBodyCode = ( hostedButtonId, buttonType = 'stacked', buttonText = '' ) => {
	if ( ! hostedButtonId ) {
		return '';
	}

	if ( buttonType === 'single' ) {
		return `<style>.pp-${ hostedButtonId }{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}</style>
<form action="https://www.paypal.com/ncp/payment/${ hostedButtonId }" method="post" target="_blank" style="display:inline-grid;justify-items:center;align-content:start;gap:0.5rem;">
  <input class="pp-${ hostedButtonId }" type="submit" value="${ buttonText || 'Pay Now' }" />
  <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards" />
  <section style="font-size: 0.75rem;"> Powered by <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="paypal" style="height:0.875rem;vertical-align:middle;"/></section>
</form>`;
	}

	return `<div id="paypal-container-${ hostedButtonId }"></div>
<script>
  paypal.HostedButtons({
    hostedButtonId: "${ hostedButtonId }",
  }).render("#paypal-container-${ hostedButtonId }")
</script>`;
};

const validScriptSrc = scriptSrc =>
	/^https:\/\/(www\.)?(sandbox\.)?paypal\.com\/sdk\/js\?client-id=/.test( scriptSrc );

const validHostedButtonId = hostedButtonId => /^[A-Z0-9]+$/.test( hostedButtonId );

const validButtonText = buttonText =>
	buttonText && buttonText.trim().length > 0 && buttonText.length <= 50;

/**
 * Get PayPal signup URL with platform-specific tracking parameters
 *
 * @return {string} The PayPal signup URL
 */
const getPayPalSignupUrl = () => {
	const isWpcom = isWpcomPlatformSite();
	const utmSource = isWpcom ? 'wp_com' : 'wp_org';
	const atCode = isWpcom ? 'wp_com' : 'wp_org';
	return `https://www.paypal.com/bizsignup/entry?product=payment_button&utm_source=${ utmSource }&at_code=${ atCode }`;
};

/**
 * Get PayPal login URL with platform-specific tracking parameters
 *
 * @return {string} The PayPal login URL
 */
const getPayPalLoginUrl = () => {
	const isWpcom = isWpcomPlatformSite();
	const utmSource = isWpcom ? 'wp_com' : 'wp_org';
	const atCode = isWpcom ? 'wp_com' : 'wp_org';
	return `https://www.paypal.com/ncp/buttons/create?utm_source=${ utmSource }&at_code=${ atCode }`;
};

/**
 * PayPal Single Button Preview component (rendered directly)
 *
 * @param {object} root0            - The component props
 * @param {string} root0.buttonText - The button text
 * @return {Element} The PayPal single button preview component
 */
const PayPalSingleButtonPreview = ( { buttonText } ) => {
	const paypalButtonStyles = {
		textAlign: 'center',
		border: 'none',
		borderRadius: '0.25rem',
		minWidth: '11.625rem',
		padding: '0 2rem',
		height: '2.625rem',
		fontWeight: 'bold',
		backgroundColor: '#FFD140',
		color: '#000000',
		fontFamily: '"Helvetica Neue", Arial, sans-serif',
		fontSize: '1rem',
		lineHeight: '1.25rem',
		cursor: 'pointer',
		pointerEvents: 'none', // Prevent clicking in editor
	};

	return (
		<div style={ { textAlign: 'center' } }>
			<form
				style={ {
					display: 'inline-grid',
					justifyItems: 'center',
					alignContent: 'start',
					gap: '0.5rem',
				} }
			>
				<input type="button" value={ buttonText } style={ paypalButtonStyles } />
				<img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards" />
				<section style={ { fontSize: '0.75rem' } }>
					Powered by{ ' ' }
					<img
						src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
						alt="paypal"
						style={ { height: '0.875rem', verticalAlign: 'middle' } }
					/>
				</section>
			</form>
		</div>
	);
};

/**
 * Check if we have the required data for a preview (only single buttons)
 *
 * @param {object} attributes - The block attributes
 * @return {boolean} Whether preview can be shown
 */
const canShowPreview = attributes => {
	const { buttonType, hostedButtonId, buttonText } = attributes;

	if ( ! hostedButtonId || ! validHostedButtonId( hostedButtonId ) ) {
		return false;
	}

	if ( buttonType === 'single' ) {
		return buttonText && validButtonText( buttonText );
	}

	return false;
};

/**
 * PayPal Preview component router
 *
 * @param {object} root0            - The component props
 * @param {object} root0.attributes - The block attributes
 * @return {Element|null} The PayPal preview component or null
 */
const PayPalPreview = ( { attributes } ) => {
	const { buttonType, buttonText } = attributes;

	if ( ! canShowPreview( attributes ) ) {
		return null;
	}

	// Only render preview for single button type
	if ( buttonType === 'single' ) {
		return <PayPalSingleButtonPreview buttonText={ buttonText } />;
	}

	return null;
};

export default function Edit( { attributes, setAttributes, isSelected } ) {
	const { buttonType, scriptSrc, hostedButtonId, buttonText } = attributes;
	const [ notice, setNotice ] = useState( null );
	const [ rawHeadCode, setRawHeadCode ] = useState( '' );
	const [ rawBodyCode, setRawBodyCode ] = useState( '' );

	const stackedInstructions = __(
		'Stacked Buttons (Recommended): This option lets you present all of your product information and PayPal payment method upfront on your website.',
		'jetpack-paypal-payments'
	);
	const singleInstructions = __(
		'Single Button: This option lets you quickly paste a single button on your site, with no product information.',
		'jetpack-paypal-payments'
	);

	// Initialize raw code when valid extracted values exist
	useEffect( () => {
		if ( ! rawHeadCode && scriptSrc && buttonType === 'stacked' ) {
			setRawHeadCode( generateHeadCode( scriptSrc ) );
		}
	}, [ scriptSrc, rawHeadCode, buttonType ] );

	useEffect( () => {
		if ( ! rawBodyCode && hostedButtonId ) {
			setRawBodyCode( generateBodyCode( hostedButtonId, buttonType, buttonText ) );
		}
	}, [ hostedButtonId, rawBodyCode, buttonType, buttonText ] );

	useEffect( () => {
		// Check if user has pasted invalid code that couldn't be extracted
		if ( 'stacked' === buttonType && rawHeadCode && rawHeadCode.trim() && ! scriptSrc ) {
			return setNotice(
				<Notice status="error" isDismissible={ false }>
					{ __(
						'Invalid PayPal script URL. Please paste code from PayPal.com.',
						'jetpack-paypal-payments'
					) }
				</Notice>
			);
		}

		if ( rawBodyCode && rawBodyCode.trim() && ! hostedButtonId ) {
			return setNotice(
				<Notice status="error" isDismissible={ false }>
					{ __(
						'Invalid PayPal button code. Please paste code from PayPal.com.',
						'jetpack-paypal-payments'
					) }
				</Notice>
			);
		}

		// Validate extracted values
		if ( 'stacked' === buttonType && scriptSrc && ! validScriptSrc( scriptSrc ) ) {
			return setNotice(
				<Notice status="error" isDismissible={ false }>
					{ __( 'Invalid PayPal script URL.', 'jetpack-paypal-payments' ) }
				</Notice>
			);
		}

		if ( hostedButtonId && ! validHostedButtonId( hostedButtonId ) ) {
			return setNotice(
				<Notice status="error" isDismissible={ false }>
					{ __( 'Invalid PayPal button ID.', 'jetpack-paypal-payments' ) }
				</Notice>
			);
		}

		if ( 'single' === buttonType && buttonText && ! validButtonText( buttonText ) ) {
			return setNotice(
				<Notice status="error" isDismissible={ false }>
					{ __( 'Button text must be between 1 and 50 characters.', 'jetpack-paypal-payments' ) }
				</Notice>
			);
		}

		setNotice( null );
	}, [ buttonType, scriptSrc, hostedButtonId, buttonText, rawHeadCode, rawBodyCode ] );

	const blockProps = useBlockProps();

	// Early return for preview rendering
	if ( ! isSelected && ! notice && canShowPreview( attributes ) ) {
		return (
			<div { ...blockProps }>
				<PayPalPreview attributes={ attributes } />
			</div>
		);
	}

	const stackedButtonCodeLabel = __( 'Part 2 code', 'jetpack-paypal-payments' );
	const stackedButtonCodePlaceholder = __(
		'Paste the part 2 code here…',
		'jetpack-paypal-payments'
	);

	const singleButtonCodeLabel = __( 'Single button code', 'jetpack-paypal-payments' );
	const singleButtonCodePlaceholder = __(
		'Paste the single button code here…',
		'jetpack-paypal-payments'
	);

	return (
		<div { ...blockProps }>
			<Placeholder
				icon={ PayPalIcon }
				label={ __( 'PayPal Payment Buttons', 'jetpack-paypal-payments' ) }
				isColumnLayout
				instructions={ buttonType === 'stacked' ? stackedInstructions : singleInstructions }
				notices={ notice }
			>
				<ItemGroup>
					<Item>
						{ createInterpolateElement(
							__(
								'1. <SignupLink><strong>Sign up</strong></SignupLink> or <LoginLink><strong>log in</strong></LoginLink> to PayPal to get your Payment Button code.',
								'jetpack-paypal-payments'
							),
							{
								SignupLink: <ExternalLink href={ getPayPalSignupUrl() } />,
								LoginLink: <ExternalLink href={ getPayPalLoginUrl() } />,
								strong: <strong />,
							}
						) }
					</Item>
					<Item>
						{ 'stacked' === buttonType &&
							__(
								'2. After login, choose Payment Buttons. Enter your product or service details, and build the buttons. Copy the button code for Stacked Buttons (copy html code).',
								'jetpack-paypal-payments'
							) }
						{ 'single' === buttonType &&
							__(
								'2. After login, choose Payment Buttons. Enter your product or service details, and build the buttons. Copy the button code for Single Button.',
								'jetpack-paypal-payments'
							) }
					</Item>
					<Item>{ __( '3. Paste the code below.', 'jetpack-paypal-payments' ) }</Item>
				</ItemGroup>
				<ToggleGroupControl
					label={ __( 'Button type', 'jetpack-paypal-payments' ) }
					value={ buttonType }
					hideLabelFromVision
					onChange={ type => {
						const newAttributes = { buttonType: type };
						newAttributes.scriptSrc = '';
						newAttributes.buttonText = '';
						newAttributes.hostedButtonId = '';

						setRawHeadCode( '' );
						setRawBodyCode( '' );

						setAttributes( newAttributes );
					} }
					isBlock
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				>
					<ToggleGroupControlOption
						value="stacked"
						label={ __( 'Stacked Buttons (Recommended)', 'jetpack-paypal-payments' ) }
						aria-label={ __(
							'Stacked Buttons are the recommended option for better conversion rates.',
							'jetpack-paypal-payments'
						) }
						showTooltip={ true }
					/>
					<ToggleGroupControlOption
						value="single"
						label={ __( 'Single Button', 'jetpack-paypal-payments' ) }
					/>
				</ToggleGroupControl>
				{ 'stacked' === buttonType && (
					<PlainText
						value={ rawHeadCode }
						onChange={ code => {
							setRawHeadCode( code );
							const extractedSrc = extractScriptSrc( code );
							setAttributes( {
								scriptSrc: extractedSrc,
							} );
						} }
						placeholder={ __( 'Paste the part 1 code here…', 'jetpack-paypal-payments' ) }
						aria-label={ __( 'Part 1 code', 'jetpack-paypal-payments' ) }
						name="paypal-payment-buttons-code-head"
					/>
				) }
				<PlainText
					value={ rawBodyCode }
					onChange={ code => {
						setRawBodyCode( code );
						const extractedButtonId = extractHostedButtonId( code );
						const extractedButtonText = extractButtonText( code );
						setAttributes( {
							hostedButtonId: extractedButtonId,
							buttonText: extractedButtonText,
						} );
					} }
					placeholder={
						'stacked' === buttonType ? stackedButtonCodePlaceholder : singleButtonCodePlaceholder
					}
					aria-label={ 'stacked' === buttonType ? stackedButtonCodeLabel : singleButtonCodeLabel }
					name="paypal-payment-buttons-code-body"
				/>
			</Placeholder>
		</div>
	);
}

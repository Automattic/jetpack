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
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalItemGroup as ItemGroup,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalItem as Item,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
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

const generateBodyCode = hostedButtonId => {
	if ( ! hostedButtonId ) {
		return '';
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

export default function Edit( { attributes, setAttributes } ) {
	const { buttonType, scriptSrc, hostedButtonId, buttonText } = attributes;
	const [ notice, setNotice ] = useState( null );
	const [ rawHeadCode, setRawHeadCode ] = useState( '' );
	const [ rawBodyCode, setRawBodyCode ] = useState( '' );

	// Extract instruction strings to avoid ternary operator in i18n
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
		if ( ! rawHeadCode && scriptSrc ) {
			setRawHeadCode( generateHeadCode( scriptSrc ) );
		}
	}, [ scriptSrc, rawHeadCode ] );

	useEffect( () => {
		if ( ! rawBodyCode && hostedButtonId ) {
			setRawBodyCode( generateBodyCode( hostedButtonId ) );
		}
	}, [ hostedButtonId, rawBodyCode ] );

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

	return (
		<div { ...useBlockProps() }>
			<Placeholder
				icon={ PayPalIcon }
				label={ __( 'PayPal Payment Buttons', 'jetpack-paypal-payments' ) }
				isColumnLayout
				instructions={ buttonType === 'stacked' ? stackedInstructions : singleInstructions }
				notices={ notice }
			>
				<ToggleGroupControl
					label={ __( 'Button type', 'jetpack-paypal-payments' ) }
					value={ buttonType }
					hideLabelFromVision
					onChange={ type => setAttributes( { buttonType: type } ) }
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
				<Text>
					<strong>{ __( 'Instructions:', 'jetpack-paypal-payments' ) }</strong>
				</Text>
				<ItemGroup>
					<Item>
						1.{ ' ' }
						<ExternalLink
							href={ __( 'https://www.paypal.com/buttons/', 'jetpack-paypal-payments' ) }
						>
							{ __( 'Go to PayPal to get your button code', 'jetpack-paypal-payments' ) }
						</ExternalLink>
					</Item>
					<Item>
						{ __(
							'2. After login, choose Payment Buttons. Enter your product or service details, and build the buttons. Copy the button code for Stacked Buttons (copy html code) or Single Button.',
							'jetpack-paypal-payments'
						) }
					</Item>
					<Item>{ __( '3. Paste the code below.', 'jetpack-paypal-payments' ) }</Item>
				</ItemGroup>
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
						placeholder={ __( 'Paste the head code here…', 'jetpack-paypal-payments' ) }
						aria-label={ __( 'PayPal button head code', 'jetpack-paypal-payments' ) }
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
					placeholder={ __( 'Paste the code here…', 'jetpack-paypal-payments' ) }
					aria-label={ __( 'PayPal button code', 'jetpack-paypal-payments' ) }
					name="paypal-payment-buttons-code-body"
				/>
			</Placeholder>
		</div>
	);
}

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
import { __, _x } from '@wordpress/i18n';
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

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see    https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {object}   props               - Properties passed to the function.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Function to update block attributes.
 * @param {boolean}  props.isSelected    - Whether the block is selected.
 * @return {Element}                     Element to render.
 */
export default function Edit( { attributes, setAttributes, isSelected } ) {
	const { buttonType, scriptSrc, hostedButtonId, buttonText } = attributes;
	const [ notice, setNotice ] = useState( null );

	useEffect( () => {
		if ( isSelected ) {
			setNotice( null );
			return;
		}

		// Only validate if we have data to validate
		if ( ! scriptSrc && ! hostedButtonId ) {
			setNotice( null );
			return;
		}

		// Validate script src for stacked buttons
		if ( 'stacked' === buttonType && scriptSrc && ! validScriptSrc( scriptSrc ) ) {
			return setNotice(
				<Notice status="error" isDismissible={ false }>
					{ __( 'Invalid PayPal script URL.', 'jetpack-paypal-payments' ) }
				</Notice>
			);
		}

		// Validate hosted button ID
		if ( hostedButtonId && ! validHostedButtonId( hostedButtonId ) ) {
			return setNotice(
				<Notice status="error" isDismissible={ false }>
					{ __( 'Invalid PayPal button ID.', 'jetpack-paypal-payments' ) }
				</Notice>
			);
		}

		// Validate button text for single buttons
		if ( 'single' === buttonType && buttonText && ! validButtonText( buttonText ) ) {
			return setNotice(
				<Notice status="error" isDismissible={ false }>
					{ __( 'Button text must be between 1 and 50 characters.', 'jetpack-paypal-payments' ) }
				</Notice>
			);
		}

		setNotice( null );
	}, [ buttonType, scriptSrc, hostedButtonId, buttonText, isSelected ] );

	return (
		<div { ...useBlockProps() }>
			<Placeholder
				icon={ PayPalIcon }
				label={ __( 'PayPal Payment Buttons', 'jetpack-paypal-payments' ) }
				isColumnLayout
				instructions={
					buttonType === 'stacked'
						? __(
								'Stacked Buttons (Recommended): This option lets you present all of your product information and PayPal payment method upfront on your website.',
								'jetpack-paypal-payments'
						  )
						: _x(
								'Single Button: This option lets you quickly paste a single button on your site, with no product information.',
								'jetpack-paypal-payments',
								'jetpack-paypal-payments'
						  )
				}
				notices={ notice }
			>
				<Text>
					<strong>Instructions:</strong>
				</Text>
				<ItemGroup>
					<Item>1. Go to PayPal to get your Payment Button code.</Item>
					<Item>
						2. After login, choose <em>Payment Buttons</em>. Enter your product or service details,
						and build the buttons. Copy the button code for Stacked Buttons (copy html code) or
						Single Button.{ ' ' }
					</Item>
					<Item>3. Paste the code below.</Item>
				</ItemGroup>
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
				{ 'stacked' === buttonType && (
					<PlainText
						value={ generateHeadCode( scriptSrc ) }
						onChange={ code => {
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
					value={ generateBodyCode( hostedButtonId ) }
					onChange={ code => {
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
				<ExternalLink href={ __( 'https://www.paypal.com/buttons/', 'jetpack-paypal-payments' ) }>
					{ __( 'Go to PayPal to get your button code', 'jetpack-paypal-payments' ) }
				</ExternalLink>
			</Placeholder>
		</div>
	);
}

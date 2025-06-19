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

const validCodeBody = ( buttonType, codeBody ) => {
	if ( buttonType === 'stacked' ) {
		return /paypal-container-/.test( codeBody );
	}

	if ( buttonType === 'single' ) {
		return codeBody.match( /paypal\.com|paypalobjects\.com/g )?.length === 3;
	}

	return false;
};

const validCodeHead = codeHead => /src=".*\/sdk\/js\?client-id=/.test( codeHead );

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
	const { buttonType, codeHead, codeBody } = attributes;
	const [ notice, setNotice ] = useState( null );

	useEffect( () => {
		if ( ! codeBody || isSelected ) {
			setNotice( null );
			return;
		}

		if ( ! validCodeBody( buttonType, codeBody ) ) {
			return setNotice(
				<Notice status="error" isDismissible={ false }>
					{ __( 'This does not look like a valid PayPal button.', 'jetpack-paypal-payments' ) }
				</Notice>
			);
		}

		if ( 'stacked' === buttonType && ! validCodeHead( codeHead ) ) {
			return setNotice(
				<Notice status="warning" isDismissible={ false }>
					{ __(
						"Missing PayPal head script. If you've already added it to your header, you can safely ignore this.",
						'jetpack-paypal-payments'
					) }
				</Notice>
			);
		}

		setNotice( null );
	}, [ buttonType, codeHead, codeBody, isSelected ] );

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
						value={ codeHead }
						onChange={ code => setAttributes( { codeHead: code } ) }
						placeholder={ __( 'Paste the head code here…', 'jetpack-paypal-payments' ) }
						aria-label={ __( 'PayPal button head code', 'jetpack-paypal-payments' ) }
						name="paypal-payment-buttons-code-head"
					/>
				) }
				<PlainText
					value={ codeBody }
					onChange={ codeBody => setAttributes( { codeBody } ) } // eslint-disable-line no-shadow
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

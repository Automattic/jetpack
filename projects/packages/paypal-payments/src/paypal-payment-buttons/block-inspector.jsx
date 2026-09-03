/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — The block inspector sidebar.
 *
 * @package
 */

import { InspectorControls } from '@wordpress/block-editor';
import { Button, ButtonGroup, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import FormatSwitcher from './format-switcher';

/**
 * The inspector sidebar — format switcher, Style preset, and connection info.
 *
 * @param {object}   props                    - Component props.
 * @param {Function} props.setAttributes      - Function to update block attributes.
 * @param {string}   props.colorScheme        - The color scheme attribute.
 * @param {string}   props.resourceId         - The PayPal resource ID attribute.
 * @param {string}   props.activeFormat       - The display format, normalized.
 * @param {boolean}  props.isConnected        - Whether the site is connected to PayPal.
 * @param {string}   props.environment        - 'production' or 'sandbox'.
 * @param {Function} props.setShowReconnect   - Setter for the reconnect request.
 * @param {boolean}  props.isCreating         - Whether a create or update request is in flight.
 * @param {Function} props.handleDeleteButton - Delete the PayPal payment.
 * @param {Function} props.handleDisconnect   - Disconnect the PayPal account.
 * @param {boolean}  props.hasButton          - Whether the block has a created button.
 * @return {Element} The inspector sidebar.
 */
export default function BlockInspector( {
	setAttributes,
	colorScheme,
	resourceId,
	activeFormat,
	isConnected,
	environment,
	setShowReconnect,
	isCreating,
	handleDeleteButton,
	handleDisconnect,
	hasButton,
} ) {
	return (
		<InspectorControls>
			{ /* Style preset: Light / Auto / Dark — overrides the OS/theme auto-detect */ }
			<PanelBody title={ __( 'Style', 'jetpack-paypal-payments' ) } initialOpen={ true }>
				<p className="jetpack-paypal-payment-buttons__scheme-label">
					{ __(
						'Choose how the button adapts to your site theme. "Auto" follows the visitor\'s OS preference.',
						'jetpack-paypal-payments'
					) }
				</p>
				<ButtonGroup className="jetpack-paypal-payment-buttons__scheme-toggle">
					<Button
						variant={ colorScheme === 'light' ? 'primary' : 'secondary' }
						aria-pressed={ colorScheme === 'light' }
						onClick={ () => setAttributes( { colorScheme: 'light' } ) }
					>
						{ __( 'Light', 'jetpack-paypal-payments' ) }
					</Button>
					<Button
						variant={ colorScheme === 'auto' || ! colorScheme ? 'primary' : 'secondary' }
						aria-pressed={ colorScheme === 'auto' || ! colorScheme }
						onClick={ () => setAttributes( { colorScheme: 'auto' } ) }
					>
						{ __( 'Auto', 'jetpack-paypal-payments' ) }
					</Button>
					<Button
						variant={ colorScheme === 'dark' ? 'primary' : 'secondary' }
						aria-pressed={ colorScheme === 'dark' }
						onClick={ () => setAttributes( { colorScheme: 'dark' } ) }
					>
						{ __( 'Dark', 'jetpack-paypal-payments' ) }
					</Button>
				</ButtonGroup>
				<p className="jetpack-paypal-payment-buttons__scheme-hint">
					{ __(
						'For advanced styling, target .wp-block-jetpack-paypal-payment-buttons or use data-color-scheme="light|dark|auto" in custom CSS.',
						'jetpack-paypal-payments'
					) }
				</p>
			</PanelBody>

			{ hasButton && (
				<PanelBody title={ __( 'Display Format', 'jetpack-paypal-payments' ) } initialOpen={ true }>
					<FormatSwitcher
						value={ activeFormat }
						onChange={ value => setAttributes( { format: value } ) }
						disabled={ isCreating }
					/>
				</PanelBody>
			) }

			{ hasButton && (
				<PanelBody
					title={ __( 'PayPal Connection', 'jetpack-paypal-payments' ) }
					initialOpen={ false }
				>
					<p>
						{ __( 'Resource ID:', 'jetpack-paypal-payments' ) } <code>{ resourceId }</code>
					</p>
					<p>
						{ __( 'Environment:', 'jetpack-paypal-payments' ) } <strong>{ environment }</strong>
					</p>
					<div className="jetpack-paypal-payment-buttons__destructive-actions">
						<Button
							variant="secondary"
							isDestructive
							onClick={ handleDeleteButton }
							disabled={ isCreating || ! isConnected }
						>
							{ __( 'Delete Button', 'jetpack-paypal-payments' ) }
						</Button>
						{ isConnected ? (
							<Button variant="secondary" isDestructive onClick={ handleDisconnect }>
								{ __( 'Disconnect', 'jetpack-paypal-payments' ) }
							</Button>
						) : (
							<Button variant="secondary" onClick={ () => setShowReconnect( true ) }>
								{ __( 'Reconnect', 'jetpack-paypal-payments' ) }
							</Button>
						) }
					</div>
				</PanelBody>
			) }

			{ ! hasButton && (
				<PanelBody
					title={ __( 'PayPal Connection', 'jetpack-paypal-payments' ) }
					initialOpen={ false }
				>
					<p>
						{ __( 'Environment:', 'jetpack-paypal-payments' ) } <strong>{ environment }</strong>
					</p>
					{ isConnected ? (
						<Button variant="secondary" isDestructive onClick={ handleDisconnect }>
							{ __( 'Disconnect PayPal', 'jetpack-paypal-payments' ) }
						</Button>
					) : (
						<Button variant="secondary" onClick={ () => setShowReconnect( true ) }>
							{ __( 'Reconnect PayPal', 'jetpack-paypal-payments' ) }
						</Button>
					) }
				</PanelBody>
			) }
		</InspectorControls>
	);
}

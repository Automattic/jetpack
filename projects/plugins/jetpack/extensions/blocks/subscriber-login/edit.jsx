import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, BaseControl, TextControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import metadata from './block.json';

function SubscriberLoginEdit( { attributes, setAttributes } ) {
	const logInInputId = useInstanceId( TextControl, 'inspector-text-control' );
	const logOutInputId = useInstanceId( TextControl, 'inspector-text-control' );
	const manageSubscriptionsInputId = useInstanceId( TextControl, 'inspector-text-control' );
	const blockProps = useBlockProps();
	const validatedAttributes = getValidatedAttributes( metadata.attributes, attributes );
	const {
		redirectToCurrent,
		logInLabel,
		logOutLabel,
		showManageSubscriptionsLink,
		manageSubscriptionsLabel,
	} = validatedAttributes;

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Redirect to current URL', 'jetpack' ) }
						checked={ redirectToCurrent }
						onChange={ () => setAttributes( { redirectToCurrent: ! redirectToCurrent } ) }
						__nextHasNoMarginBottom={ true }
					/>
					<BaseControl
						label={ __( 'Log in label', 'jetpack' ) }
						id={ logInInputId }
						__nextHasNoMarginBottom={ true }
					>
						<TextControl
							placeholder={ __( 'Log in', 'jetpack' ) }
							onChange={ value => setAttributes( { logInLabel: value } ) }
							value={ logInLabel }
							id={ logInInputId }
							__next40pxDefaultSize={ true }
							__nextHasNoMarginBottom={ true }
						/>
					</BaseControl>
					<BaseControl
						label={ __( 'Log out label', 'jetpack' ) }
						id={ logOutInputId }
						__nextHasNoMarginBottom={ true }
					>
						<TextControl
							placeholder={ __( 'Log out', 'jetpack' ) }
							onChange={ value => setAttributes( { logOutLabel: value } ) }
							value={ logOutLabel }
							id={ logOutInputId }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>
					</BaseControl>
					<ToggleControl
						label={ __( 'Show "Manage subscription" link', 'jetpack' ) }
						checked={ showManageSubscriptionsLink }
						onChange={ () =>
							setAttributes( { showManageSubscriptionsLink: ! showManageSubscriptionsLink } )
						}
						__nextHasNoMarginBottom={ true }
					/>
					{ showManageSubscriptionsLink && (
						<BaseControl
							label={ __( 'Manage subscription label', 'jetpack' ) }
							id={ manageSubscriptionsInputId }
							__nextHasNoMarginBottom={ true }
						>
							<TextControl
								placeholder={ __( 'Manage subscription', 'jetpack' ) }
								onChange={ value => setAttributes( { manageSubscriptionsLabel: value } ) }
								value={ manageSubscriptionsLabel }
								id={ manageSubscriptionsInputId }
								__nextHasNoMarginBottom={ true }
								__next40pxDefaultSize={ true }
							/>
						</BaseControl>
					) }
				</PanelBody>
			</InspectorControls>
			<a href="#logout-pseudo-link">{ logOutLabel || __( 'Log out', 'jetpack' ) }</a>
		</div>
	);
}

export default SubscriberLoginEdit;

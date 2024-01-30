import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, BaseControl, TextControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import metadata from './block.json';

function SubscriberLoginEdit( { attributes, setAttributes, className } ) {
	const logInInputId = useInstanceId( TextControl, 'inspector-text-control' );
	const logOutInputId = useInstanceId( TextControl, 'inspector-text-control' );
	const manageSubscriptionsInputId = useInstanceId( TextControl, 'inspector-text-control' );
	const validatedAttributes = getValidatedAttributes( metadata.attributes, attributes );
	const { redirectToCurrent, logInLabel, logOutLabel, manageSubscriptionsLabel } =
		validatedAttributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Redirect to current URL', 'jetpack' ) }
						checked={ redirectToCurrent }
						onChange={ () => setAttributes( { redirectToCurrent: ! redirectToCurrent } ) }
					/>
					<BaseControl label={ __( 'Log in label', 'jetpack' ) } id={ logInInputId }>
						<TextControl
							placeholder={ __( 'Log in', 'jetpack' ) }
							onChange={ value => setAttributes( { logInLabel: value } ) }
							value={ logInLabel }
							id={ logInInputId }
						/>
					</BaseControl>
					<BaseControl label={ __( 'Log out label', 'jetpack' ) } id={ logOutInputId }>
						<TextControl
							placeholder={ __( 'Log out', 'jetpack' ) }
							onChange={ value => setAttributes( { logOutLabel: value } ) }
							value={ logOutLabel }
							id={ logOutInputId }
						/>
					</BaseControl>
					<BaseControl
						label={ __( 'Manage subscriptions label', 'jetpack' ) }
						id={ manageSubscriptionsInputId }
					>
						<TextControl
							placeholder={ __( 'Manage subscriptions', 'jetpack' ) }
							onChange={ value => setAttributes( { manageSubscriptionsLabel: value } ) }
							value={ manageSubscriptionsLabel }
							id={ manageSubscriptionsInputId }
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>
			<div className={ className }>
				<a href="#logout-pseudo-link">{ logOutLabel || __( 'Log out', 'jetpack' ) }</a>
			</div>
		</>
	);
}

export default SubscriberLoginEdit;

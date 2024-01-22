import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, BaseControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function SubscriberLoginEdit( { attributes, setAttributes, className } ) {
	const { redirectToCurrent, logInLabel, logOutLabel, manageSubscriptionsLabel } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Redirect to current URL', 'jetpack' ) }
						checked={ redirectToCurrent }
						onChange={ () => setAttributes( { redirectToCurrent: ! redirectToCurrent } ) }
					/>
					<BaseControl label={ __( 'Log in label', 'jetpack' ) }>
						<TextControl
							placeholder={ __( 'Log in link label', 'jetpack' ) }
							onChange={ value =>
								setAttributes( { logInLabel: value || __( 'Log in', 'jetpack' ) } )
							}
							value={ logInLabel }
						/>
					</BaseControl>
					<BaseControl label={ __( 'Log out label', 'jetpack' ) }>
						<TextControl
							placeholder={ __( 'Log out link label', 'jetpack' ) }
							onChange={ value =>
								setAttributes( { logOutLabel: value || __( 'Log out', 'jetpack' ) } )
							}
							value={ logOutLabel }
						/>
					</BaseControl>
					<BaseControl label={ __( 'Manage subscriptions label', 'jetpack' ) }>
						<TextControl
							placeholder={ __( 'Manage subscriptions link label', 'jetpack' ) }
							onChange={ value =>
								setAttributes( {
									manageSubscriptionsLabel: value || __( 'Manage subscriptions', 'jetpack' ),
								} )
							}
							value={ manageSubscriptionsLabel }
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

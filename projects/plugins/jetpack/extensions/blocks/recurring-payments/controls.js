/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, PanelBody, SelectControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';

/**
 * Internal dependencies
 */
import { formatProductAmount } from './util';
import StripeConnectToolbarButton from '../../shared/components/stripe-connect-toolbar-button';

export function PanelControls( { attributes: { planId }, products, setMembershipAmount } ) {
	return (
		<Fragment>
			<PanelBody title={ __( 'Payment plan', 'jetpack' ) }>
				<SelectControl
					label={ __( 'Payment plan', 'jetpack' ) }
					value={ planId }
					onChange={ id => setMembershipAmount( id ) }
					options={ products.map( product => ( {
						label: formatProductAmount( product ),
						value: product.id,
						key: product.id,
					} ) ) }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Management', 'jetpack' ) }>
				<ExternalLink href={ `https://wordpress.com/earn/payments/${ getSiteFragment() }` }>
					{ __( 'See your earnings, subscriber list, and payment plans.', 'jetpack' ) }
				</ExternalLink>
			</PanelBody>
		</Fragment>
	);
}

export function ToolbarControls( { connected, connectUrl, hasUpgradeNudge, shouldUpgrade } ) {
	if ( hasUpgradeNudge || shouldUpgrade || connected ) {
		return null;
	}
	return <StripeConnectToolbarButton blockName="recurring-payments" connectUrl={ connectUrl } />;
}

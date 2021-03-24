/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ExternalLink,
	PanelBody,
	ToolbarButton,
	ToolbarGroup,
	SelectControl,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import getSiteFragment from '../../shared/get-site-fragment';
import { flashIcon } from '../../shared/icons';

/**
 * Internal dependencies
 */
import { formatProductAmount } from './util';

export function PanelControls( { attributes: { planId }, products, setMembershipAmount } ) {
	return (
		<Fragment>
			<PanelBody title={ __( 'Payment plan', 'jetpack' ) }>
				<SelectControl
					label={ __( 'Payment plan', 'jetpack' ) }
					value={ planId }
					onChange={ setMembershipAmount }
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

export function ToolbarControls( {
	autosaveAndRedirect,
	connected,
	connectURL,
	hasUpgradeNudge,
	shouldUpgrade,
} ) {
	return (
		<Fragment>
			{ ! hasUpgradeNudge && ! shouldUpgrade && ! connected && (
				<ToolbarGroup>
					<ToolbarButton
						icon={ flashIcon }
						onClick={ e => {
							autosaveAndRedirect( e, connectURL );
						} }
						className="connect-stripe components-tab-button"
					>
						{ __( 'Connect Stripe', 'jetpack' ) }
					</ToolbarButton>
				</ToolbarGroup>
			) }
		</Fragment>
	);
}

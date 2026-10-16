/**
 * External dependencies
 */
import { ButtonLink } from '@jetpack-premium-analytics/externals';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Fragment } from 'react';
/**
 * Internal dependencies
 */
import styles from './date-limit-upsell.module.scss';

type DateLimitUpsellProps = {
	upsell: { description: string; supportUrl: string; upgradeUrl: string };
	onUpgradeClick?: () => void;
};

/**
 * Why some periods are locked, and where to unlock them.
 *
 * @param props                - Component props.
 * @param props.upsell         - The server's copy and links.
 * @param props.onUpgradeClick - Called when the reader follows the upgrade link.
 * @return The upsell.
 */
export function DateLimitUpsell( { upsell, onUpgradeClick }: DateLimitUpsellProps ) {
	return (
		<div className={ styles.root }>
			<p className={ styles.description }>
				{ createInterpolateElement( upsell.description, {
					link: upsell.supportUrl ? (
						<ExternalLink href={ upsell.supportUrl }>{ null }</ExternalLink>
					) : (
						<Fragment />
					),
				} ) }
			</p>
			{ upsell.upgradeUrl && (
				<ButtonLink href={ upsell.upgradeUrl } onClick={ onUpgradeClick }>
					{ __( 'Upgrade', 'jetpack-premium-analytics-pkg' ) }
				</ButtonLink>
			) }
		</div>
	);
}

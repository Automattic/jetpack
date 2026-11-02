/**
 * External dependencies
 */
import { type DateLimitUpsellCopy } from '@jetpack-premium-analytics/data';
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
	upsell: DateLimitUpsellCopy;
	descriptionId?: string;
};

/**
 * Why some date options are locked, and where to unlock them.
 *
 * @param props               - Component props.
 * @param props.upsell        - The server's copy, where `<link>` wraps the support link, and URLs; an empty URL omits its link.
 * @param props.descriptionId - Ids the copy alone, to describe locked options without the Upgrade button.
 * @return The upsell.
 */
export function DateLimitUpsell( { upsell, descriptionId }: DateLimitUpsellProps ) {
	return (
		<div className={ styles.root }>
			<p id={ descriptionId } className={ styles.description }>
				{ createInterpolateElement( upsell.description, {
					link: upsell.supportUrl ? (
						<ExternalLink href={ upsell.supportUrl }>{ null }</ExternalLink>
					) : (
						<Fragment />
					),
				} ) }
			</p>
			{ upsell.upgradeUrl && (
				<ButtonLink href={ upsell.upgradeUrl } onClick={ upsell.onUpgradeClick }>
					{ __( 'Upgrade', 'jetpack-premium-analytics-pkg' ) }
				</ButtonLink>
			) }
		</div>
	);
}

/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import { DisconnectCard } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';
import './style.scss';

/**
 * Shows a list of benefits that Jetpack provides.
 *
 * @param {object} props - The component props.
 * @param {Array} props.siteBenefits - An array of site benefits.
 * @returns {React.Component} - The JetpackBenefits component.
 */
const JetpackBenefits = props => {
	const { siteBenefits } = props;
	const generalBenefits = [
		createInterpolateElement(
			__( 'Speed up your site with <ExternalLink>our CDN</ExternalLink>', 'jetpack' ),
			{
				ExternalLink: (
					<ExternalLink
						href={ getRedirectUrl( 'jetpack-features-design-content-delivery-network' ) }
						rel="noopener noreferrer"
						target="_blank"
					></ExternalLink>
				),
			}
		),
		createInterpolateElement(
			__( 'Block <ExternalLink>brute force attacks</ExternalLink>', 'jetpack' ),
			{
				ExternalLink: (
					<ExternalLink
						href={ getRedirectUrl( 'jetpack-features-security' ) }
						rel="noopener noreferrer"
						target="_blank"
					></ExternalLink>
				),
			}
		),
		createInterpolateElement(
			__(
				'Grow your traffic with automated social <ExternalLink>publishing and sharing</ExternalLink>',
				'jetpack'
			),
			{
				ExternalLink: (
					<ExternalLink
						href={ getRedirectUrl( 'jetpack-support-social' ) }
						rel="noopener noreferrer"
						target="_blank"
					></ExternalLink>
				),
			}
		),
	];

	return (
		<React.Fragment>
			{ siteBenefits.length > 0 && (
				<React.Fragment>
					<div className="jp-connection__disconnect-dialog__step-copy">
						<p className="jp-connection__disconnect-dialog__large-text">
							{ __(
								'Jetpack is currently powering features on your site. Once you disconnect Jetpack, these features will no longer be available and your site may no longer function the same way.',
								'jetpack'
							) }
						</p>
					</div>
					<div className="jp-connection__disconnect-card__group">
						{ siteBenefits.map( ( { value, description, title }, idx ) => (
							<DisconnectCard
								title={ title }
								value={ value }
								description={ description }
								key={ idx }
							/>
						) ) }
					</div>
				</React.Fragment>
			) }
			{ siteBenefits.length <= 2 && (
				<div className="jetpack-benefits__general-benefits-section">
					<p className="jp-connection__disconnect-dialog__large-text">
						{ __(
							'Jetpack has many powerful tools that can help you achieve your goals',
							'jetpack'
						) }
					</p>
					<div className="jp-connection__disconnect-card__group">
						{ generalBenefits.map( ( el, idx ) => (
							<DisconnectCard title={ el } key={ idx } />
						) ) }
					</div>
				</div>
			) }
		</React.Fragment>
	);
};

export default JetpackBenefits;

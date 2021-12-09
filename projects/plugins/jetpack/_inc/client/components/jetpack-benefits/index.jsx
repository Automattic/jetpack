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
					<ul className="jp-connection__disconnect-card__group">
						{ siteBenefits.map( ( { value, description, title } ) => (
							<DisconnectCard title={ title } value={ value } description={ description } />
						) ) }
					</ul>
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
					<ul className="jetpack-benefits__general-benefits-list">
						<li key="reason-cdn">
							{ createInterpolateElement(
								__(
									'Speed up your site and provide mobile-ready images with <ExternalLink>our CDN</ExternalLink>',
									'jetpack'
								),
								{
									ExternalLink: (
										<ExternalLink
											href={ getRedirectUrl( 'jetpack-features-design-content-delivery-network' ) }
											rel="noopener noreferrer"
											target="_blank"
											className="jetpack-benefits__general-benefits-link"
										></ExternalLink>
									),
								}
							) }
						</li>
						<li key="reason-brute-force">
							{ createInterpolateElement(
								__(
									'Block <ExternalLink>brute force attacks</ExternalLink> and get immediate notifications if your site is down',
									'jetpack'
								),
								{
									ExternalLink: (
										<ExternalLink
											href={ getRedirectUrl( 'jetpack-features-security' ) }
											rel="noopener noreferrer"
											target="_blank"
											className="jetpack-benefits__general-benefits-link"
										></ExternalLink>
									),
								}
							) }
						</li>
						<li key="reason-social">
							{ createInterpolateElement(
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
											className="jetpack-benefits__general-benefits-link"
										></ExternalLink>
									),
								}
							) }
						</li>
					</ul>
				</div>
			) }
		</React.Fragment>
	);
};

export default JetpackBenefits;

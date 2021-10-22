/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import { DisconnectCard } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
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

	const renderCDNReason = () => {
		return (
			<li key="reason-cdn">
				{ createInterpolateElement(
					__( 'Speed up your site and provide mobile-ready images with <a>our CDN</a>', 'jetpack' ),
					{
						a: (
							<a
								className="jetpack-termination-dialog__link"
								href={ getRedirectUrl( 'jetpack-features-design-content-delivery-network' ) }
								rel="noopener noreferrer"
								target="_blank"
							/>
						),
					}
				) }
			</li>
		);
	};

	const renderProtectReason = () => {
		return (
			<li key="reason-brute-force">
				{ createInterpolateElement(
					__(
						'Block <a>brute force attacks</a> and get immediate notifications if your site is down',
						'jetpack'
					),
					{
						a: (
							<a
								className="jetpack-termination-dialog__link"
								href={ getRedirectUrl( 'jetpack-features-security' ) }
								rel="noopener noreferrer"
								target="_blank"
							/>
						),
					}
				) }
			</li>
		);
	};

	const renderSocialReason = () => {
		return (
			<li key="reason-social">
				{ createInterpolateElement(
					__( 'Grow your traffic with automated social <a>publishing and sharing</a>', 'jetpack' ),
					{
						a: (
							<a
								className="jetpack-termination-dialog__link"
								href={ getRedirectUrl( 'jetpack-support-social' ) }
								rel="noopener noreferrer"
								target="_blank"
							/>
						),
					}
				) }
			</li>
		);
	};

	return (
		<React.Fragment>
			{ siteBenefits.length > 0 && (
				<React.Fragment>
					<div className="jp-disconnect-dialog__step-copy">
						<p className="jp-disconnect-dialog__large-text">
							{ __(
								'Jetpack is currently powering features on your site. Once you disconnect Jetpack, these features will no longer be available and your site may no longer function the same way.',
								'jetpack'
							) }
						</p>
					</div>
					<div className="jp-disconnect-card__group">
						{ siteBenefits.map( ( { value, description, title } ) => (
							<DisconnectCard title={ title } value={ value } description={ description } />
						) ) }
					</div>
				</React.Fragment>
			) }
			{ siteBenefits.length <= 2 && (
				<div className="jetpack-benefits__general-benefits-section">
					<p className="jp-disconnect-dialog__large-text">
						{ __(
							'Jetpack has many powerful tools that can help you achieve your goals',
							'jetpack'
						) }
					</p>
					<ul className="jetpack-benefits__general-benefits-list">
						{ renderCDNReason() }
						{ renderProtectReason() }
						{ renderSocialReason() }
					</ul>
				</div>
			) }
		</React.Fragment>
	);
};

export default JetpackBenefits;

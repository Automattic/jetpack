/**
 * External dependencies
 */
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import { JETPACK_CONTACT_SUPPORT, JETPACK_CONTACT_BETA_SUPPORT } from 'constants/urls';
import SingleFeature from './single-feature';

/**
 * Style dependencies
 */
import './style.scss';

class JetpackTerminationDialogFeatures extends Component {
	static propTypes = {
		isDevVersion: PropTypes.bool,
		purpose: PropTypes.oneOf( [ 'disconnect', 'disable' ] ).isRequired,
		siteBenefits: PropTypes.array.isRequired,
	};

	renderCDNReason() {
		return (
			<li key="reason-cdn">
				{ __( 'Speed up your site and provide mobile-ready images with {{a}}our CDN{{/a}}', {
					components: {
						a: (
							<a
								className="jetpack-termination-dialog__link"
								href={ getRedirectUrl( 'jetpack-features-design-content-delivery-network' ) }
								rel="noopener noreferrer"
								target="_blank"
							/>
						),
					},
				} ) }
			</li>
		);
	}

	renderProtectReason() {
		return (
			<li key="reason-brute-force">
				{ __(
					'Block {{a}}brute force attacks{{/a}} and get immediate notifications if your site is down',
					{
						components: {
							a: (
								<a
									className="jetpack-termination-dialog__link"
									href={ getRedirectUrl( 'jetpack-features-security' ) }
									rel="noopener noreferrer"
									target="_blank"
								/>
							),
						},
					}
				) }
			</li>
		);
	}

	renderSocialReason() {
		return (
			<li key="reason-social">
				{ __( 'Grow your traffic with automated social {{a}}publishing and sharing{{/a}}', {
					components: {
						a: (
							<a
								className="jetpack-termination-dialog__link"
								href={ getRedirectUrl( 'jetpack-support-social' ) }
								rel="noopener noreferrer"
								target="_blank"
							/>
						),
					},
				} ) }
			</li>
		);
	}

	render() {
		const { isDevVersion, purpose, siteBenefits } = this.props;

		const siteBenefitCount = siteBenefits.length;

		const jetpackSupportURl = isDevVersion ? JETPACK_CONTACT_BETA_SUPPORT : JETPACK_CONTACT_SUPPORT;

		return (
			<Card className="jetpack-termination-dialog__features">
				<p className="jetpack-termination-dialog__info">
					{ purpose === 'disconnect'
						? __(
								'Jetpack is currently powering features on your site. Once you disconnect Jetpack, these features will no longer be available and your site may no longer function the same way.'
						  )
						: __(
								'Jetpack is currently powering features on your site. Once you disable Jetpack, these features will no longer be available and your site may no longer function the same way.'
						  ) }
					{ siteBenefitCount > 0 &&
						__( ' We’ve highlighted some of the features you rely on below.' ) }
				</p>
				<div
					className={
						siteBenefitCount === 1
							? 'jetpack-termination-dialog__features-list-single-column'
							: 'jetpack-termination-dialog__features-list'
					}
				>
					{ siteBenefits.map( ( { amount, description, name, gridIcon, title } ) => (
						<SingleFeature
							key={ name }
							amount={ amount }
							description={ description }
							gridIcon={ gridIcon }
							title={ title }
						/>
					) ) }
				</div>
				{ siteBenefitCount <= 2 && (
					<div className="jetpack-termination-dialog__generic-info">
						<h2>
							{ __( 'Jetpack has many powerful tools that can help you achieve your goals' ) }
						</h2>
						<ul>
							{ this.renderCDNReason() }
							{ this.renderProtectReason() }
							{ this.renderSocialReason() }
						</ul>
					</div>
				) }
				<div className="jetpack-termination-dialog__get-help">
					<p>
						{ __(
							'Have a question? We’d love to help! {{a}}Send a question to the Jetpack support team.{{/a}}',
							{
								components: {
									a: (
										<a
											className="jetpack-termination-dialog__link"
											href={ jetpackSupportURl }
											rel="noopener noreferrer"
											target="_blank"
										/>
									),
								},
							}
						) }
					</p>
				</div>
			</Card>
		);
	}
}

export default JetpackTerminationDialogFeatures;

/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import Gridicon from 'components/gridicon';
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
		connectedPlugins: PropTypes.array.isRequired,
	};

	renderCDNReason() {
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
	}

	renderProtectReason() {
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
	}

	renderSocialReason() {
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
	}

	renderConnectedPlugins( plugins ) {
		return (
			<ul class="jetpack-termination-dialog__active-plugins-list">
				{ plugins.map( plugin => (
					<li key={ plugin.slug }>
						<Gridicon icon="notice-outline" size={ 18 } />
						{ plugin.name }
					</li>
				) ) }
			</ul>
		);
	}

	render() {
		const { isDevVersion, purpose, siteBenefits, connectedPlugins } = this.props;
		const siteBenefitCount = siteBenefits.length;
		const jetpackSupportURl = isDevVersion ? JETPACK_CONTACT_BETA_SUPPORT : JETPACK_CONTACT_SUPPORT;

		const connectedPluginsTitle =
			1 === connectedPlugins.length
				? __(
						'The Jetpack Connection is also used by another plugin, and it will lose connection.',
						'jetpack'
				  )
				: sprintf(
						/* translators: placeholder is a number. */
						_n(
							'The Jetpack Connection is also used by %d other plugin, and it will lose connection.',
							'The Jetpack Connection is also used by %d other plugins, and they will lose connection.',
							connectedPlugins.length,
							'jetpack'
						),
						connectedPlugins.length
				  );

		return (
			<Card className="jetpack-termination-dialog__features">
				<p className="jetpack-termination-dialog__info">
					{ purpose === 'disconnect'
						? __(
								'Jetpack is currently powering features on your site. Once you disconnect Jetpack, these features will no longer be available and your site may no longer function the same way.',
								'jetpack'
						  )
						: __(
								'Jetpack is currently powering features on your site. Once you disable Jetpack, these features will no longer be available and your site may no longer function the same way.',
								'jetpack'
						  ) }
					{ siteBenefitCount > 0 &&
						__( ' We’ve highlighted some of the features you rely on below.', 'jetpack' ) }
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
							{ __(
								'Jetpack has many powerful tools that can help you achieve your goals',
								'jetpack'
							) }
						</h2>
						<ul>
							{ this.renderCDNReason() }
							{ this.renderProtectReason() }
							{ this.renderSocialReason() }
						</ul>
					</div>
				) }
				{ connectedPlugins.length > 0 && (
					<div className="jetpack-termination-dialog__generic-info">
						<h2>{ connectedPluginsTitle }</h2>
						{ this.renderConnectedPlugins( connectedPlugins ) }
					</div>
				) }
				<div className="jetpack-termination-dialog__get-help">
					<p>
						{ createInterpolateElement(
							__(
								'Have a question? We’d love to help! <a>Send a question to the Jetpack support team.</a>',
								'jetpack'
							),
							{
								a: (
									<a
										className="jetpack-termination-dialog__link"
										href={ jetpackSupportURl }
										rel="noopener noreferrer"
										target="_blank"
									/>
								),
							}
						) }
					</p>
				</div>
			</Card>
		);
	}
}

export default JetpackTerminationDialogFeatures;

/**
 * External dependencies
 */
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Internal dependencies
 */

import SingleFeature from './single-feature';

/**
 * Style dependencies
 */
import './style.scss';

const JetpackTerminationDialogFeatures = ( { purpose, siteBenefits, siteName } ) => {
	const siteBenefitCount = siteBenefits.length;

	return (
		<div className="jetpack-termination-dialog__features">
			<Card>
				<p className="jetpack-termination-dialog__info">
					{ purpose === 'disconnect'
						? __(
								'Jetpack is currently powering several features of %(siteName)s. Once you disconnect Jetpack, these features will no longer be available and your site may no longer function the same way.',
								{
									args: {
										siteName,
									},
								}
						  )
						: __(
								'Jetpack is currently powering several features of %(siteName)s. Once you disable Jetpack, these features will no longer be available and your site may no longer function the same way.',
								{
									args: {
										siteName,
									},
								}
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
					{ siteBenefits.map( ( { title, description, amount, gridIcon } ) => (
						<SingleFeature
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
							{ __( 'Jetpack has many powerful tools that can help you achieve your goals  ' ) }
						</h2>
						<ul>
							<li key="reason-cdn">
								{ __(
									'Speed up your site and provide mobile-ready images with {{a}}our CDN{{/a}}',
									{
										components: {
											a: (
												<a
													className="jetpack-termination-dialog__link"
													href="https://jetpack.com/features/design/content-delivery-network/"
													rel="noopener noreferrer"
													target="_blank"
												/>
											),
										},
									}
								) }
							</li>
							<li key="reason-brute-force">
								{ __(
									'Block {{a}}brute force attacks{{/a}} and get immediate notifications if your site is down',
									{
										components: {
											a: (
												<a
													className="jetpack-termination-dialog__link"
													href="https://jetpack.com/features/security/"
													rel="noopener noreferrer"
													target="_blank"
												/>
											),
										},
									}
								) }
							</li>
							<li key="reason-social">
								{ __( 'Grow your traffic with automated social {{a}}publishing and sharing{{/a}}', {
									components: {
										a: (
											<a
												className="jetpack-termination-dialog__link"
												href="https://jetpack.com/support/social/"
												rel="noopener noreferrer"
												target="_blank"
											/>
										),
									},
								} ) }
							</li>
						</ul>
					</div>
				) }
				<div className="jetpack-termination-dialog__get-help">
					<p>
						{ __(
							'Have a question? We’d love to help! {{a}}Chat now with the Jetpack support team.{{/a}}',
							{
								components: {
									a: (
										<a
											className="jetpack-termination-dialog__link"
											href="https://jetpack.com/contact-support/"
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
		</div>
	);
};

JetpackTerminationDialogFeatures.propTypes = {
	purpose: PropTypes.oneOf( [ 'disconnect', 'disable' ] ).isRequired,
	siteBenefits: PropTypes.array.isRequired,
	siteName: PropTypes.string.isRequired,
};

export default JetpackTerminationDialogFeatures;

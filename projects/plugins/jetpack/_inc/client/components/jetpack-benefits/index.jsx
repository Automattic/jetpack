import { getRedirectUrl } from '@automattic/jetpack-components';
import { DisconnectCard } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { Fragment } from 'react';
import './style.scss';

/**
 * Shows a list of benefits that Jetpack provides.
 *
 * @param {object} props              - The component props.
 * @param {Array}  props.siteBenefits - An array of site benefits.
 * @param {Array}  props.context      - Context in which the component will be used. disconnect or deactivate.
 * @return {import('react').Component} - The JetpackBenefits component.
 */
const JetpackBenefits = props => {
	const { siteBenefits, context = 'disconnect' } = props;

	return (
		<Fragment>
			{ siteBenefits.length > 0 && (
				<Fragment>
					<div className="jp-connection__disconnect-dialog__step-copy">
						<p className="jp-connection__disconnect-dialog__large-text">
							{ context === 'disconnect'
								? __(
										'Jetpack is currently powering features on your site. Once you disconnect Jetpack, these features will no longer be available and your site may no longer function the same way.',
										'jetpack'
								  )
								: __(
										'Jetpack is currently powering features on your site. Once you deactivate Jetpack, these features will no longer be available.',
										'jetpack',
										/* dummy arg to avoid bad minification */ 0
								  ) }
						</p>
					</div>
					<div className="jp-connection__disconnect-card__group">
						{ siteBenefits.map( ( { value, description, title }, index ) => (
							<DisconnectCard
								title={ title }
								value={ value }
								description={ description }
								key={ index }
							/>
						) ) }
					</div>
				</Fragment>
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
									'Speed up your site and provide mobile-ready images with <Link>our CDN</Link>',
									'jetpack'
								),
								{
									Link: (
										<Link
											openInNewTab
											href={ getRedirectUrl( 'jetpack-features-design-content-delivery-network' ) }
											rel="noopener noreferrer"
											target="_blank"
										></Link>
									),
								}
							) }
						</li>
						<li key="reason-brute-force">
							{ createInterpolateElement(
								__(
									'Block <Link>brute force attacks</Link> and get immediate notifications if your site is down',
									'jetpack'
								),
								{
									Link: (
										<Link
											openInNewTab
											href={ getRedirectUrl( 'jetpack-features-brute-force' ) }
											rel="noopener noreferrer"
											target="_blank"
										></Link>
									),
								}
							) }
						</li>
						<li key="reason-social">
							{ createInterpolateElement(
								__(
									'Grow your traffic with automated social <Link>publishing and sharing</Link>',
									'jetpack'
								),
								{
									Link: (
										<Link
											openInNewTab
											href={ getRedirectUrl( 'jetpack-support-social' ) }
											rel="noopener noreferrer"
											target="_blank"
										></Link>
									),
								}
							) }
						</li>
					</ul>
				</div>
			) }
		</Fragment>
	);
};

JetpackBenefits.propTypes = {
	/** An array of site benefits. */
	siteBenefits: PropTypes.array,
	/** Context in which the component will be used. disconnect or deactivate. */
	context: PropTypes.oneOf( [ 'disconnect', 'deactivate' ] ),
};

export default JetpackBenefits;

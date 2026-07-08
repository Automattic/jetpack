import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import PropTypes from 'prop-types';

import './style.scss';

/**
 * The Activation Screen Illustration component.
 *
 * @param {object}  props                 -- The properties.
 * @param {string}  props.imageUrl        -- The assets base URL.
 * @param {boolean} props.showSupportLink -- The assets base URL.
 * @return {import('react').Component} The `ActivationScreenIllustration` component.
 */
const ActivationScreenIllustration = props => {
	const { imageUrl, showSupportLink = false } = props;
	return (
		<div className="jp-license-activation-screen-illustration">
			<div className="jp-license-activation-screen-illustration--wrapper">
				<img className="jp-license-activation-screen-illustration--img" src={ imageUrl } alt="" />
			</div>
			{ showSupportLink && (
				<p className="jp-license-activation-screen-illustration--support-link">
					{ createInterpolateElement(
						__( 'Do you need help? <a>Contact us.</a>', 'jetpack-licensing' ),
						{
							a: (
								<Link
									openInNewTab
									href={ getRedirectUrl( 'jetpack-support-license-activation' ) }
									rel="noopener noreferrer"
									children={ null }
								/>
							),
						}
					) }
				</p>
			) }
		</div>
	);
};

ActivationScreenIllustration.propTypes = {
	imageUrl: PropTypes.string.isRequired,
	showSupportLink: PropTypes.bool,
};

export default ActivationScreenIllustration;

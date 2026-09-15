import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Text, Link } from '@wordpress/ui';
import PropTypes from 'prop-types';

import './style.scss';

/**
 * The Activation Screen Illustration component.
 *
 * @param {object}  props                   -- The properties.
 * @param {string}  [props.imageUrl]        -- URL of the illustration; omit to render none.
 * @param {boolean} [props.showSupportLink] -- Whether to render the support link.
 * @return {import('react').Component} The `ActivationScreenIllustration` component.
 */
const ActivationScreenIllustration = props => {
	const { imageUrl, showSupportLink = false } = props;
	return (
		<div className="jp-license-activation-screen-illustration">
			<div className="jp-license-activation-screen-illustration--wrapper">
				{ imageUrl && (
					<img className="jp-license-activation-screen-illustration--img" src={ imageUrl } alt="" />
				) }
			</div>
			{ showSupportLink && (
				<Text
					variant="body-md"
					render={ <p className="jp-license-activation-screen-illustration--support-link" /> }
				>
					{ createInterpolateElement(
						__( 'Do you need help? <a>Contact us.</a>', 'jetpack-licensing' ),
						{
							a: <Link href={ getRedirectUrl( 'jetpack-support-license-activation' ) } />,
						}
					) }
				</Text>
			) }
		</div>
	);
};

ActivationScreenIllustration.propTypes = {
	imageUrl: PropTypes.string,
	showSupportLink: PropTypes.bool,
};

export default ActivationScreenIllustration;

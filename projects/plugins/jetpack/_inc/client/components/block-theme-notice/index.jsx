import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import SimpleNotice from 'components/notice';

/**
 * A notice component that suggests using a block instead of a legacy module.
 *
 * This notice is shown to users on block-based themes when the corresponding
 * block is available. It suggests disabling the legacy module and using
 * the block in the site editor instead.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isModuleActive - Whether the legacy module is currently active.
 * @param {string} props.supportLink - The redirect URL key for the support documentation.
 * @return {import('react').ReactNode} The notice component.
 */
export default function BlockThemeNotice( { isModuleActive, supportLink } ) {
	const supportUrl = getRedirectUrl( supportLink );

	const message = isModuleActive
		? createInterpolateElement(
				__(
					"You are using a block-based theme. We recommend that you disable this legacy feature and add the corresponding block to your theme's template instead. <a>Discover how</a>.",
					'jetpack'
				),
				{
					a: <ExternalLink href={ supportUrl } />,
				}
		  )
		: createInterpolateElement(
				__(
					"You are using a block-based theme. Instead of enabling this legacy feature, we recommend that you add the corresponding block to your theme's template in the site editor instead. <a>Discover how</a>.",
					'jetpack'
				),
				{
					a: <ExternalLink href={ supportUrl } />,
				}
		  );

	return (
		<SimpleNotice
			showDismiss={ false }
			status="is-info"
			className="jp-settings-sharing__block-theme-description"
		>
			{ message }
		</SimpleNotice>
	);
}

BlockThemeNotice.propTypes = {
	isModuleActive: PropTypes.bool.isRequired,
	supportLink: PropTypes.string.isRequired,
};

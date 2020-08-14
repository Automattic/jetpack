/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useUpgradeFlow from '../../shared/use-upgrade-flow/index';

const UpgradePlanBanner = ( {
	onRedirect,
	align,
	className,
	title = __( 'Premium Block', 'jetpack' ),
	description = __( 'Upgrade your plan to use this premium block', 'jetpack' ),
	buttonText = __( 'Upgrade', 'jetpack' ),
	visible = true,
} ) => {
	const [ checkoutUrl, goToCheckoutPage ] = useUpgradeFlow( 'value_bundle', onRedirect );

	if ( ! visible ) {
		return null;
	}

	const cssClasses = classNames( className, 'jetpack-upgrade-plan-banner', 'wp-block' );

	return (
		<div className={ cssClasses } data-align={ align }>
			{ title && (
				<strong
					className={ classNames( 'banner-title', { [ `${ className }__title` ]: className } ) }
				>
					{ title }
				</strong>
			) }
			{ description && (
				<span className={ `${ className }__description banner-description` }>{ description }</span>
			) }
			{ checkoutUrl && (
				<Button
					href={ checkoutUrl } // Only for server-side rendering, since onClick doesn't work there.
					onClick={ goToCheckoutPage }
					target="_top"
					className="is-primary"
				>
					{ buttonText }
				</Button>
			) }
		</div>
	);
};

export default UpgradePlanBanner;

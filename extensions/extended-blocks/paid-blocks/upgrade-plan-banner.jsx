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
	requiredPlan,
	context,
} ) => {
	const [ checkoutUrl, goToCheckoutPage, isRedirecting ] = useUpgradeFlow(
		requiredPlan,
		onRedirect
	);
	if ( ! visible ) {
		return null;
	}

	const cssClasses = classNames(
		className,
		'jetpack-upgrade-plan-banner', {
			'wp-block': context === 'editor-canvas',
			'block-editor-block-list__block': context === 'editor-canvas',
		}
	);

	const redirectingText = __( 'Redirecting…', 'jetpack' );

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
					href={ isRedirecting ? null : checkoutUrl } // Only for server-side rendering, since onClick doesn't work there.
					onClick={ goToCheckoutPage }
					target="_top"
					className="is-primary"
					isBusy={ isRedirecting }
				>
					{ isRedirecting ? redirectingText : buttonText }
				</Button>
			) }
		</div>
	);
};

export default UpgradePlanBanner;

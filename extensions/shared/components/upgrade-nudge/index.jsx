/**
 * External dependencies
 */
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

import './store';
import './style.scss';

export const UpgradeNudge = ( {
	align,
	className,
	description = __( 'Upgrade your plan to use this premium block', 'jetpack' ),
	buttonText = __( 'Upgrade', 'jetpack' ),
	visible = true,
	context,
	checkoutUrl
} ) => {
	const cssClasses = classNames( className, 'jetpack-upgrade-plan-banner', {
		'wp-block': context === 'editor-canvas',
		'block-editor-block-list__block': context === 'editor-canvas',
		'jetpack-upgrade-plan__hidden': ! visible,
	} );

	const redirectingText = __( 'Redirecting…', 'jetpack' );

	return (
		<div className={ cssClasses } data-align={ align }>
			<div className="jetpack-upgrade-plan-banner__wrapper">
				{ description && (
					<span className={ `${ className }__description banner-description` }>
						{ description }
					</span>
				) }
				{
					<Button
						href={ checkoutUrl } // Only for server-side rendering, since onClick doesn't work there.
						target="_top"
						className={ classNames( 'is-primary', {
							'jetpack-upgrade-plan__hidden': ! checkoutUrl,
						} ) }
					>
						{ buttonText }
					</Button>
				}
			</div>
		</div>
	);
};

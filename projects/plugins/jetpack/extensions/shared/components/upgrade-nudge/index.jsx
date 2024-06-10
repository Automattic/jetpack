import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';

import './style.scss';

export const Nudge = ( {
	align,
	className,
	title,
	description,
	buttonText = null,
	visible = true,
	context,
	checkoutUrl = null,
	goToCheckoutPage = null,
	isRedirecting = false,
	showButton = true,
	target = '_top',
} ) => {
	const cssClasses = clsx( className, 'jetpack-upgrade-plan-banner', {
		'wp-block': context === 'editor-canvas',
		'block-editor-block-list__block': context === 'editor-canvas',
		'jetpack-upgrade-plan__hidden': ! visible,
	} );

	const redirectingText = __( 'Redirecting…', 'jetpack' );

	return (
		<div className={ cssClasses } data-align={ align }>
			<div className="jetpack-upgrade-plan-banner__wrapper">
				{ title && (
					<strong className={ clsx( 'banner-title', { [ `${ className }__title` ]: className } ) }>
						{ title }
					</strong>
				) }
				{ description && (
					<span className={ `${ className }__description banner-description` }>
						{ description }
					</span>
				) }
				{ showButton && (
					<Button
						href={ isRedirecting ? null : checkoutUrl } // Only for server-side rendering, since onClick doesn't work there.
						onClick={ goToCheckoutPage }
						target={ target }
						className={ clsx( 'is-primary', {
							'jetpack-upgrade-plan__hidden': ! checkoutUrl,
						} ) }
						isBusy={ isRedirecting }
					>
						{ isRedirecting ? redirectingText : buttonText }
					</Button>
				) }
			</div>
		</div>
	);
};

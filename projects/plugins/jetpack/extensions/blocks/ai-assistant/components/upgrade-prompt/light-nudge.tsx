import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import './style.scss';

export const LightNudge = ( {
	title,
	description,
	buttonText = null,
	checkoutUrl = null,
	goToCheckoutPage = null,
	isRedirecting = false,
	showButton = true,
} ) => {
	const redirectingText = __( 'Redirecting…', 'jetpack' );

	return (
		<div className="jetpack-upgrade-plan-banner-light">
			<Notice status="warning" isDismissible={ false }>
				<p>
					{ title && <strong>{ title }</strong> }
					{ description }{ ' ' }
					{ showButton && (
						<Button
							href={ isRedirecting ? null : checkoutUrl } // Only for server-side rendering, since onClick doesn't work there.
							onClick={ goToCheckoutPage }
							variant="link"
							target="_top"
						>
							{ isRedirecting ? redirectingText : buttonText }
						</Button>
					) }
				</p>
			</Notice>
		</div>
	);
};

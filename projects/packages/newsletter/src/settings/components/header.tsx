/**
 * External dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './header.scss';

/**
 * Newsletter Settings Header Component
 *
 * @return {JSX.Element} The header component.
 */
export function Header(): JSX.Element {
	return (
		<header className="newsletter-settings__header">
			<div className="newsletter-settings__header-top">
				<JetpackLogo showText={ false } width={ 20 } />
				<h1 className="newsletter-settings__title">
					{ __( 'Newsletter Settings', 'jetpack-newsletter' ) }
				</h1>
			</div>
			<p className="newsletter-settings__tagline">
				{ __(
					'Transform your blog posts into newsletters to easily reach your subscribers.',
					'jetpack-newsletter'
				) }
			</p>
		</header>
	);
}

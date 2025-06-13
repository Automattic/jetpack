import { getAdminUrl } from '@automattic/jetpack-script-data';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import { useHelpTracking } from './use-help-tracking';

/**
 * Renders the footer for the Help section of My Jetpack.
 *
 * @return The rendered footer component.
 */
export function HelpFooter() {
	const { trackHelpRequest } = useHelpTracking();

	const handleLearnMoreClick = useCallback( () => {
		trackHelpRequest( 'documentation', 'clicked_learn_more_about_us' );
	}, [ trackHelpRequest ] );

	const handleAllModulesClick = useCallback( () => {
		trackHelpRequest( 'documentation', 'clicked_all_jetpack_modules_link' );
	}, [ trackHelpRequest ] );

	const handleDebugInfoClick = useCallback( () => {
		trackHelpRequest( 'documentation', 'clicked_debug_information_link' );
	}, [ trackHelpRequest ] );

	return (
		<div className={ styles.footer }>
			<section>
				<h3>{ __( 'Real humans. Real support.', 'jetpack-my-jetpack' ) }</h3>
				<p className={ styles.description }>
					{ __(
						'We are the people behind WordPress.com, WooCommerce, Jetpack, Simplenote, and more. We believe in making the web a better place.',
						'jetpack-my-jetpack'
					) }
				</p>
				<ExternalLink
					className={ styles[ 'footer-learn-more' ] }
					href="https://automattic.com/about/"
					onClick={ handleLearnMoreClick }
				>
					{ __( 'Learn more about us', 'jetpack-my-jetpack' ) }
				</ExternalLink>

				<nav
					className={ styles[ 'footer-nav' ] }
					aria-label={ __( 'Useful links', 'jetpack-my-jetpack' ) }
				>
					<h4>{ __( 'Useful links', 'jetpack-my-jetpack' ) }</h4>
					<ul>
						<li>
							<a
								href={ getAdminUrl( 'admin.php?page=jetpack_modules' ) }
								onClick={ handleAllModulesClick }
							>
								{ __( 'All Jetpack modules', 'jetpack-my-jetpack' ) }
							</a>
						</li>
						<li>
							<a
								href={ getAdminUrl( 'admin.php?page=jetpack-debugger' ) }
								onClick={ handleDebugInfoClick }
							>
								{ __( 'Debug information', 'jetpack-my-jetpack' ) }
							</a>
						</li>
					</ul>
				</nav>
			</section>
		</div>
	);
}

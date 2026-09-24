import {
	currentUserCan,
	getAdminUrl,
	getMyJetpackUrl,
	isSimpleSite,
} from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { MyJetpackRoutes } from '../../../constants';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';
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

	/*
	 * The Debugger exists only with the Jetpack plugin, for admins, off Simple; the modules
	 * link goes to the Features list, which non-admins don't get either.
	 */
	const showUsefulLinks =
		isJetpackPluginActive() && currentUserCan( 'manage_options' ) && ! isSimpleSite();

	return (
		<div className={ styles.footer }>
			{ /* Needed to show different background colour */ }
			<div className={ styles[ 'footer-inner' ] }>
				<section>
					<h3>{ __( 'Real humans. Real support.', 'jetpack-my-jetpack' ) }</h3>
					<Text variant="body-md" render={ <p /> } className={ styles.description }>
						{ __(
							'We are the people behind WordPress.com, WooCommerce, Jetpack, Simplenote, and more. We believe in making the web a better place.',
							'jetpack-my-jetpack'
						) }
					</Text>
					<Link
						openInNewTab
						className={ styles[ 'footer-learn-more' ] }
						href="https://automattic.com/about/"
						onClick={ handleLearnMoreClick }
					>
						{ __( 'Learn more about us', 'jetpack-my-jetpack' ) }
					</Link>

					{ showUsefulLinks && (
						<nav
							className={ styles[ 'footer-nav' ] }
							aria-label={ __( 'Useful links', 'jetpack-my-jetpack' ) }
						>
							<h4>{ __( 'Useful links', 'jetpack-my-jetpack' ) }</h4>
							<ul>
								<li>
									<Link
										href={ getMyJetpackUrl( `#${ MyJetpackRoutes.Features }?view=list` ) }
										onClick={ handleAllModulesClick }
									>
										{ __( 'All Jetpack modules', 'jetpack-my-jetpack' ) }
									</Link>
								</li>
								<li>
									<Link
										href={ getAdminUrl( 'admin.php?page=jetpack-debugger' ) }
										onClick={ handleDebugInfoClick }
									>
										{ __( 'Debug information', 'jetpack-my-jetpack' ) }
									</Link>
								</li>
							</ul>
						</nav>
					) }
				</section>
			</div>
		</div>
	);
}

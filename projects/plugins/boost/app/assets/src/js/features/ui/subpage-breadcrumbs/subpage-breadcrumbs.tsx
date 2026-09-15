import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import { useBoostNavigation } from '$lib/navigation/navigation-context';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './subpage-breadcrumbs.module.scss';

type SubpageBreadcrumbsProps = {
	current: string;
};

/**
 * "Boost / <page>", with "Boost" returning to Settings.
 *
 * @param props         - Component props.
 * @param props.current - The current page's title.
 */
const SubpageBreadcrumbs = ( { current }: SubpageBreadcrumbsProps ) => {
	const { returnToSettings, settingsHref } = useBoostNavigation();

	const handleBack = ( e: React.MouseEvent ) => {
		e.preventDefault();
		recordBoostEvent( 'back_button_clicked', {
			current_page: window.location.href.replace( window.location.origin, '' ),
			destination: '/',
		} );
		returnToSettings();
	};

	return (
		<nav aria-label={ __( 'Breadcrumbs', 'jetpack-boost' ) }>
			<ul className={ styles.breadcrumbs }>
				<li>
					<Text variant="body-lg">
						<Link tone="neutral" href={ settingsHref } onClick={ handleBack }>
							{ 'Boost' /** "Boost" is a product name, do not translate. */ }
						</Link>
					</Text>
					<Text variant="body-lg" aria-hidden="true" className={ styles.separator }>
						/
					</Text>
				</li>
				<li>
					<Text variant="heading-lg" className={ styles.current }>
						{ current }
					</Text>
				</li>
			</ul>
		</nav>
	);
};

export default SubpageBreadcrumbs;

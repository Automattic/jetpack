import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import { useBackToSettings } from '$lib/navigation/use-back-to-settings';
import styles from './subpage-breadcrumbs.module.scss';

type SubpageBreadcrumbsProps = {
	title: string;
	tone?: 'brand' | 'neutral';
};

/**
 * "Boost / <page>", with "Boost" returning to Settings.
 *
 * @param props       - Component props.
 * @param props.title - The page's title, the trailing crumb.
 * @param props.tone  - The link's tone.
 */
const SubpageBreadcrumbs = ( { title, tone = 'neutral' }: SubpageBreadcrumbsProps ) => {
	const { href, onClick } = useBackToSettings( 'breadcrumb' );

	return (
		<nav aria-label={ __( 'Breadcrumbs', 'jetpack-boost' ) }>
			<ul className={ styles.breadcrumbs }>
				<li>
					<Text variant="body-lg">
						<Link tone={ tone } href={ href } onClick={ onClick }>
							{ 'Boost' /** "Boost" is a product name, do not translate. */ }
						</Link>
					</Text>
					<Text variant="body-lg" aria-hidden="true" className={ styles.separator }>
						/
					</Text>
				</li>
				<li>
					<Text variant="heading-lg" className={ styles.current }>
						{ title }
					</Text>
				</li>
			</ul>
		</nav>
	);
};

export default SubpageBreadcrumbs;

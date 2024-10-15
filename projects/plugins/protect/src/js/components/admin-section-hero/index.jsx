import {
	AdminSectionHero as JetpackAdminSectionHero,
	Status,
	H3,
	getIconBySlug,
} from '@automattic/jetpack-components';
import ScanNavigation from '../scan-navigation';
import SeventyFiveLayout from '../seventy-five-layout';
import AdminSectionHeroNotices from './admin-section-hero-notices';
import styles from './styles.module.scss';

const AdminSectionHero = ( {
	status = null,
	statusLabel,
	showNavigation = false,
	heading = null,
	showIcon = false,
	subheading,
	secondary,
	preserveSecondaryOnMobile = true,
} ) => {
	const Icon = getIconBySlug( 'protect' );

	return (
		<JetpackAdminSectionHero>
			<AdminSectionHeroNotices />
			<SeventyFiveLayout
				spacing={ 7 }
				main={
					<>
						{ status && <Status status={ status } label={ statusLabel } /> }
						<H3 className={ styles.heading } mt={ 2 } mb={ 2 }>
							{ heading }
							{ showIcon && <Icon className={ styles[ 'heading-icon' ] } size={ 32 } /> }
						</H3>
						{ subheading && <div className={ styles.subheading }>{ subheading }</div> }
						{ showNavigation && <ScanNavigation /> }
					</>
				}
				mainClassName={ styles[ 'header-main' ] }
				secondary={ secondary }
				secondaryClassName={ styles[ 'header-secondary' ] }
				preserveSecondaryOnMobile={ preserveSecondaryOnMobile }
				fluid={ false }
			/>
		</JetpackAdminSectionHero>
	);
};

export default AdminSectionHero;

import {
	AdminSectionHero as JetpackAdminSectionHero,
	H3,
	getIconBySlug,
} from '@automattic/jetpack-components';
import SeventyFiveLayout from '../seventy-five-layout';
import AdminSectionHeroNotices from './admin-section-hero-notices';
import styles from './styles.module.scss';

interface AdminSectionHeroProps {
	main: React.ReactNode;
	secondary?: React.ReactNode;
	preserveSecondaryOnMobile?: boolean;
	spacing?: number;
}

interface AdminSectionHeroComponent extends React.FC< AdminSectionHeroProps > {
	Heading: React.FC< { children: React.ReactNode; showIcon?: boolean } >;
	Subheading: React.FC< { children: React.ReactNode } >;
}

const AdminSectionHero: AdminSectionHeroComponent = ( {
	main,
	secondary,
	preserveSecondaryOnMobile = true,
	spacing = 7,
} ) => {
	return (
		<JetpackAdminSectionHero>
			<AdminSectionHeroNotices />
			<SeventyFiveLayout
				spacing={ spacing }
				gap={ 0 }
				main={ main }
				mainClassName={ styles[ 'header-main' ] }
				secondary={ secondary }
				secondaryClassName={ styles[ 'header-secondary' ] }
				preserveSecondaryOnMobile={ preserveSecondaryOnMobile }
				fluid={ false }
			/>
		</JetpackAdminSectionHero>
	);
};

AdminSectionHero.Heading = ( {
	children,
	showIcon = false,
}: {
	children: React.ReactNode;
	showIcon?: boolean;
} ) => {
	const Icon = getIconBySlug( 'protect' );

	return (
		<H3 className={ styles.heading } mt={ 2 } mb={ 2 }>
			{ children }
			{ showIcon && <Icon className={ styles[ 'heading-icon' ] } size={ 32 } /> }
		</H3>
	);
};

AdminSectionHero.Subheading = ( { children }: { children: React.ReactNode } ) => {
	return <div className={ styles.subheading }>{ children }</div>;
};

export default AdminSectionHero;

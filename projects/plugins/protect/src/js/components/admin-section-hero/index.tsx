import {
	AdminSectionHero as JetpackAdminSectionHero,
	H3,
	ShieldIcon,
} from '@automattic/jetpack-components';
import SeventyFiveLayout from '../seventy-five-layout';
import AdminSectionHeroNotices from './admin-section-hero-notices';
import styles from './styles.module.scss';

interface AdminSectionHeroProps {
	main: React.ReactNode;
	mainClassName?: string;
	secondary?: React.ReactNode;
	secondaryClassName?: string;
	preserveSecondaryOnMobile?: boolean;
	spacing?: number;
}

interface AdminSectionHeroComponent extends React.FC< AdminSectionHeroProps > {
	Heading: React.FC< { children: React.ReactNode; showIcon?: boolean; variant?: string } >;
	Subheading: React.FC< { children: React.ReactNode } >;
}

const AdminSectionHero: AdminSectionHeroComponent = ( {
	main,
	mainClassName,
	secondary,
	secondaryClassName,
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
				mainClassName={ mainClassName }
				secondary={ secondary }
				secondaryClassName={ secondaryClassName }
				preserveSecondaryOnMobile={ preserveSecondaryOnMobile }
				fluid={ false }
			/>
		</JetpackAdminSectionHero>
	);
};

AdminSectionHero.Heading = ( {
	children,
	variant = 'default',
	showIcon = false,
	outline,
}: {
	children: React.ReactNode;
	variant?: 'default' | 'success' | 'error';
	showIcon?: boolean;
	outline?: boolean;
} ) => {
	return (
		<H3 className={ styles.heading } mt={ 2 } mb={ 2 }>
			{ children }
			{ showIcon && (
				<ShieldIcon
					height={ 38 }
					variant={ variant }
					outline={ outline }
					fill="default"
					className={ styles[ 'heading-icon' ] }
				/>
			) }
		</H3>
	);
};

AdminSectionHero.Subheading = ( { children }: { children: React.ReactNode } ) => {
	return <div className={ styles.subheading }>{ children }</div>;
};

export default AdminSectionHero;

import {
	AdminSectionHero as JetpackAdminSectionHero,
	H3,
	ShieldIcon,
} from '@automattic/jetpack-components';
import FlexLayout from '../flex-layout';
import AdminSectionHeroNotices from './admin-section-hero-notices';
import styles from './styles.module.scss';

interface AdminSectionHeroProps {
	main: React.ReactNode;
	mainClassName?: string;
	secondary?: React.ReactNode;
	secondaryClassName?: string;
	preserveSecondaryOnMobile?: boolean;
}

interface AdminSectionHeroComponent extends React.FC< AdminSectionHeroProps > {
	Heading: React.FC< {
		children: React.ReactNode;
		showIcon?: boolean;
		variant?: 'default' | 'success' | 'error';
		outline?: boolean;
	} >;
	Subheading: React.FC< { children: React.ReactNode } >;
}

const AdminSectionHero: AdminSectionHeroComponent = ( {
	main,
	mainClassName,
	secondary,
	secondaryClassName,
	preserveSecondaryOnMobile = true,
} ) => {
	return (
		<JetpackAdminSectionHero>
			<AdminSectionHeroNotices />
			<FlexLayout
				main={ main }
				mainClassName={ mainClassName }
				secondary={ secondary }
				secondaryClassName={ secondaryClassName }
				preserveSecondaryOnMobile={ preserveSecondaryOnMobile }
			/>
		</JetpackAdminSectionHero>
	);
};

AdminSectionHero.Heading = ( {
	children,
	variant = 'default',
	showIcon = false,
}: {
	children: React.ReactNode;
	variant?: 'default' | 'success' | 'error';
	showIcon?: boolean;
} ) => {
	return (
		<H3 className={ styles.heading } mt={ 2 } mb={ 2 }>
			{ children }
			{ showIcon && (
				<ShieldIcon
					height={ 38 }
					variant={ variant }
					outline
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

import {
	AdminSectionHero as JetpackAdminSectionHero,
	H3,
	ShieldIcon,
	Container,
	Col,
} from '@automattic/jetpack-components';
import clsx from 'clsx';
import AdminSectionHeroNotices from './admin-section-hero-notices';
import styles from './styles.module.scss';

const AdminSectionHero = ( {
	children,
	...props
}: React.ComponentProps< typeof JetpackAdminSectionHero > ) => {
	return (
		<JetpackAdminSectionHero { ...props }>
			<AdminSectionHeroNotices />
			<Container horizontalSpacing={ 0 }>
				<Col>
					<div className={ styles[ 'admin-section-hero' ] }>{ children }</div>
				</Col>
			</Container>
		</JetpackAdminSectionHero>
	);
};

AdminSectionHero.Main = ( {
	children,
	className,
	...props
}: {
	children: React.ReactNode;
	className?: string;
	[ key: string ]: unknown;
} ) => {
	return (
		<div className={ clsx( styles[ 'admin-section-hero__main' ], className ) } { ...props }>
			{ children }
		</div>
	);
};

AdminSectionHero.Aside = ( {
	children,
	className,
	...props
}: React.ComponentProps< 'div' > & {
	className?: string;
} ) => {
	return (
		<div className={ clsx( styles[ 'admin-section-hero__aside' ], className ) } { ...props }>
			{ children }
		</div>
	);
};

AdminSectionHero.Heading = ( {
	children,
	icon,
	iconOutline,
	...props
}: React.ComponentProps< typeof H3 > & {
	icon?: 'default' | 'success' | 'error';
	iconOutline?: boolean;
} ) => {
	return (
		<H3 mb={ 1 } { ...props } className={ styles.heading }>
			{ children }
			{ !! icon && (
				<ShieldIcon
					height={ 36 }
					variant={ icon }
					outline={ iconOutline }
					className={ styles[ 'heading-icon' ] }
				/>
			) }
		</H3>
	);
};

export default AdminSectionHero;

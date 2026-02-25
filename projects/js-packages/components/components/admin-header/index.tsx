import clsx from 'clsx';
import JetpackLogo from '../jetpack-logo/index.tsx';
import styles from './style.module.scss';
import type { AdminHeaderProps } from './types.ts';
import type { FC } from 'react';

/**
 * Unified admin page header component.
 *
 * Renders a sticky header with logo, product title, optional tagline,
 * actions, and tabs. Follows the `@wordpress/admin-ui` Page header pattern.
 *
 * @param {AdminHeaderProps} props - Component properties.
 * @return {ReactNode} AdminHeader component.
 */
const AdminHeader: FC< AdminHeaderProps > = ( {
	logo,
	title,
	tagline,
	actions,
	tabs,
	className,
} ) => {
	return (
		<header className={ clsx( styles[ 'admin-header' ], className ) }>
			<div className={ styles[ 'admin-header__title-row' ] }>
				<div className={ styles[ 'admin-header__title' ] }>
					<span className={ styles[ 'admin-header__logo' ] }>
						{ logo || <JetpackLogo showText={ false } height={ 20 } /> }
					</span>
					<h1 className={ styles[ 'admin-header__product-name' ] }>{ title }</h1>
				</div>
				{ actions && <div className={ styles[ 'admin-header__actions' ] }>{ actions }</div> }
			</div>
			{ tagline && <p className={ styles[ 'admin-header__tagline' ] }>{ tagline }</p> }
			{ tabs }
		</header>
	);
};

export default AdminHeader;

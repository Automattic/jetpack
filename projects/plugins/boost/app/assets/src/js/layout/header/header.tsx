import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './header.module.scss';
import { BackButton } from '$features/ui';
import ChevronRight from '$svg/chevron-right';
import { useNavigate } from 'react-router';

type HeaderProps = {
	subPageTitle?: string;
	children?: ReactNode;
};

const Header = ( { subPageTitle = '', children }: HeaderProps ) => {
	const navigate = useNavigate();
	return (
		<div className={ clsx( styles.header ) }>
			<div className={ clsx( styles.masthead ) }>
				<div className={ clsx( styles[ 'nav-area' ] ) }>
					<div
						className={ clsx( styles.logo ) }
						onClick={ () => navigate( '/' ) }
						onKeyDown={ event => {
							if ( event.key === 'Enter' || event.key === ' ' ) {
								navigate( '/' );
							}
						} }
						role="button"
						tabIndex={ 0 }
					>
						<JetpackLogo showText={ false } height={ 20 } />
					</div>
					<h2 className={ clsx( styles.title ) }>
						{ 'Boost' /** "Boost" is a product name, do not translate. */ }
					</h2>

					{ subPageTitle !== '' && (
						<>
							<div className={ clsx( styles.chevron ) }>
								<ChevronRight />
							</div>
							<div className={ clsx( styles.subpage ) }>{ subPageTitle }</div>
						</>
					) }
				</div>

				{ children }
			</div>

			{ ! subPageTitle && (
				<p className={ clsx( styles.subtitle ) }>
					{ __( 'Optimize your site performance and loading speed.', 'jetpack-boost' ) }
				</p>
			) }

			{ subPageTitle !== '' && (
				<div className="jb-container">
					<BackButton />
				</div>
			) }
		</div>
	);
};

export default Header;

import clsx from 'clsx';
import React from 'react';
import styles from './header.module.scss';
import { BackButton } from '$features/ui';
import ChevronRight from '$svg/chevron-right';
import Logo from '$svg/logo';
import { useNavigate } from 'react-router-dom';

type HeaderProps = {
	subPageTitle?: string;
	children?: React.ReactNode;
};

const Header = ( { subPageTitle = '', children }: HeaderProps ) => {
	const navigate = useNavigate();
	return (
		<div className={ clsx( styles.header ) }>
			<div className={ clsx( 'jb-container', styles.masthead ) }>
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
						<Logo />
					</div>

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

			{ subPageTitle !== '' && (
				<div className="jb-container">
					<BackButton />
				</div>
			) }
		</div>
	);
};

export default Header;

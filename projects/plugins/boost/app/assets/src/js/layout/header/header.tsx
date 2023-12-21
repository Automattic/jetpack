import classNames from 'classnames';
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
		<div className={ classNames( styles.header ) }>
			<div className={ classNames( 'jb-container', styles.masthead ) }>
				<div className={ classNames( styles[ 'nav-area' ] ) }>
					<div
						className={ classNames( styles.logo ) }
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
							<div className={ classNames( styles.chevron ) }>
								<ChevronRight />
							</div>
							<div className={ classNames( styles.subpage ) }>{ subPageTitle }</div>
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

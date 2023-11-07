import React from 'react';
import { navigate } from '../../../utils/navigate';
import BackButton from '../../components/back-button';
import ChevronRight from '../../svg/chevron-right';
import Logo from '../../svg/logo';

interface HeaderProps {
	subPageTitle?: string;
	children?: React.ReactNode;
}

const Header = ( { subPageTitle = '', children }: HeaderProps ) => {
	return (
		<div className="jb-dashboard-header">
			<div className="jb-container masthead">
				<div className="nav-area">
					<button className="jb-dashboard-header__logo" onClick={ () => navigate( '/' ) }>
						<Logo />
					</button>

					{ subPageTitle !== '' && (
						<>
							<div className="chevron">
								<ChevronRight />
							</div>
							<div className="subpage">{ subPageTitle }</div>
						</>
					) }
				</div>

				{ children }
			</div>

			{ subPageTitle !== '' && (
				<div className="jb-container back-button">
					<BackButton />
				</div>
			) }
		</div>
	);
};

export default Header;

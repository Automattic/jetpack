import classnames from 'classnames';
import JetpackFormsLogo from '../logo';

import './style.scss';

const Layout = ( { children, className, title, subtitle } ) => {
	const classes = classnames( 'jp-forms__layout', className );

	return (
		<div className={ classes }>
			<div className="jp-forms__logo-wrapper">
				<JetpackFormsLogo />
			</div>

			{ ( title || subtitle ) && (
				<div className="jp-forms__layout-header">
					{ title && <h2 className="jp-forms__layout-title">{ title }</h2> }
					{ subtitle && <p className="jp-forms__header-subtext">{ subtitle }</p> }
				</div>
			) }

			{ children }
		</div>
	);
};

export default Layout;

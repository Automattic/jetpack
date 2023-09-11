import { JetpackFooter } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import JetpackFormsLogo from '../logo';

import './style.scss';

const Layout = ( { children, className, title, subtitle, showFooter } ) => {
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
			{ showFooter && (
				<JetpackFooter
					className="jp-forms__layout-footer"
					moduleName={ __( 'Jetpack Forms', 'jetpack-forms' ) }
				/>
			) }
		</div>
	);
};

export default Layout;

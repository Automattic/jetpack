import { JetpackFooter } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import JetpackFormsLogo from '../logo';

import './style.scss';

const Layout = ( { children, title } ) => {
	return (
		<div className="jp-forms__layout">
			<JetpackFormsLogo />

			<div className="jp-forms__layout-header">
				<h2 className="jp-forms__layout-title">{ title }</h2>
			</div>

			{ children }

			<JetpackFooter
				className="jp-forms__layout-footer"
				moduleName={ __( 'Jetpack Forms', 'jetpack-forms' ) }
			/>
		</div>
	);
};

export default Layout;

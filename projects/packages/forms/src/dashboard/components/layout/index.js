import { JetpackFooter } from '@automattic/jetpack-components';
import { shouldUseInternalLinks } from '@automattic/jetpack-shared-extension-utils';
import { TabPanel } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { config } from '../../index';
import JetpackFormsLogo from '../logo';

import './style.scss';

const Layout = ( { className, showFooter } ) => {
	const location = useLocation();
	const navigate = useNavigate();

	const tabs = [
		{
			name: 'responses',
			title: __( 'Responses', 'jetpack-forms' ),
		},
		{
			name: 'about',
			title: __( 'About', 'jetpack-forms' ),
		},
	];

	const getCurrentTab = () => {
		const path = location.pathname.split( '/' )[ 1 ];
		const validTabNames = tabs.map( tab => tab.name );
		if ( validTabNames.includes( path ) ) {
			return path;
		}
		return config( 'hasFeedback' ) ? 'responses' : 'about';
	};

	const handleTabSelect = useCallback(
		tabName => {
			if ( ! tabName ) {
				tabName = config( 'hasFeedback' ) ? 'responses' : 'about';
			}
			navigate( {
				pathname: `/${ tabName }`,
				search: tabName === 'responses' ? location.search : '',
			} );
		},
		[ navigate, location.search ]
	);

	return (
		<div className={ clsx( 'jp-forms__layout', className ) }>
			<div className="jp-forms__logo-wrapper">
				<JetpackFormsLogo />
			</div>
			<TabPanel
				className="jp-forms__dashboard-tabs"
				tabs={ tabs }
				initialTabName={ getCurrentTab() }
				onSelect={ handleTabSelect }
			>
				{ () => <Outlet /> }
			</TabPanel>
			{ showFooter && (
				<JetpackFooter
					className="jp-forms__layout-footer"
					moduleName={ __( 'Jetpack Forms', 'jetpack-forms' ) }
					useInternalLinks={ shouldUseInternalLinks() }
				/>
			) }
		</div>
	);
};

export default Layout;

import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	JetpackLogo,
} from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { config } from '../index';

// TODO: This is a temporary page to migrate the admin page to the new menu
// and this is a mockup of the new page until the new page is implemented.
const AdminMigratePage = () => {
	const ASSETS_URL = useMemo( () => config( 'pluginAssetsURL' ), [] );
	const dashboardURL = useMemo( () => config( 'dashboardURL' ), [] );
	const header = (
		<div>
			<JetpackLogo />{ ' ' }
			<span
				style={ {
					display: 'inline-block',
					fontSize: '1.65em',
					lineHeight: '1.85em',
					verticalAlign: 'text-bottom',
					fontWeight: 500,
				} }
			>
				{ 'Forms' }
			</span>
		</div>
	);
	return (
		<div style={ { padding: '0 0 0 24px' } }>
			<AdminPage moduleName={ __( 'Jetpack Forms', 'jetpack-forms' ) } header={ header }>
				<AdminSectionHero>
					<Container>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							<h1 style={ { fontSize: '2.5em', marginBottom: '0.5em' } }>
								{ __( 'Forms moved', 'jetpack-forms' ) }
							</h1>
							<p style={ { fontSize: '1.7em', marginTop: '0.5em' } }>
								{ __( "Now it's part of Jetpack → Forms", 'jetpack-forms' ) }
							</p>
							<p>
								<Button variant="primary" href={ dashboardURL }>
									{ __( 'Check new Forms', 'jetpack-forms' ) }
								</Button>
							</p>
							<p style={ { marginTop: '3em' } }>
								<img
									style={ { maxWidth: '100%' } }
									src={ `${ ASSETS_URL }/images/forms-moved.png` }
									alt={ __( 'Forms moved', 'jetpack-forms' ) }
								/>
							</p>
						</Col>
					</Container>
				</AdminSectionHero>
			</AdminPage>
		</div>
	);
};

export default AdminMigratePage;

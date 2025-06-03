/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	JetpackLogo,
	useBreakpointMatch,
	getUserLocale,
} from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { useEffect, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { config } from '../index';
import './style.scss';

// Mag-16, see https://wp.me/PCYsg-9nE
// Exception: pt-br, since mag-16 code is BR and it's the variation, not the language
const availableScreenshotLanguages = [
	'ar',
	'pt-br',
	'de',
	'en',
	'es',
	'fr',
	'he',
	'id',
	'it',
	'ja',
	'ko',
	'nl',
	'ru',
	'sv',
	'tr',
	'zh-cn',
	'zh-tw',
];

const getLocaleScreenshotName = ( locale = '', isMobile = false ) => {
	const baseName = `forms-moved`;
	let languageSuffix = '';
	const lowercaseLocale = locale.toLowerCase();
	if ( availableScreenshotLanguages.includes( lowercaseLocale ) ) {
		languageSuffix = `-${ lowercaseLocale }`;
	} else {
		const language = lowercaseLocale.split( '-' )[ 0 ];

		if ( availableScreenshotLanguages.includes( language ) ) {
			languageSuffix = `-${ language }`;
		}
	}

	return `${ baseName }${ languageSuffix }${ isMobile ? '-mobile' : '' }.png`;
};

const AdminMigratePage = () => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
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
	const screenshotName = useMemo(
		() => getLocaleScreenshotName( getUserLocale(), isSm ),
		[ isSm ]
	);

	useEffect( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_admin_migrate_page_view', {
			viewport: isSm ? 'mobile' : 'desktop',
		} );
	}, [ isSm ] );

	const onCheckNewFormsClick = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent(
			'jetpack_forms_admin_migrate_page_check_new_forms_button_click',
			{
				viewport: isSm ? 'mobile' : 'desktop',
			}
		);

		window.location.href = dashboardURL;
	}, [ isSm, dashboardURL ] );

	return (
		<div className="jp-forms__admin-migrate-page-wrapper">
			<AdminPage moduleName={ __( 'Jetpack Forms', 'jetpack-forms' ) } header={ header }>
				<AdminSectionHero>
					<Container>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							<h1 style={ { fontSize: '2.5em', marginBottom: '0.5em' } }>
								{ __( 'Forms responses have moved', 'jetpack-forms' ) }
							</h1>
							<p style={ { fontSize: '1.7em', marginTop: '0.5em' } }>
								{ __( 'They can now be found at Jetpack → Forms', 'jetpack-forms' ) }
							</p>
							<p>
								<Button variant="primary" onClick={ onCheckNewFormsClick }>
									{ __( 'Check new Forms', 'jetpack-forms' ) }
								</Button>
							</p>
							<p style={ { marginTop: '3em' } }>
								<img
									style={ { maxWidth: '100%' } }
									src={ `${ ASSETS_URL }/images/${ screenshotName }` }
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

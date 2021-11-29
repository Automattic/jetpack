/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl, JetpackLogo } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ScreenMain from './screen-main';
import ScreenMigrated from './screen-migrated';
import './style.scss';

const IDCScreenVisual = props => {
	const {
		logo,
		headerText,
		title,
		mainBodyText,
		wpcomHomeUrl,
		currentUrl,
		redirectUri,
		isMigrated,
		onMigrated,
	} = props;

	return (
		<div className={ 'jp-idc__idc-screen' + ( isMigrated ? ' jp-idc__idc-screen__success' : '' ) }>
			<div className="jp-idc__idc-screen__header">
				<div className="jp-idc__idc-screen__logo">{ logo }</div>
				<div className="jp-idc__idc-screen__logo-label">{ headerText }</div>
			</div>

			{ isMigrated ? (
				<ScreenMigrated wpcomHomeUrl={ wpcomHomeUrl } currentUrl={ currentUrl } />
			) : (
				<ScreenMain
					wpcomHomeUrl={ wpcomHomeUrl }
					currentUrl={ currentUrl }
					onMigrated={ onMigrated }
					redirectUri={ redirectUri }
					title={ title }
					mainBodyText={ mainBodyText }
				/>
			) }
		</div>
	);
};

IDCScreenVisual.propTypes = {
	/** The screen logo, Jetpack by default. */
	logo: PropTypes.object,
	/** The header text, 'Safe Mode' by default. */
	headerText: PropTypes.string,
	/** The original site URL. */
	wpcomHomeUrl: PropTypes.string.isRequired,
	/** The current site URL. */
	currentUrl: PropTypes.string.isRequired,
	/** The redirect URI to redirect users back to after connecting. */
	redirectUri: PropTypes.string.isRequired,
	/** The main screen title. */
	title: PropTypes.string.isRequired,
	/** The main screen body text. */
	mainBodyText: PropTypes.string.isRequired,
	/** Whether the migration has been completed. */
	isMigrated: PropTypes.bool.isRequired,
	/** Callback to be called when migration gets completed. */
	onMigrated: PropTypes.func,
};

IDCScreenVisual.defaultProps = {
	logo: <JetpackLogo height={ 24 } />,
	headerText: __( 'Safe Mode', 'jetpack' ),
	title: __( 'Safe Mode has been activated', 'jetpack' ),
	mainBodyText: createInterpolateElement(
		__(
			'Your site is in Safe Mode because you have 2 Jetpack-powered sites that appear to be duplicates. ' +
				'2 sites that are telling Jetpack they’re the same site. <safeModeLink>Learn more about safe mode.</safeModeLink>',
			'jetpack'
		),
		{
			safeModeLink: (
				<a
					href={ getRedirectUrl( 'jetpack-support-safe-mode' ) }
					rel="noopener noreferrer"
					target="_blank"
				/>
			),
		}
	).toString(),
	isMigrated: false,
};

export default IDCScreenVisual;

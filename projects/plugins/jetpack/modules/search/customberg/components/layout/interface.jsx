/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ComplementaryArea, InterfaceSkeleton } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { COMPLEMENTARY_AREA_SCOPE } from '../../lib/constants';
import AppWrapper from '../app-wrapper';
import Header from '../header';
import './styles.scss';

const interfaceLabels = {
	/* translators: accessibility text for the widgets screen top bar landmark region. */
	header: __( 'Jetpack Search customization top bar', 'jetpack' ),
	/* translators: accessibility text for the widgets screen content landmark region. */
	body: __( 'Jetpack Search customization preview', 'jetpack' ),
	/* translators: accessibility text for the widgets screen settings landmark region. */
	sidebar: __( 'Jetpack Search customization settings', 'jetpack' ),
	/* translators: accessibility text for the widgets screen footer landmark region. */
	footer: __( 'Jetpack Search customization footer', 'jetpack' ),
};

/**
 * Wraps the InterfaceSkeleton component with necessary parameters.
 *
 * @returns {React.Element} component instance
 */
export default function Interface() {
	const hasSidebarEnabled = true;

	return (
		<InterfaceSkeleton
			content={ <AppWrapper /> }
			header={ <Header /> }
			labels={ interfaceLabels }
			sidebar={ hasSidebarEnabled && <ComplementaryArea.Slot scope={ COMPLEMENTARY_AREA_SCOPE } /> }
		/>
	);
}

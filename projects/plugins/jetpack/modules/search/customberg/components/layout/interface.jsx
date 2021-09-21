/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	ComplementaryArea,
	InterfaceSkeleton,
	store as interfaceStore,
} from '@wordpress/interface';
import { store as viewportStore } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import { COMPLEMENTARY_AREA_SCOPE, OPTIONS_TAB_IDENTIFIER } from '../../lib/constants';
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
 * @returns {Element} component instance
 */
export default function Interface() {
	const { hasSidebarEnabled, isLargeViewport } = useSelect( select => ( {
		isLargeViewport: select( viewportStore ).isViewportMatch( 'large' ),
		hasSidebarEnabled: !! select( interfaceStore ).getActiveComplementaryArea(
			COMPLEMENTARY_AREA_SCOPE
		),
	} ) );

	const { enableComplementaryArea, disableComplementaryArea } = useDispatch( interfaceStore );
	useEffect( () => {
		isLargeViewport
			? enableComplementaryArea( COMPLEMENTARY_AREA_SCOPE, OPTIONS_TAB_IDENTIFIER )
			: disableComplementaryArea( COMPLEMENTARY_AREA_SCOPE );
	}, [ enableComplementaryArea, disableComplementaryArea, isLargeViewport ] );

	return (
		<InterfaceSkeleton
			content={ <AppWrapper /> }
			header={ <Header /> }
			labels={ interfaceLabels }
			sidebar={ hasSidebarEnabled && <ComplementaryArea.Slot scope={ COMPLEMENTARY_AREA_SCOPE } /> }
		/>
	);
}

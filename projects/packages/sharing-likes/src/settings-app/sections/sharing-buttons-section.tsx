import { useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { AutoSaveFields } from '../components/auto-save-fields';
import { CheckboxEdit, SelectEdit } from '../components/controls';
import { FeatureVariant } from '../components/feature-variant';
import { PlacementSummary } from '../components/placement-summary';
import { SectionCard } from '../components/section-card';
import { TextSetting } from '../components/text-setting';
import { useServices, useStatus } from '../data/queries';
import { configures, type Settings } from '../types';
import { ServicesList } from './services-list';
import type { Field } from '@wordpress/dataviews';
import type { JSX } from 'react';

/**
 * The button style select.
 *
 * @return Field.
 */
function buttonStyleField(): Field< Settings > {
	return {
		id: 'button_style',
		label: __( 'Button style', 'jetpack-sharing-likes' ),
		type: 'text',
		elements: [
			{ value: 'icon-text', label: __( 'Icon + text', 'jetpack-sharing-likes' ) },
			{ value: 'icon', label: __( 'Icon only', 'jetpack-sharing-likes' ) },
			{ value: 'text', label: __( 'Text only', 'jetpack-sharing-likes' ) },
			{ value: 'official', label: __( 'Official buttons', 'jetpack-sharing-likes' ) },
		],
		Edit: SelectEdit,
	};
}

/**
 * The "Disable CSS and JS" checkbox. Only offered while this section configures.
 *
 * @return Field.
 */
function disableResourcesField(): Field< Settings > {
	return {
		id: 'disable_resources',
		label: __( 'Disable CSS and JS', 'jetpack-sharing-likes' ),
		description: __(
			'Advanced. If this option is checked, you must include these files in your theme manually for the sharing links to work.',
			'jetpack-sharing-likes'
		),
		type: 'boolean',
		Edit: CheckboxEdit,
	};
}

/**
 * The options, while the section configures.
 *
 * @return Options.
 */
function SharingOptions(): JSX.Element {
	const services = useServices( true );
	const hasServices =
		!! services.data && services.data.visible.length + services.data.hidden.length > 0;
	const styleFields = useMemo( () => [ buttonStyleField() ], [] );
	const resourceFields = useMemo( () => [ disableResourcesField() ], [] );

	return (
		<>
			{ hasServices && <PlacementSummary feature="sharing" /> }
			<ServicesList query={ services } />
			<AutoSaveFields fields={ styleFields } />
			<TextSetting
				settingKey="sharing_label"
				label={ __( 'Sharing label', 'jetpack-sharing-likes' ) }
			/>
			<AutoSaveFields fields={ resourceFields } />
		</>
	);
}

/**
 * Sharing buttons.
 *
 * @return Section, or null before status is known.
 */
export function SharingButtonsSection(): JSX.Element | null {
	const status = useStatus();
	if ( ! status ) {
		return null;
	}

	const state = status.sharing.state;

	return (
		<SectionCard title={ _x( 'Sharing buttons', 'Settings header', 'jetpack-sharing-likes' ) }>
			<FeatureVariant feature="sharing" state={ state }>
				{ configures( state ) && <SharingOptions /> }
			</FeatureVariant>
		</SectionCard>
	);
}

/**
 * AI Features view — per-feature toggles for Jetpack AI.
 *
 * Lists each Jetpack AI feature with its own on/off switch, backed by the
 * feature-settings endpoint. A disabled feature must genuinely stop loading
 * (its assets are not enqueued), not just disappear from view.
 */

import {
	Card,
	CardBody,
	CardDivider,
	ToggleControl,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import analytics from 'lib/analytics';

const FEATURES = [
	{
		key: 'writing_assistant',
		label: __( 'Writing assistant', 'jetpack' ),
		help: __( 'AI-powered writing suggestions and assistance in the editor.', 'jetpack' ),
	},
	{
		key: 'image_editor',
		label: __( 'Image editor', 'jetpack' ),
		help: __( 'Create and edit images with AI.', 'jetpack' ),
	},
	{
		key: 'excerpt',
		label: __( 'Excerpt generator', 'jetpack' ),
		help: __( 'Generate post excerpts with AI.', 'jetpack' ),
	},
	{
		key: 'seo_enhancer',
		label: __( 'SEO enhancer', 'jetpack' ),
		help: __( 'Generate SEO titles and descriptions with AI.', 'jetpack' ),
	},
];

/**
 * A single feature toggle row.
 *
 * @param {object}   props          - Component props.
 * @param {object}   props.feature  - Entry from FEATURES.
 * @param {boolean}  props.checked  - Whether the feature is enabled.
 * @param {boolean}  props.isSaving - Whether this toggle is being saved.
 * @param {Function} props.onChange - Called with the new enabled state.
 * @return {object} Component markup.
 */
function FeatureToggle( { feature, checked, isSaving, onChange } ) {
	const handleChange = useCallback(
		enabled => onChange( feature.key, enabled ),
		[ feature.key, onChange ]
	);

	return (
		<ToggleControl
			__nextHasNoMarginBottom
			checked={ checked }
			disabled={ isSaving }
			label={ feature.label }
			help={ feature.help }
			onChange={ handleChange }
		/>
	);
}

/**
 * AI Features view component.
 *
 * @param {object}   props            - Component props.
 * @param {object}   props.settings   - Full settings shape from the feature-settings endpoint.
 * @param {Set}      props.savingKeys - Keys currently being saved.
 * @param {Function} props.onUpdate   - Called with a partial settings update payload.
 * @return {object} Component markup.
 */
export default function AiFeatures( { settings, savingKeys, onUpdate } ) {
	const features = settings?.features ?? {};

	const handleToggle = useCallback(
		( key, enabled ) => {
			analytics.tracks.recordEvent( 'jetpack_ai_feature_toggled', { feature: key, enabled } );
			onUpdate( { features: { [ key ]: enabled } } );
		},
		[ onUpdate ]
	);

	return (
		<Card>
			<CardBody>
				<Stack direction="column" gap="md">
					<Stack direction="column" gap="xs">
						<Text as="h3" weight={ 600 }>
							{ __( 'AI features', 'jetpack' ) }
						</Text>
						<Text variant="muted">
							{ __(
								'Choose which Jetpack AI features are available on your site. Features that are turned off will not load.',
								'jetpack'
							) }
						</Text>
					</Stack>
					{ FEATURES.map( ( feature, index ) => (
						<Stack key={ feature.key } direction="column" gap="md">
							{ index > 0 && <CardDivider /> }
							<FeatureToggle
								feature={ feature }
								checked={ !! features[ feature.key ]?.enabled }
								isSaving={ savingKeys.has( feature.key ) }
								onChange={ handleToggle }
							/>
						</Stack>
					) ) }
				</Stack>
			</CardBody>
		</Card>
	);
}

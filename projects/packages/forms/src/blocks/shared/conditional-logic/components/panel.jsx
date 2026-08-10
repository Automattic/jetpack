import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { normalizeLogic } from '../constants.js';
import { CONTROLS } from '../controls/index.js';
import useSubjectFields from '../hooks/use-subject-fields.js';
import '../editor.scss';

const ACTION_OPTIONS = [
	{ value: 'show', label: __( 'Show this field', 'jetpack-forms' ) },
	{ value: 'hide', label: __( 'Hide this field', 'jetpack-forms' ) },
];

const MATCH_OPTIONS = [
	{ value: 'any', label: __( 'if any', 'jetpack-forms' ) },
	{ value: 'all', label: __( 'if all', 'jetpack-forms' ) },
];

/**
 * Count the rules stored across every control.
 *
 * @param {object} controls - The `controls` map from the attribute.
 * @return {number} Total rule count.
 */
const countRules = controls =>
	Object.values( controls || {} ).reduce(
		( total, control ) => total + ( Array.isArray( control?.rules ) ? control.rules.length : 0 ),
		0
	);

/**
 * The "Conditional logic" inspector panel, injected into every field block.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.clientId      - The field block's client id.
 * @param {object}   props.attributes    - The field block's attributes.
 * @param {Function} props.setAttributes - The field block's attribute setter.
 * @return {object} The rendered panel.
 */
const ConditionalLogicPanel = ( { clientId, attributes, setAttributes } ) => {
	const logic = useMemo(
		() => normalizeLogic( attributes.conditionalLogic ),
		[ attributes.conditionalLogic ]
	);

	const fields = useSubjectFields( clientId );

	const updateLogic = useCallback(
		next => setAttributes( { conditionalLogic: next } ),
		[ setAttributes ]
	);

	const handleActionChange = useCallback(
		action => updateLogic( { ...logic, action } ),
		[ logic, updateLogic ]
	);

	const handleMatchChange = useCallback(
		logicalOperator => updateLogic( { ...logic, logicalOperator } ),
		[ logic, updateLogic ]
	);

	/**
	 * Store a control's config, keeping `enabled` in step with whether any rule exists.
	 *
	 * Deriving it here rather than exposing a toggle means a field only carries conditional
	 * logic once it actually has a condition, so untouched fields add nothing to the page.
	 *
	 * @param {string} slug - The control slug.
	 * @param {object} next - The control's next config.
	 */
	const handleControlChange = useCallback(
		( slug, next ) => {
			const controls = { ...logic.controls, [ slug ]: next };
			updateLogic( { ...logic, controls, enabled: countRules( controls ) > 0 } );
		},
		[ logic, updateLogic ]
	);

	const hasConditions = countRules( logic.controls ) > 0;

	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Conditional logic', 'jetpack-forms' ) }
				initialOpen={ false }
				className="jetpack-contact-form__panel jetpack-contact-form__conditional-logic"
			>
				{ hasConditions ? (
					<>
						<Stack
							direction="row"
							align="flex-start"
							gap="sm"
							className="jetpack-contact-form__conditional-logic-summary"
						>
							<SelectControl
								label={ __( 'Action', 'jetpack-forms' ) }
								hideLabelFromVision
								value={ logic.action }
								options={ ACTION_OPTIONS }
								onChange={ handleActionChange }
								__nextHasNoMarginBottom={ true }
								__next40pxDefaultSize={ true }
							/>
							<SelectControl
								label={ __( 'When', 'jetpack-forms' ) }
								hideLabelFromVision
								value={ logic.logicalOperator }
								options={ MATCH_OPTIONS }
								onChange={ handleMatchChange }
								__nextHasNoMarginBottom={ true }
								__next40pxDefaultSize={ true }
							/>
						</Stack>
						<Text variant="body-sm" className="jetpack-contact-form__conditional-logic-hint">
							{ __( 'of the following conditions are met:', 'jetpack-forms' ) }
						</Text>
					</>
				) : (
					<Text variant="body-sm" className="jetpack-contact-form__conditional-logic-intro">
						{ __(
							'Show or hide this field based on the answer to another field.',
							'jetpack-forms'
						) }
					</Text>
				) }

				{ CONTROLS.map( control => {
					const { Edit, slug } = control;
					return (
						<Edit
							key={ slug }
							value={ logic.controls[ slug ] }
							fields={ fields }
							ownFieldId={ attributes.id }
							onChange={ next => handleControlChange( slug, next ) }
						/>
					);
				} ) }
			</PanelBody>
		</InspectorControls>
	);
};

export default ConditionalLogicPanel;

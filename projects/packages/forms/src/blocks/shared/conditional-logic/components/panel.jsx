import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import {
	countRules,
	getPrimaryGroup,
	normalizeLogic,
	withPrimaryGroupRules,
} from '../constants.js';
import FieldValueControl from '../controls/field-value/edit.jsx';
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

	// The panel edits one group, so its Any/All selector is that group's operator. The
	// top-level operator combines groups with each other and only starts to matter once a
	// second group is editable.
	const group = getPrimaryGroup( logic );

	const handleMatchChange = useCallback(
		logicalOperator => updateLogic( withPrimaryGroupRules( logic, group.rules, logicalOperator ) ),
		[ group.rules, logic, updateLogic ]
	);

	const handleRulesChange = useCallback(
		rules => updateLogic( withPrimaryGroupRules( logic, rules, group.logicalOperator ) ),
		[ group.logicalOperator, logic, updateLogic ]
	);

	const hasConditions = countRules( logic ) > 0;

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
								value={ group.logicalOperator }
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

				<FieldValueControl
					rules={ group.rules }
					fields={ fields }
					ownFieldId={ attributes.id }
					onChange={ handleRulesChange }
				/>
			</PanelBody>
		</InspectorControls>
	);
};

export default ConditionalLogicPanel;

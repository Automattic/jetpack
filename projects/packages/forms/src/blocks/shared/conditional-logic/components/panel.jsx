import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { Button, PanelBody, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { seen, unseen } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import {
	countRules,
	getPrimaryGroup,
	normalizeLogic,
	startsHidden,
	withPrimaryGroupRules,
} from '../constants.js';
import useSubjectFields from '../hooks/use-subject-fields.js';
import {
	describeRule,
	getActiveConditions,
	getSummaryHeading,
	getSummaryText,
} from '../util/summary.js';
import ConditionalLogicModal from './rules-modal.jsx';
import '../editor.scss';

/**
 * The "Conditional logic" inspector panel, injected into every field block.
 *
 * Holds a summary and a button; the rules themselves are edited in a dialog, because three
 * controls per condition do not fit the inspector's width without stacking into a card per
 * condition, and a handful of those outgrows the viewport.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.clientId      - The field block's client id.
 * @param {object}   props.attributes    - The field block's attributes.
 * @param {Function} props.setAttributes - The field block's attribute setter.
 * @return {object} The rendered panel.
 */
const ConditionalLogicPanel = ( { clientId, attributes, setAttributes } ) => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const logic = useMemo(
		() => normalizeLogic( attributes.conditionalLogic ),
		[ attributes.conditionalLogic ]
	);

	const fields = useSubjectFields( clientId );
	const group = getPrimaryGroup( logic );

	const updateLogic = useCallback(
		next => setAttributes( { conditionalLogic: next } ),
		[ setAttributes ]
	);

	const handleActionChange = useCallback(
		action => updateLogic( { ...logic, action } ),
		[ logic, updateLogic ]
	);

	const handleMatchChange = useCallback(
		logicalOperator => updateLogic( withPrimaryGroupRules( logic, group.rules, logicalOperator ) ),
		[ group.rules, logic, updateLogic ]
	);

	const handleRulesChange = useCallback(
		rules => updateLogic( withPrimaryGroupRules( logic, rules, group.logicalOperator ) ),
		[ group.logicalOperator, logic, updateLogic ]
	);

	const openModal = useCallback( () => setIsModalOpen( true ), [] );
	const closeModal = useCallback( () => setIsModalOpen( false ), [] );

	const hasConditions = countRules( logic ) > 0;

	// The conditions the field will actually be governed by. Incomplete ones are skipped by
	// both evaluators, so listing them here would describe behaviour the field does not have.
	const activeConditions = getActiveConditions( group, fields );

	return (
		<>
			{ /* Present on every block that supports conditional logic, the way Required is,
			     rather than appearing once rules exist. A control that comes and goes is
			     harder to find than one that is always there, and this is also how an author
			     reaches the builder from the canvas rather than the sidebar. */ }
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarGroup>
					<ToolbarButton
						// The field's state before any condition is met, which is what an
						// author sees on the canvas.
						icon={ startsHidden( logic ) ? unseen : seen }
						title={
							activeConditions.length
								? getSummaryText( logic, group, fields )
								: __( 'Add conditional logic', 'jetpack-forms' )
						}
						onClick={ openModal }
						// Inverted while the field carries conditions, the same treatment
						// Required uses for a field that is required.
						className={ clsx( 'jetpack-contact-form__conditional-logic-toolbar', {
							'is-pressed': hasConditions,
						} ) }
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody
					title={ __( 'Conditional logic', 'jetpack-forms' ) }
					initialOpen={ false }
					className="jetpack-contact-form__panel jetpack-contact-form__conditional-logic"
				>
					<Stack direction="column" gap="md">
						{ activeConditions.length ? (
							<Stack direction="column" gap="xs">
								<Text
									variant="body-sm"
									className="jetpack-contact-form__conditional-logic-summary-text"
								>
									{ getSummaryHeading( logic, group ) }
								</Text>
								{ /* A list rather than stacked paragraphs, so a screen reader
								     announces how many conditions there are before reading them. */ }
								<ul className="jetpack-contact-form__conditional-logic-summary-list">
									{ activeConditions.map( ( { rule, subject }, index ) => (
										<li key={ index }>
											<Text variant="body-sm">{ describeRule( rule, subject ) }</Text>
										</li>
									) ) }
								</ul>
							</Stack>
						) : (
							<Text
								variant="body-sm"
								className="jetpack-contact-form__conditional-logic-summary-text"
							>
								{ __(
									'Show or hide this field based on the answer to another field.',
									'jetpack-forms'
								) }
							</Text>
						) }

						<Button
							variant="secondary"
							onClick={ openModal }
							__next40pxDefaultSize={ true }
							className="jetpack-contact-form__conditional-logic-edit"
						>
							{ /* The trailing 0 is deliberate, and matches how this is handled
							     elsewhere in the package. Two identically shaped __() calls in a
							     ternary get folded by the production minifier into
							     __( cond ? 'a' : 'b', domain ), whose msgid is no longer a
							     literal and so cannot be extracted for translation — which
							     fails the build. The extra argument is ignored at runtime and
							     keeps the two calls apart. */ }
							{ hasConditions
								? __( 'Edit conditions', 'jetpack-forms' )
								: __( 'Add conditions', 'jetpack-forms', 0 ) }
						</Button>
					</Stack>
				</PanelBody>

				<ConditionalLogicModal
					isOpen={ isModalOpen }
					onClose={ closeModal }
					logic={ logic }
					group={ group }
					fields={ fields }
					ownFieldId={ attributes.id }
					onActionChange={ handleActionChange }
					onMatchChange={ handleMatchChange }
					onRulesChange={ handleRulesChange }
				/>
			</InspectorControls>
		</>
	);
};

export default ConditionalLogicPanel;

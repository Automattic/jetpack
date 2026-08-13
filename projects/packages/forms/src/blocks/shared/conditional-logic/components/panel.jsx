import { InspectorControls } from '@wordpress/block-editor';
import { Button, PanelBody } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import {
	countRules,
	getPrimaryGroup,
	normalizeLogic,
	withPrimaryGroupRules,
} from '../constants.js';
import useSubjectFields from '../hooks/use-subject-fields.js';
import ConditionalLogicModal from './rules-modal.jsx';
import '../editor.scss';

/**
 * Describe the field's conditions in one line.
 *
 * This is the whole reason the inspector keeps a panel rather than just a button: an author can
 * tell whether a field is conditional, and roughly why, without opening anything. It states the
 * action, the match mode and the count, because those answer "what does this field do?" without
 * repeating the rules themselves.
 *
 * @param {object} logic - The normalized conditional-logic attribute.
 * @param {object} group - The group being described.
 * @return {string} A sentence describing the conditions.
 */
const summarize = ( logic, group ) => {
	const count = countRules( logic );

	if ( 'hide' === logic.action ) {
		return 'all' === group.logicalOperator
			? sprintf(
					/* translators: %d: number of conditions */
					_n(
						'Hidden when %d condition matches',
						'Hidden when all %d conditions match',
						count,
						'jetpack-forms'
					),
					count
			  )
			: sprintf(
					/* translators: %d: number of conditions */
					_n(
						'Hidden when %d condition matches',
						'Hidden when any of %d conditions match',
						count,
						'jetpack-forms'
					),
					count
			  );
	}

	return 'all' === group.logicalOperator
		? sprintf(
				/* translators: %d: number of conditions */
				_n(
					'Shown when %d condition matches',
					'Shown when all %d conditions match',
					count,
					'jetpack-forms'
				),
				count
		  )
		: sprintf(
				/* translators: %d: number of conditions */
				_n(
					'Shown when %d condition matches',
					'Shown when any of %d conditions match',
					count,
					'jetpack-forms'
				),
				count
		  );
};

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

	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Conditional logic', 'jetpack-forms' ) }
				initialOpen={ false }
				className="jetpack-contact-form__panel jetpack-contact-form__conditional-logic"
			>
				<Stack direction="column" gap="md">
					<Text variant="body-sm" className="jetpack-contact-form__conditional-logic-summary-text">
						{ hasConditions
							? summarize( logic, group )
							: __(
									'Show or hide this field based on the answer to another field.',
									'jetpack-forms'
							  ) }
					</Text>

					<Button
						variant="secondary"
						onClick={ openModal }
						__next40pxDefaultSize={ true }
						className="jetpack-contact-form__conditional-logic-edit"
					>
						{ hasConditions
							? __( 'Edit conditions', 'jetpack-forms' )
							: __( 'Add conditions', 'jetpack-forms' ) }
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
	);
};

export default ConditionalLogicPanel;

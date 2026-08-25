import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	__experimentalNumberControl as NumberControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls.jsx';
import { UpsellNudge } from '../shared/components/upsell-nudge/index.jsx';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles.js';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id.js';
import './editor.scss';

/*
 * Highest value the control offers. Keep in sync with
 * Contact_Form_Field::FILE_FIELD_MAX_FILES_LIMIT, which clamps the attribute again at render time
 * and is what the submission-time check is measured against — this only keeps the editor from
 * offering a number the front end would silently lower.
 */
const MAX_FILES_LIMIT = 10;

const ALLOWED_BLOCKS = []; // leave this empty to prevent adding new blocks inside and duplicating them.
const DEFAULT_TEMPLATE = [
	[
		'jetpack/label',
		{
			label: __( 'Upload a file', 'jetpack-forms' ),
			lock: { move: true, remove: true },
		},
	],
	[
		'jetpack/dropzone',
		{
			lock: { move: true, remove: true },
			layout: { type: 'flex', justifyContent: 'center', orientation: 'vertical' },
		},
	],
];

export default function FileFieldEdit( props ) {
	const { attributes, clientId, isSelected, setAttributes, name, className } = props;
	const { id, required, width, maxfiles = 1 } = attributes;

	const fieldFileAvailability = getJetpackExtensionAvailability( 'field-file' );

	useFormWrapper( { attributes, clientId, name } );
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const classes = clsx( className, 'jetpack-field is-non-animated-label', {
		'is-selected': isSelected,
		[ `jetpack-field__width-${ width }` ]: width,
	} );

	const blockProps = useBlockProps( {
		className: classes,
		style: blockStyle,
	} );

	const { children, ...restInnerBlocksProps } = useInnerBlocksProps( blockProps, {
		template: DEFAULT_TEMPLATE,
		allowedBlocks: ALLOWED_BLOCKS, // leave this empty to prevent adding new blocks inside and dplicateing them.
		renderAppender: false,
	} );

	const formClientId = useParentFormClientId( clientId );

	const selectedBlockClientId = useSelect( select => {
		const { getSelectedBlockClientId } = select( blockEditorStore );
		return getSelectedBlockClientId();
	} );

	const selectedFormClientId = useParentFormClientId( selectedBlockClientId );

	const onChangeMaxFiles = useCallback(
		value => {
			// NumberControl hands back a string, and an empty one while the field is being cleared.
			const parsed = parseInt( value, 10 );

			setAttributes( {
				maxfiles: Number.isNaN( parsed ) ? 1 : Math.min( Math.max( parsed, 1 ), MAX_FILES_LIMIT ),
			} );
		},
		[ setAttributes ]
	);

	const requiresCustomUpgradeNudge = useMemo( () => {
		return (
			( ! fieldFileAvailability || ! fieldFileAvailability.available ) &&
			fieldFileAvailability?.unavailableReason?.includes( 'nudge_disabled' )
		);
	}, [ fieldFileAvailability ] );

	return (
		<>
			<div { ...restInnerBlocksProps }>
				{ requiresCustomUpgradeNudge &&
					( selectedFormClientId === formClientId || formClientId === selectedBlockClientId ) && (
						<UpsellNudge requiredPlan={ fieldFileAvailability?.details?.required_plan } />
					) }
				{ children }
			</div>

			<JetpackFieldControls
				id={ id }
				required={ required }
				setAttributes={ setAttributes }
				width={ width }
				attributes={ attributes }
				hidePlaceholder={ true }
				extraFieldSettings={ [
					{
						index: 2,
						element: (
							<NumberControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								key="maxfiles"
								label={ __( 'Maximum files', 'jetpack-forms' ) }
								min={ 1 }
								max={ MAX_FILES_LIMIT }
								step={ 1 }
								value={ maxfiles }
								onChange={ onChangeMaxFiles }
								help={ __( 'How many files a visitor may upload to this field.', 'jetpack-forms' ) }
							/>
						),
					},
				] }
			/>
		</>
	);
}

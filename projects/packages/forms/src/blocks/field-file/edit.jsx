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
 * Highest value the control offers when PHP has not said otherwise. Matches
 * Contact_Form_Field::FILE_FIELD_MAX_FILES_LIMIT, which is the default the site sends below.
 */
const DEFAULT_MAX_FILES_LIMIT = 10;

/*
 * What this site will actually honour, after the `jetpack_forms_file_field_max_files_limit` filter.
 *
 * Read from PHP rather than hardcoded so the control cannot offer a number the front end would
 * quietly lower, nor withhold one a filter has made available. A field already storing more than
 * this is clamped at render time, so a site that removes its filter returns those fields to the
 * default on its own.
 */
const getMaxFilesLimit = () =>
	window.jpFormsBlocks?.defaults?.maxFilesLimit || DEFAULT_MAX_FILES_LIMIT;

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
	const maxFilesLimit = getMaxFilesLimit();

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
			const parsed = parseInt( value, 10 );

			/*
			 * NumberControl reports every keystroke, including the empty string left behind by a
			 * backspace. Writing a value then would snap the attribute to 1 mid-edit, and because the
			 * control is controlled it would redraw as "1" with the caret after it — so an author
			 * clearing 8 to type 5 would end up committing 15, clamped to the ceiling. Leaving the
			 * attribute alone keeps their draft intact; there is nothing to save until they type a
			 * number anyway.
			 */
			if ( Number.isNaN( parsed ) ) {
				return;
			}

			setAttributes( {
				maxfiles: Math.min( Math.max( parsed, 1 ), maxFilesLimit ),
			} );
		},
		[ setAttributes, maxFilesLimit ]
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
								max={ maxFilesLimit }
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

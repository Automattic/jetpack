import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { Notice, TextControl, RadioControl, Placeholder } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import metadata from '../block.json';
import { CRITERIA_AFTER, CRITERIA_BEFORE } from '../constants';

const RADIO_OPTIONS = [
	{
		value: CRITERIA_AFTER,
		label: __( 'Show after threshold', 'jetpack' ),
	},
	{
		value: CRITERIA_BEFORE,
		label: __( 'Show before threshold', 'jetpack' ),
	},
];
const icon = getBlockIconComponent( metadata );

export const RepeatVisitorEdit = ( { isSelected, attributes, setAttributes } ) => {
	const { criteria, threshold } = attributes;

	const blockProps = useBlockProps();
	const [ isThresholdValid, setIsThresholdValid ] = useState( true );

	const onVisibilityChange = val => setAttributes( { criteria: val } );
	const onThresholdChange = val => {
		if ( /^\d+$/.test( val ) && +val > 0 ) {
			setAttributes( { threshold: +val } );
			setIsThresholdValid( true );
		} else {
			setIsThresholdValid( false );
		}
	};

	const getNoticeLabel = () => {
		if ( criteria === CRITERIA_AFTER ) {
			if ( 1 === threshold ) {
				return __(
					'This block will only appear to people who have visited this page more than once.',
					'jetpack'
				);
			}

			return sprintf(
				/* translators: placeholder is a number. */
				_n(
					'This block will only appear to people who have visited this page more than %d time.',
					'This block will only appear to people who have visited this page more than %d times.',
					+threshold,
					'jetpack'
				),
				threshold
			);
		}

		if ( 1 === threshold ) {
			return __(
				'This block will only appear to people who are visiting this page for the first time.',
				'jetpack'
			);
		}

		return sprintf(
			/* translators: placeholder is a number. */
			_n(
				'This block will only appear to people who are visiting this page for %d time.',
				'This block will only appear to people who have visited this page at most %d times.',
				+threshold,
				'jetpack'
			),
			threshold
		);
	};

	return (
		<div
			{ ...blockProps }
			className={ clsx( blockProps.className, {
				'wp-block-jetpack-repeat-visitor--is-unselected': ! isSelected,
			} ) }
		>
			<Placeholder
				icon={ icon }
				label={ __( 'Repeat Visitor', 'jetpack' ) }
				className="wp-block-jetpack-repeat-visitor-placeholder"
			>
				<TextControl
					className="wp-block-jetpack-repeat-visitor-threshold"
					defaultValue={ threshold }
					help={ isThresholdValid ? '' : __( 'Please enter a valid number.', 'jetpack' ) }
					label={ __( 'Visit count threshold', 'jetpack' ) }
					min="1"
					onChange={ onThresholdChange }
					pattern="[0-9]"
					type="number"
				/>

				<RadioControl
					label={ __( 'Visibility', 'jetpack' ) }
					selected={ criteria }
					options={ RADIO_OPTIONS }
					onChange={ onVisibilityChange }
				/>
			</Placeholder>

			<Notice status="info" isDismissible={ false }>
				{ getNoticeLabel() }
			</Notice>
			<div className="wp-block-jetpack-repeat-visitor__inner-container">
				<InnerBlocks />
			</div>
		</div>
	);
};

export default withSelect( ( select, ownProps ) => {
	const { isBlockSelected, hasSelectedInnerBlock } = select( 'core/block-editor' );

	return {
		isSelected: isBlockSelected( ownProps.clientId ) || hasSelectedInnerBlock( ownProps.clientId ),
	};
} )( RepeatVisitorEdit );

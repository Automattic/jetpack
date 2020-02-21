/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { BlockControls, BlockIcon, InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	CheckboxControl,
	Disabled,
	IconButton,
	PanelBody,
	Placeholder,
	TextControl,
	Toolbar,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import defaultAttributes from './attributes';
import ButtonPreview from './button-preview';
import icon from './icon';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';

export default function RevueEdit( props ) {
	const { attributes, className, setAttributes } = props;

	useEffect( () => {
		const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );
		if ( ! isEqual( validatedAttributes, attributes ) ) {
			setAttributes( validatedAttributes );
		}
	}, [ attributes ] );

	const { revueUsername, firstNameField, lastNameField } = attributes;

	const [ username, setUsername ] = useState( '' );

	useEffect( () => {
		if ( ! username && revueUsername ) {
			setUsername( revueUsername );
		}
	}, [] );

	const saveUsername = event => {
		event.preventDefault();
		setAttributes( { revueUsername: username } );
	};

	return (
		<div className={ className }>
			{ ! revueUsername && (
				<Placeholder
					icon={ <BlockIcon icon={ icon } /> }
					instructions={ __( 'Enter your Revue username.', 'jetpack' ) }
					label={ __( 'Revue', 'jetpack' ) }
				>
					<form onSubmit={ saveUsername }>
						<input
							className="components-placeholder__input"
							onChange={ event => setUsername( event.target.value ) }
							placeholder={ __( 'Enter your Revue username here…', 'jetpack' ) }
							type="text"
							value={ username }
						/>
						<div>
							<Button disabled={ ! username } isDefault isLarge isSecondary type="submit">
								{ __( 'Add Form', 'jetpack' ) }
							</Button>
						</div>
					</form>
				</Placeholder>
			) }

			{ revueUsername && (
				<>
					<InspectorControls>
						<PanelBody title={ __( 'Form Settings', 'jetpack' ) }>
							<CheckboxControl
								label={ __( 'Show first name field.', 'jetpack' ) }
								checked={ firstNameField }
								onChange={ value => {
									setAttributes( { firstNameField: value } );
								} }
							/>
							<CheckboxControl
								label={ __( 'Show last name field.', 'jetpack' ) }
								checked={ lastNameField }
								onChange={ value => {
									setAttributes( { lastNameField: value } );
								} }
							/>
						</PanelBody>
					</InspectorControls>

					<BlockControls>
						<Toolbar>
							<IconButton
								className="components-toolbar__control"
								label={ __( 'Edit Username', 'jetpack' ) }
								icon="edit"
								onClick={ () => setAttributes( { revueUsername: undefined } ) }
							/>
						</Toolbar>
					</BlockControls>

					<Disabled>
						<TextControl
							label={ __( 'Email address', 'jetpack' ) }
							placeholder={ __( 'Your email address…', 'jetpack' ) }
							value=""
						/>
						{ firstNameField && (
							<TextControl
								label={ __( 'First name', 'jetpack' ) }
								placeholder={ __( 'First name… (Optional)', 'jetpack' ) }
								value=""
							/>
						) }
						{ lastNameField && (
							<TextControl
								label={ __( 'Last name', 'jetpack' ) }
								placeholder={ __( 'Last name… (Optional)', 'jetpack' ) }
								value=""
							/>
						) }
					</Disabled>
					<ButtonPreview { ...props } />
				</>
			) }
		</div>
	);
}

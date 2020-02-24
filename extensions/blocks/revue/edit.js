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
	ToggleControl,
	ExternalLink,
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
import JetpackFieldLabel from '../contact-form/components/jetpack-field-label';
import icon from './icon';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import { isAtomicSite, isSimpleSite } from '../../shared/site-type-utils';
import './editor.scss';

export default function RevueEdit( props ) {
	const { attributes, className, setAttributes } = props;

	useEffect( () => {
		const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );
		if ( ! isEqual( validatedAttributes, attributes ) ) {
			setAttributes( validatedAttributes );
		}
	}, [ attributes ] );

	const {
		revueUsername,
		emailLabel,
		emailPlaceholder,
		firstNameLabel,
		firstNamePlaceholder,
		firstNameShow,
		lastNameLabel,
		lastNamePlaceholder,
		lastNameShow,
	} = attributes;

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

	const supportLink =
		isSimpleSite() || isAtomicSite()
			? 'http://support.wordpress.com/wordpress-editor/blocks/revue-block/'
			: 'https://jetpack.com/support/jetpack-blocks/revue-block/';

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
					<div className={ `components-placeholder__learn-more` }>
						<ExternalLink href={ supportLink }>
							{ __( 'Need help finding your Revue username?', 'jetpack' ) }
						</ExternalLink>
					</div>
				</Placeholder>
			) }

			{ revueUsername && (
				<>
					<InspectorControls>
						<PanelBody title={ __( 'Form Settings', 'jetpack' ) }>
							<ToggleControl
								label={ __( 'Show first name field.', 'jetpack' ) }
								checked={ firstNameShow }
								onChange={ () => setAttributes( { firstNameShow: ! firstNameShow } ) }
							/>
							<ToggleControl
								label={ __( 'Show last name field.', 'jetpack' ) }
								checked={ lastNameShow }
								onChange={ () => setAttributes( { lastNameShow: ! lastNameShow } ) }
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

					<TextControl
						label={
							<JetpackFieldLabel
								label={ emailLabel }
								labelFieldName={ 'emailLabel' }
								required
								setAttributes={ setAttributes }
							/>
						}
						onChange={ value => setAttributes( { emailPlaceholder: value } ) }
						placeholder={ emailPlaceholder }
						value={ emailPlaceholder }
					/>
					{ firstNameShow && (
						<TextControl
							label={
								<JetpackFieldLabel
									label={ firstNameLabel }
									labelFieldName={ 'firstNameLabel' }
									setAttributes={ setAttributes }
								/>
							}
							onChange={ value => setAttributes( { firstNamePlaceholder: value } ) }
							placeholder={ firstNamePlaceholder }
							value={ firstNamePlaceholder }
						/>
					) }
					{ lastNameShow && (
						<TextControl
							label={
								<JetpackFieldLabel
									label={ lastNameLabel }
									labelFieldName={ 'lastNameLabel' }
									setAttributes={ setAttributes }
								/>
							}
							onChange={ value => setAttributes( { lastNamePlaceholder: value } ) }
							placeholder={ lastNamePlaceholder }
							value={ lastNamePlaceholder }
						/>
					) }
					<ButtonPreview { ...props } />
				</>
			) }
		</div>
	);
}

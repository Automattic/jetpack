/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import {
	Button,
	Disabled,
	IconButton,
	Placeholder,
	TextControl,
	Toolbar,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ButtonPreview from './button-preview';
import { icon } from './';

export default function RevueEdit( props ) {
	const { attributes, className, setAttributes } = props;
	const { revueUsername } = attributes;

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
					icon={ icon }
					instructions={ __( 'Enter your Revue username.', 'jetpack' ) }
					label={ __( 'Revue', 'jetpack' ) }
				>
					<form onSubmit={ saveUsername }>
						<TextControl
							className="components-placeholder__input"
							onChange={ setUsername }
							placeholder={ __( 'Enter your Revue username here…', 'jetpack' ) }
							value={ username }
						/>
						<Button disabled={ ! username } isLarge isDefault type="submit">
							{ __( 'Insert', 'jetpack' ) }
						</Button>
					</form>
				</Placeholder>
			) }

			{ revueUsername && (
				<>
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
						<TextControl
							label={ __( 'First name', 'jetpack' ) }
							placeholder={ __( 'First name… (Optional)', 'jetpack' ) }
							value=""
						/>
						<TextControl
							label={ __( 'Last name', 'jetpack' ) }
							placeholder={ __( 'Last name… (Optional)', 'jetpack' ) }
							value=""
						/>
					</Disabled>
					<ButtonPreview { ...props } />
				</>
			) }
		</div>
	);
}

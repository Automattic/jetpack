/**
 * WordPress dependencies
 */
import { BlockControls, BlockIcon } from '@wordpress/block-editor';
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
import icon from './icon';

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
								{ __( 'Insert', 'jetpack' ) }
							</Button>
						</div>
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

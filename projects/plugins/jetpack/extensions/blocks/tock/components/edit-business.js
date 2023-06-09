import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink, Placeholder } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import icon from '../icon';

export default function EditBusiness( { className, tockName, setIsEditing, setAttributes } ) {
	const [ name, setName ] = useState( tockName || '' );

	const onChange = event => setName( event.target.value );
	const onSubmitForm = event => {
		event.preventDefault();
		setAttributes( { tockName: name } );
		setIsEditing( false );
	};

	const supportLink =
		isSimpleSite() || isAtomicSite()
			? 'http://support.wordpress.com/wordpress-editor/blocks/eventbrite-block/'
			: 'https://jetpack.com/support/jetpack-blocks/eventbrite-block/';

	return (
		<div className={ className }>
			<Placeholder
				label={ __( 'Book with Tock', 'jetpack' ) }
				instructions={ __( 'Enter your Tock business name.', 'jetpack' ) }
				icon={ icon }
			>
				<form onSubmit={ onSubmitForm }>
					<input
						type="text"
						value={ name }
						className="components-placeholder__input"
						aria-label={ __( 'Tock business name', 'jetpack' ) }
						placeholder={ __( 'Enter your Tock business name here…', 'jetpack' ) }
						onChange={ onChange }
					/>
					<Button variant="secondary" type="submit">
						{ __( 'Save', 'jetpack' ) }
					</Button>
				</form>

				<div className="components-placeholder__learn-more">
					<ExternalLink href={ supportLink }>
						{ __( 'Learn more about the Tock Block', 'jetpack' ) }
					</ExternalLink>
				</div>
			</Placeholder>
		</div>
	);
}

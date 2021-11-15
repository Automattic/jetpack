/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Placeholder, Button } from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { icon } from '../';

export default function EditUrlForm( { className, onSubmit, noticeUI, url, setUrl } ) {
	const onChange = event => setUrl( event.target.value );

	const onSubmitForm = event => {
		event.preventDefault();
		onSubmit();
	};

	return (
		<div className={ className }>
			<Placeholder
				label={ __( 'Pinterest', 'jetpack' ) }
				icon={ <BlockIcon icon={ icon } /> }
				notices={ noticeUI }
			>
				<form onSubmit={ onSubmitForm }>
					<input
						type="url"
						value={ url }
						className="components-placeholder__input"
						aria-label={ __( 'Pinterest URL', 'jetpack' ) }
						placeholder={ __( 'Enter URL to embed here…', 'jetpack' ) }
						onChange={ onChange }
					/>
					<Button isSecondary type="submit">
						{ _x( 'Embed', 'button label', 'jetpack' ) }
					</Button>
				</form>
			</Placeholder>
		</div>
	);
}

import { Button, Placeholder } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import clsx from 'clsx';

const EmbedPlaceHolder = ( {
	className,
	icon,
	instructions,
	label,
	notices,
	url,
	onSubmit,
	placeholder,
	updateUrl,
} ) => {
	return (
		<div className={ clsx( 'wp-block-jetpack-google-docs-embed-editmode', className ) }>
			<Placeholder icon={ icon } label={ label } instructions={ instructions } notices={ notices }>
				<form onSubmit={ onSubmit }>
					<input
						type="url"
						value={ url || '' }
						className="components-placeholder__input"
						placeholder={ placeholder }
						onChange={ event => updateUrl( event.target.value ) }
					/>
					<Button variant="primary" type="submit">
						{ _x( 'Embed', 'button label', 'jetpack' ) }
					</Button>
				</form>
			</Placeholder>
		</div>
	);
};
export default EmbedPlaceHolder;

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

import { Button, Placeholder } from '@wordpress/components';

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
		<div className={ classnames( 'wp-block-p2-embed-editmode', className ) }>
			<Placeholder icon={ icon } label={ label } instructions={ instructions } notices={ notices }>
				<form onSubmit={ onSubmit }>
					<input
						type="url"
						value={ url || '' }
						className="components-placeholder__input"
						placeholder={ placeholder }
						onChange={ event => updateUrl( event.target.value ) }
					/>
					<Button isPrimary type="submit">
						{ _x( 'Embed', 'button label', 'jetpack' ) }
					</Button>
				</form>
			</Placeholder>
		</div>
	);
};
export default EmbedPlaceHolder;

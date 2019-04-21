/**
 * External dependencies
 */
import { Button, Placeholder } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

const PlaceholderInstructions = () => (
	<Fragment>
		{ __( 'Embed Crowdsignal Polls and Surveys', 'jetpack' ) }
		<br />
		<br />
		<Button
			isDefault={ true }
			isLarge={ true }
			href="#"
			className="crowdsignal-embed__learn-more">
			{ _x( 'Create a poll now!', 'jetpack' ) }
		</Button>
		<br />
		<br />
	</Fragment>
);

const CrowdsignalPlaceholder = ( { icon, label, value, onSubmit, onChange, cannotEmbed, fallback, tryAgain } ) => (
	<Placeholder
		className="crowdsignal-embed"
		icon={ icon }
		label={ label }
		instructions={ <PlaceholderInstructions /> }>
		<form onSubmit={ onSubmit }>
			<input
				type="url"
				value={ value || '' }
				className="components-placeholder__input"
				aria-label={ label }
				placeholder={ __( 'Enter URL to embed here…' ) }
				onChange={ onChange } />
			<Button
				isLarge
				type="submit">
				{ _x( 'Embed', 'button label' ) }
			</Button>
			{ cannotEmbed &&
				<p className="components-placeholder__error">
					{ __( 'Sorry, this content could not be embedded.' ) }<br />
					<Button isLarge onClick={ tryAgain }>{ _x( 'Try again', 'button label' ) }</Button> <Button isLarge onClick={ fallback }>{ _x( 'Convert to link', 'button label' ) }</Button>
				</p>
			}
		</form>
	</Placeholder>
);

export default CrowdsignalPlaceholder;

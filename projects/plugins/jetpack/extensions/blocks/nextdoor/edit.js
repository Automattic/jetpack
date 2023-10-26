import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { getBlockDefaultClassName } from '@wordpress/blocks';
import { Button, Placeholder, withNotices } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import './editor.scss';
import { isEqual } from 'lodash';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import metadata from './block.json';
import NextdoorControls from './controls';
import { parseUrl } from './utils';

const icon = getBlockIconComponent( metadata );

export function NextdoorEdit( {
	attributes,
	className,
	name,
	noticeOperations,
	noticeUI,
	setAttributes,
} ) {
	const defaultClassName = getBlockDefaultClassName( name );
	const validatedAttributes = getValidatedAttributes( metadata.attributes, attributes );

	if ( ! isEqual( validatedAttributes, attributes ) ) {
		setAttributes( validatedAttributes );
	}

	const { url } = validatedAttributes;
	const [ iframeUrl, setIframeUrl ] = useState( url ? parseUrl( url ) : null );

	const [ nextdoorShareUrl, setNextdoorShareUrl ] = useState( iframeUrl );

	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			__(
				"Your Nextdoor post couldn't be embedded. Please double check your URL or code.",
				'jetpack'
			)
		);
	};

	const onFormSubmit = event => {
		if ( ! event ) {
			setIframeUrl( null );
			setErrorNotice();
			return;
		}
		event.preventDefault();

		if ( ! nextdoorShareUrl ) {
			setIframeUrl( null );
			setErrorNotice();
			return;
		}

		const embedUrl = parseUrl( nextdoorShareUrl );

		if ( ! embedUrl ) {
			setIframeUrl( null );
			setErrorNotice();
			return;
		}

		setIframeUrl( embedUrl );
		setAttributes( { url: embedUrl } );
	};

	const blockPlaceholder = (
		<Placeholder
			label={ __( 'Nextdoor', 'jetpack' ) }
			instructions={ __( 'Enter the URL of your Nextdoor post to share below.', 'jetpack' ) }
			icon={ icon }
			notices={ noticeUI }
		>
			<form onSubmit={ onFormSubmit }>
				<input
					type="text"
					id="nextdoorShareUrl"
					onChange={ event => setNextdoorShareUrl( event.target.value ) }
					placeholder={ __( 'Nextdoor post URL', 'jetpack' ) }
					value={ nextdoorShareUrl || '' }
					className="components-placeholder__input"
				/>
				<div>
					<Button variant="secondary" type="submit">
						{ _x( 'Embed', 'button label', 'jetpack' ) }
					</Button>
				</div>
			</form>
		</Placeholder>
	);

	const blockPreview = () => {
		return (
			<>
				<div className={ `${ defaultClassName }-overlay` }></div>
				<iframe width="100%" height="200" frameBorder="0" src={ iframeUrl } title="Nextdoor" />
			</>
		);
	};

	return (
		<div className={ className }>
			<NextdoorControls
				{ ...{ defaultClassName, nextdoorShareUrl, onFormSubmit, setNextdoorShareUrl } }
			/>
			{ iframeUrl ? blockPreview() : blockPlaceholder }
		</div>
	);
}

export default withNotices( NextdoorEdit );

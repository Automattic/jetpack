/* eslint-disable wpcalypso/import-docblock */
/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	Dashicon,
	ExternalLink,
	PanelBody,
	Placeholder,
	RangeControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function InstagramGalleryEdit( props ) {
	const { attributes, className, setAttributes } = props;
	const { columns, photosPadding, photosToShow } = attributes;

	return (
		<div className={ className }>
			<Placeholder icon="instagram" label={ __( 'Instagram Gallery', 'jetpack' ) }>
				<Button isLarge isPrimary>
					{ __( 'Connect your Instagram account', 'jetpack' ) }
				</Button>
			</Placeholder>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<p>
						Account: <ExternalLink href="#">@test</ExternalLink>
						<br />
						<Button isDestructive isLink>
							Disconnect your account <Dashicon icon="arrow-right-alt" size={ 13 } />
						</Button>
					</p>
					<RangeControl
						label={ __( 'Number of Posts', 'jetpack' ) }
						value={ photosToShow }
						onChange={ value => setAttributes( { photosToShow: value } ) }
						min={ 1 }
						max={ 30 }
					/>
					<RangeControl
						label={ __( 'Number of Columns', 'jetpack' ) }
						value={ columns }
						onChange={ value => setAttributes( { columns: value } ) }
						min={ 1 }
						max={ 6 }
					/>
					<RangeControl
						label={ __( 'Padding Between Posts (in pixel)', 'jetpack' ) }
						value={ photosPadding }
						onChange={ value => setAttributes( { photosPadding: value } ) }
						min={ 1 }
						max={ 50 }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}

import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { Fragment, useEffect } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Embed from './embed';
import { GOOGLE_DOCUMENT, GOOGLE_SPREADSHEET, GOOGLE_SLIDE } from '.';

/**
 * Edit component.
 * See https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-edit-save/#edit
 *
 * @param {object}   props                  - The block props.
 * @param {object}   props.attributes       - Block attributes.
 * @param {string}   props.attributes.title - Custom title to be displayed.
 * @param {string}   props.className        - Class name for the block.
 * @param {Function} props.setAttributes    - Sets the value for block attributes.
 * @returns {Function} Render the edit screen
 */
const GsuiteBlockEdit = props => {
	const {
		attributes: { aspectRatio },
		attributes: { variation },
		attributes: { url },
		setAttributes,
	} = props;

	let icon = '';
	let title = '';
	let patterns = [];
	let type = '';

	useEffect( () => {
		/**
		 * Parse the URL to detect the variation type.
		 *
		 * @returns {string} The variation.
		 */
		const detectVariation = () => {
			const regex = /^(http|https):\/\/(docs\.google\.com)\/(.*)\/d\//;
			const matches = url.match( regex );

			switch ( matches[ 3 ] ) {
				case 'document':
					return 'google-docs';

				case 'spreadsheets':
					return 'google-sheets';

				case 'presentation':
					return 'google-slides';
			}

			return '';
		};

		if ( ! variation ) {
			setAttributes( { variation: detectVariation() } );
		}
	}, [ variation, url, setAttributes ] );

	switch ( variation ) {
		case 'google-docs':
			icon = GOOGLE_DOCUMENT.icon;
			title = GOOGLE_DOCUMENT.title;
			patterns = GOOGLE_DOCUMENT.patterns;
			type = GOOGLE_DOCUMENT.type;
			break;

		case 'google-sheets':
			icon = GOOGLE_SPREADSHEET.icon;
			title = GOOGLE_SPREADSHEET.title;
			patterns = GOOGLE_SPREADSHEET.patterns;
			type = GOOGLE_SPREADSHEET.type;
			break;

		case 'google-slides':
			icon = GOOGLE_SLIDE.icon;
			title = GOOGLE_SLIDE.title;
			patterns = GOOGLE_SLIDE.patterns;
			type = GOOGLE_SLIDE.type;
			break;
	}

	/**
	 * Convert GSuite URL to a preview URL.
	 *
	 * @returns {string} The URL pattern.
	 */
	const mapGSuiteURL = () => {
		/**
		 * If the block is not the expected one, return the
		 * original URL as is.
		 */
		if ( [] === patterns[ 0 ] || '' === type ) {
			return url;
		}

		/**
		 * Check if the URL is valid.
		 *
		 * If not, return the original URL as is.
		 */
		const matches = url.match( patterns[ 0 ] );
		if (
			null === matches ||
			'undefined' === typeof matches[ 1 ] ||
			'undefined' === typeof matches[ 2 ] ||
			'undefined' === typeof matches[ 3 ]
		) {
			return url;
		}

		return `${ matches[ 1 ] }://${ matches[ 2 ] }/${ type }/d/${ matches[ 3 ] }/preview`;
	};

	const aspectRatios = [
		{ label: 'Default', value: '' },
		{ label: '100% - Show the whole document', value: 'ar-100' },
		{ label: '50% - Show half of the document', value: 'ar-50' },
	];

	return (
		<>
			<Fragment>
				<Embed
					icon={ icon.src }
					instructions={
						<p>
							{ __( 'Copy and paste your document link below.', 'jetpack' ) }
							<br />
							{ __(
								'If your document is private, only readers logged into a Google account with shared access to the document may view it.',
								'jetpack'
							) }
						</p>
					}
					label={ title }
					patterns={ patterns }
					placeholder={ _x( 'Enter the link here…', 'Embed block placeholder', 'jetpack' ) }
					mapUrl={ mapGSuiteURL }
					mismatchErrorMessage={ __(
						'The document couldn’t be embedded. To embed a document, use the link in your browser address bar when editing the document.',
						'jetpack'
					) }
					checkGoogleDocVisibility={ true }
					{ ...props }
				/>
			</Fragment>
			<Fragment>
				<InspectorControls>
					<PanelBody>
						<p>
							{ __(
								'Select a different aspect-ratio to show more (or less) of your embedded document.',
								'jetpack'
							) }
						</p>
						<SelectControl
							label={ __( 'Aspect Ratio', 'jetpack' ) }
							value={ aspectRatio }
							options={ aspectRatios }
							onChange={ value => setAttributes( { aspectRatio: value } ) }
						/>
					</PanelBody>
				</InspectorControls>
			</Fragment>
		</>
	);
};
export default GsuiteBlockEdit;

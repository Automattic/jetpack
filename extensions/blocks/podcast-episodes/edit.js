/* eslint-disable no-unused-vars */

/**
 * External dependencies
 */
import { Component } from '@wordpress/element';
import {
	Button,
	Disabled,
	ExternalLink,
	PanelBody,
	Placeholder,
	RangeControl,
	TextControl,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BlockControls, BlockIcon, InspectorControls } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';

/**
 * Internal dependencies
 */
import './editor.scss';
import { edit, queueMusic } from './icons/';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 10;

class PodcastEpisodesEdit extends Component {
	constructor() {
		super( ...arguments );
		this.toggleAttribute = this.toggleAttribute.bind( this );
		this.onSubmitURL = this.onSubmitURL.bind( this );
	}

	toggleAttribute( propName ) {
		return () => {
			const value = this.props.attributes[ propName ];
			const { setAttributes } = this.props;

			setAttributes( { [ propName ]: ! value } );
		};
	}

	onSubmitURL( event ) {
		event.preventDefault();
	}

	render() {
		const { url, itemsToShow } = this.props.attributes;
		const { attributes, setAttributes } = this.props;

		if ( ! url ) {
			return (
				<Placeholder
					icon={ <BlockIcon icon={ queueMusic } /> }
					label={ __( 'Podcast Episodes', 'jetpack' ) }
					instructions={ __( 'Paste a link to your Podcast RSS feed.', 'jetpack' ) }
				>
					<form onSubmit={ this.onSubmitURL }>
						<TextControl
							placeholder={ __( 'Enter URL here…', 'jetpack' ) }
							value={ url || '' }
							onChange={ value => setAttributes( { url: value } ) }
							className={ 'components-placeholder__input' }
						/>
						<Button isSecondary type="submit">
							{ __( 'Embed', 'jetpack' ) }
						</Button>
					</form>
					<div className="components-placeholder__learn-more">
						<ExternalLink href={ __( 'https://wordpress.org/support/article/embeds/' ) }>
							{ __( 'Learn more about embeds', 'jetpack' ) }
						</ExternalLink>
					</div>
				</Placeholder>
			);
		}

		const toolbarControls = [
			{
				icon: edit,
				title: __( 'Edit Podcast Feed URL', 'jetpack' ),
				onClick: () => this.setState( { editing: true } ),
			},
		];

		const handleSSRError = () => {
			return <p>Failed to load Block</p>;
		};

		const handleSSRLoading = () => {
			return <p>Loading...</p>;
		};

		return (
			<>
				<BlockControls>
					<ToolbarGroup controls={ toolbarControls } />
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Podcast settings', 'jetpack' ) }>
						<RangeControl
							label={ __( 'Number of items', 'jetpack' ) }
							value={ itemsToShow }
							onChange={ value => setAttributes( { itemsToShow: value } ) }
							min={ DEFAULT_MIN_ITEMS }
							max={ DEFAULT_MAX_ITEMS }
							required
						/>
					</PanelBody>
				</InspectorControls>
				<Disabled>
					<ServerSideRender
						block="jetpack/podcast-episodes"
						attributes={ attributes }
						EmptyResponsePlaceholder={ handleSSRError }
						ErrorResponsePlaceholder={ handleSSRError }
						LoadingResponsePlaceholder={ handleSSRLoading }
					/>
				</Disabled>
			</>
		);
	}
}

export default PodcastEpisodesEdit;

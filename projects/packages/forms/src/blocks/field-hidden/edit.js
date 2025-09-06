import { useBlockProps } from '@wordpress/block-editor';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Placeholder,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import { safeDecodeURIComponent } from '@wordpress/url';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down';
import './editor.scss';

export default function HiddenFieldEdit( props ) {
	const { attributes, setAttributes, clientId } = props;
	const blockProps = useBlockProps();
	useFormWrapper( props );

	const { permalink, postId, postSlug, postTitle } = useSelect( select => {
		const post = select( editorStore ).getCurrentPost();

		return {
			permalink: safeDecodeURIComponent( select( editorStore ).getPermalink() ),
			postId: select( editorStore ).getCurrentPostId(),
			postSlug: safeDecodeURIComponent( select( editorStore ).getEditedPostSlug() ),
			postTitle: post.title,
		};
	}, [] );

	const handleLabelChange = label => {
		setAttributes( { label: label } );
	};

	const handleValueChange = value => {
		setAttributes( { default: value } );
	};

	const handleValueSourceChange = valueSource => {
		setAttributes( { valueSource: valueSource } );
	};

	const handleUrlParameterChange = urlParameter => {
		setAttributes( { urlParameter: urlParameter } );
	};

	const onKeyDown = useInsertAfterOnEnterKeyDown( clientId, true );

	return (
		<div { ...blockProps }>
			<Placeholder icon={ unseen } label={ __( 'Hidden field', 'jetpack-forms' ) }>
				<HStack alignment="top" spacing="2" className="jetpack-form-hidden-field-inputs">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						autoComplete="off"
						label={ __( 'Name', 'jetpack-forms' ) }
						onChange={ handleLabelChange }
						onKeyDown={ onKeyDown }
						spellCheck="false"
						value={ attributes.label }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Value source', 'jetpack-forms' ) }
						onChange={ handleValueSourceChange }
						options={ [
							{ label: __( 'Enter manually', 'jetpack-forms' ), value: 'manual' },
							{ label: __( 'Page/post ID', 'jetpack-forms' ), value: 'post_id' },
							{ label: __( 'Page/post link', 'jetpack-forms' ), value: 'permalink' },
							{ label: __( 'Page/post slug', 'jetpack-forms' ), value: 'slug' },
							{ label: __( 'Page/post title', 'jetpack-forms' ), value: 'post_title' },
							{ label: __( 'URL parameter', 'jetpack-forms' ), value: 'url_parameter' },
						] }
						value={ attributes.valueSource }
					/>
					{ attributes.valueSource === 'manual' && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							autoComplete="off"
							label={ __( 'Value', 'jetpack-forms' ) }
							onChange={ handleValueChange }
							onKeyDown={ onKeyDown }
							spellCheck="false"
							value={ attributes.default }
						/>
					) }
					{ attributes.valueSource === 'post_id' && (
						<div className="jetpack-form-hidden-field-fixed-value">
							<Text upperCase>{ __( 'Page/post ID', 'jetpack-forms' ) }</Text>
							<Text variant="muted" as="p" lineHeight={ 3.5 } numberOfLines={ 1 }>
								<code>{ postId }</code>
							</Text>
						</div>
					) }
					{ attributes.valueSource === 'permalink' && (
						<div className="jetpack-form-hidden-field-fixed-value">
							<Text upperCase>{ __( 'Page/post link', 'jetpack-forms' ) }</Text>
							<Text
								variant="muted"
								as="p"
								lineHeight={ 3.5 }
								numberOfLines={ 1 }
								ellipsizeMode="head"
							>
								{ permalink }
							</Text>
						</div>
					) }
					{ attributes.valueSource === 'slug' && (
						<div className="jetpack-form-hidden-field-fixed-value">
							<Text upperCase>{ __( 'Page/post slug', 'jetpack-forms' ) }</Text>
							<Text variant="muted" as="p" lineHeight={ 3.5 } numberOfLines={ 1 }>
								{ postSlug }
							</Text>
						</div>
					) }
					{ attributes.valueSource === 'post_title' && (
						<div className="jetpack-form-hidden-field-fixed-value">
							<Text upperCase>{ __( 'Post title', 'jetpack-forms' ) }</Text>
							<Text variant="muted" as="p" lineHeight={ 3.5 } numberOfLines={ 1 }>
								{ postTitle }
							</Text>
						</div>
					) }
					{ attributes.valueSource === 'url_parameter' && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							autoComplete="off"
							label={ __( 'URL parameter', 'jetpack-forms' ) }
							onChange={ handleUrlParameterChange }
							onKeyDown={ onKeyDown }
							spellCheck="false"
							value={ attributes.urlParameter }
						/>
					) }
				</HStack>
			</Placeholder>
		</div>
	);
}

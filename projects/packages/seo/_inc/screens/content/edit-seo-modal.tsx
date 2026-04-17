/* eslint-disable react/jsx-no-bind */

import {
	Button,
	Modal,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useUpdateSeoPost } from '../../data/use-seo-posts';
import styles from './style.module.scss';
import type { SchemaType, SeoPostItem } from '../../data/content-types';
import type { FC } from 'react';

interface Props {
	item: SeoPostItem;
	onClose: () => void;
}

const schemaOptions: Array< { label: string; value: SchemaType } > = [
	{ label: __( 'Default', 'jetpack-seo' ), value: '' },
	{ label: __( 'Article', 'jetpack-seo' ), value: 'article' },
	{ label: __( 'FAQ', 'jetpack-seo' ), value: 'faq' },
	{ label: __( 'How-to', 'jetpack-seo' ), value: 'howto' },
	{ label: __( 'Local business', 'jetpack-seo' ), value: 'localbusiness' },
	{ label: __( 'Organization', 'jetpack-seo' ), value: 'organization' },
];

const EditSeoModal: FC< Props > = ( { item, onClose } ) => {
	const [ seoTitle, setSeoTitle ] = useState( item.seo_title );
	const [ seoDescription, setSeoDescription ] = useState( item.seo_description );
	const [ schemaType, setSchemaType ] = useState< SchemaType >( item.schema_type );
	const [ noindex, setNoindex ] = useState( item.noindex );

	const mutation = useUpdateSeoPost( item.id );

	const save = () => {
		mutation.mutate(
			{
				seo_title: seoTitle,
				seo_description: seoDescription,
				schema_type: schemaType,
				noindex,
			},
			{ onSuccess: () => onClose() }
		);
	};

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: post title */
				__( 'Edit SEO — %s', 'jetpack-seo' ),
				item.title
			) }
			onRequestClose={ onClose }
			size="medium"
		>
			<div className={ styles.field }>
				<TextControl
					label={ __( 'SEO title', 'jetpack-seo' ) }
					value={ seoTitle }
					onChange={ setSeoTitle }
					help={ __( 'Aim for 30–60 characters.', 'jetpack-seo' ) }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
				<span className={ styles.counter }>
					{ sprintf(
						/* translators: %d: number of characters used in the SEO title field */
						__( '%d characters', 'jetpack-seo' ),
						seoTitle.length
					) }
				</span>
			</div>
			<div className={ styles.field }>
				<TextareaControl
					label={ __( 'SEO description', 'jetpack-seo' ) }
					value={ seoDescription }
					onChange={ setSeoDescription }
					help={ __( 'Aim for 120–160 characters.', 'jetpack-seo' ) }
					rows={ 4 }
					__nextHasNoMarginBottom
				/>
				<span className={ styles.counter }>
					{ sprintf(
						/* translators: %d: number of characters used in the SEO description field */
						__( '%d characters', 'jetpack-seo' ),
						seoDescription.length
					) }
				</span>
			</div>
			<div className={ styles.field }>
				<SelectControl
					label={ __( 'Schema type', 'jetpack-seo' ) }
					value={ schemaType }
					options={ schemaOptions }
					onChange={ value => setSchemaType( value as SchemaType ) }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</div>
			<div className={ styles.field }>
				<ToggleControl
					label={ __( 'Hide from search engines', 'jetpack-seo' ) }
					checked={ noindex }
					onChange={ setNoindex }
					__nextHasNoMarginBottom
				/>
			</div>
			<div className={ styles.modalActions }>
				<Button variant="tertiary" onClick={ onClose } disabled={ mutation.isPending }>
					{ __( 'Cancel', 'jetpack-seo' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ save }
					isBusy={ mutation.isPending }
					disabled={ mutation.isPending }
				>
					{ __( 'Save', 'jetpack-seo' ) }
				</Button>
			</div>
		</Modal>
	);
};

export default EditSeoModal;

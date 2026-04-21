/* eslint-disable jsdoc/require-returns */

/* eslint-disable react/jsx-no-bind */

import {
	Button,
	CheckboxControl,
	Notice,
	SelectControl,
	Spinner,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { useLlmsTxt, useUpdateLlmsTxt } from '../../data/use-discoverability';
import styles from './style.module.scss';
import type { FC } from 'react';

const POST_TYPE_OPTIONS = [
	{ value: 'post', label: __( 'Posts', 'jetpack-seo' ) },
	{ value: 'page', label: __( 'Pages', 'jetpack-seo' ) },
	{ value: 'product', label: __( 'Products', 'jetpack-seo' ) },
];

// @wordpress/ui Select was the first choice here, but its Popup relies on
// @wordpress/theme's private APIs which core's allow-list rejects outside the
// 24 whitelisted core modules. SelectControl from @wordpress/components is the
// stable admin-styled equivalent and matches the Schema type picker elsewhere.
const MAX_ITEMS_PRESETS = [
	{ value: '10', label: '10' },
	{ value: '20', label: '20' },
	{ value: '50', label: '50' },
	{ value: '100', label: '100' },
	{ value: '200', label: '200' },
];

/**
 * llms.txt control card.
 *
 * Free for all plans — the strategic acquisition feature per the PRD.
 * Renders an enable toggle, post-type + max-items controls, a manual
 * override textarea, and a live preview pane.
 */
const LlmsTxtCard: FC = () => {
	const { data, isLoading, isError, error } = useLlmsTxt();
	const mutation = useUpdateLlmsTxt();
	const [ localOverride, setLocalOverride ] = useState< string | null >( null );

	if ( isLoading || ! data ) {
		return <Spinner />;
	}
	if ( isError ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ error?.message ?? __( 'Unable to load llms.txt settings.', 'jetpack-seo' ) }
			</Notice>
		);
	}

	const toggleEnable = ( enabled: boolean ) => {
		mutation.mutate( { enabled } );
	};

	const toggleType = ( type: string, checked: boolean ) => {
		const next = checked
			? Array.from( new Set( [ ...data.config.include_types, type ] ) )
			: data.config.include_types.filter( t => t !== type );
		mutation.mutate( { include_types: next } );
	};

	const onMaxItemsChange = ( value: string ) => {
		const parsed = Number( value );
		if ( Number.isFinite( parsed ) ) {
			mutation.mutate( { max_items: parsed } );
		}
	};

	const saveOverride = () => {
		mutation.mutate(
			{ override: localOverride ?? '' },
			{ onSuccess: () => setLocalOverride( null ) }
		);
	};

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'AI content map', 'jetpack-seo' ) }</Card.Title>
					<Badge intent={ data.enabled ? 'stable' : 'draft' }>
						{ data.enabled ? __( 'Active', 'jetpack-seo' ) : __( 'Inactive', 'jetpack-seo' ) }
					</Badge>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="lg">
					<ToggleControl
						label={ __( 'Generate llms.txt', 'jetpack-seo' ) }
						help={ __(
							'Publishes an auto-curated machine-readable map of your site for AI agents.',
							'jetpack-seo'
						) }
						checked={ data.enabled }
						onChange={ toggleEnable }
						disabled={ mutation.isPending }
						__nextHasNoMarginBottom
					/>

					{ data.enabled && (
						<>
							<div
								className={ styles.checkboxGroup }
								role="group"
								aria-labelledby="jp-seo-llms-content-types"
							>
								<span id="jp-seo-llms-content-types" className={ styles.checkboxGroupLabel }>
									{ __( 'Include content types', 'jetpack-seo' ) }
								</span>
								{ POST_TYPE_OPTIONS.map( option => (
									<CheckboxControl
										key={ option.value }
										label={ option.label }
										checked={ data.config.include_types.includes( option.value ) }
										onChange={ checked => toggleType( option.value, checked ) }
										disabled={ mutation.isPending }
										__nextHasNoMarginBottom
									/>
								) ) }
							</div>

							<SelectControl
								label={ __( 'Maximum items', 'jetpack-seo' ) }
								value={ String( data.config.max_items ) }
								options={ MAX_ITEMS_PRESETS }
								onChange={ onMaxItemsChange }
								disabled={ mutation.isPending }
								__next40pxDefaultSize
								__nextHasNoMarginBottom
							/>

							<TextareaControl
								label={ __( 'Manual override', 'jetpack-seo' ) }
								help={ __( 'Leave blank to use the auto-curated output below.', 'jetpack-seo' ) }
								value={ localOverride ?? data.config.override }
								onChange={ setLocalOverride }
								rows={ 6 }
								__nextHasNoMarginBottom
							/>
							{ localOverride !== null && localOverride !== data.config.override && (
								<Stack direction="row" justify="space-between" align="center" gap="md">
									<Button
										variant="tertiary"
										onClick={ () => setLocalOverride( null ) }
										disabled={ mutation.isPending }
									>
										{ __( 'Discard', 'jetpack-seo' ) }
									</Button>
									<Button
										variant="primary"
										onClick={ saveOverride }
										isBusy={ mutation.isPending }
										disabled={ mutation.isPending }
									>
										{ __( 'Save override', 'jetpack-seo' ) }
									</Button>
								</Stack>
							) }

							<div>
								<strong>{ __( 'Current output', 'jetpack-seo' ) }</strong>
								<pre className={ styles.preview }>{ data.preview }</pre>
							</div>
						</>
					) }
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default LlmsTxtCard;

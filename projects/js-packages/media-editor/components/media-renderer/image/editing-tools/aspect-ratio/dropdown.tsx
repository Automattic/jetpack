/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { check, aspectRatio as aspectRatioIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { presetRatioAsNumber } from './utils.ts';
import type { AspectRatioComponentProps, AspectRatio } from './types.ts';

interface AspectRatioGroupProps {
	aspectRatios: AspectRatio[];
	label?: string;
	onClick: ( item: AspectRatio ) => void;
	value: number;
	selectedAspectRatioSlug: string;
}

/**
 *
 */
function AspectRatioGroup( {
	aspectRatios,
	label,
	onClick,
	selectedAspectRatioSlug,
}: AspectRatioGroupProps ) {
	return (
		<MenuGroup label={ label }>
			{ aspectRatios.map( item => {
				const isSelected = selectedAspectRatioSlug === item.slug;
				return (
					<MenuItem
						key={ item.slug }
						onClick={ () => onClick( item ) }
						role="menuitemradio"
						isSelected={ isSelected }
						icon={ isSelected ? check : undefined }
					>
						{ item.name }
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
}

/**
 * Finds the aspect ratio in the given array of aspect ratios.
 * @param slug   - The slug of the aspect ratio to find.
 * @param ratios - The array of aspect ratios to search through.
 * @return The aspect ratio object if found, otherwise undefined.
 */
function findAspectRatioBySlug( slug: string, ratios: AspectRatio[] ) {
	return ratios.find( ( { slug: ratioSlug } ) => ratioSlug === slug );
}

const EMPTY_ARRAY: AspectRatio[] | [] = [];

/**
 *
 */
export default function AspectRatioDropdown( {
	onChange,
	aspectRatio,
	imageAspectRatios = EMPTY_ARRAY,
	defaultRatios = EMPTY_ARRAY,
	themeRatios = EMPTY_ARRAY,
}: AspectRatioComponentProps ) {
	const defaultAspectRatios = useMemo(
		() => [
			...imageAspectRatios,
			...defaultRatios?.map( presetRatioAsNumber ).filter( ( { ratio } ) => ratio === 1 ),
		],
		[ imageAspectRatios, defaultRatios ]
	);

	const allRatios = useMemo(
		() => [ ...defaultAspectRatios, ...defaultRatios, ...themeRatios ],
		[ defaultAspectRatios, defaultRatios, themeRatios ]
	);

	const landscapeRatios = useMemo(
		() => defaultRatios?.map( presetRatioAsNumber ).filter( ( { ratio } ) => ratio > 1 ),
		[ defaultRatios ]
	);

	const portraitRatios = useMemo(
		() => defaultRatios?.map( presetRatioAsNumber ).filter( ( { ratio } ) => ratio < 1 ),
		[ defaultRatios ]
	);

	const [ aspectRatioName, setAspectRatioName ] = useState< string | undefined >();

	useEffect( () => {
		const name = findAspectRatioBySlug( aspectRatio?.slug, allRatios )?.name;
		setAspectRatioName( name || __( 'Aspect Ratio', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) );
	}, [ aspectRatio?.slug, allRatios ] );

	return (
		<DropdownMenu
			icon={ aspectRatioIcon }
			label={ __( 'Aspect Ratio', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
			popoverProps={ { placement: 'bottom-start' } }
			text={ aspectRatioName }
			toggleProps={ {
				variant: 'secondary',
			} }
		>
			{ ( { onClose } ) => (
				<>
					<AspectRatioGroup
						onClick={ newAspectRatio => {
							onChange( newAspectRatio );
							onClose();
						} }
						value={ aspectRatio?.ratio }
						aspectRatios={ defaultAspectRatios }
						selectedAspectRatioSlug={ aspectRatio?.slug }
					/>
					{ themeRatios?.length > 0 && (
						<AspectRatioGroup
							label={ __( 'Theme', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
							onClick={ newAspectRatio => {
								onChange( newAspectRatio );
								onClose();
							} }
							value={ aspectRatio?.ratio }
							aspectRatios={ themeRatios }
							selectedAspectRatioSlug={ aspectRatio?.slug }
						/>
					) }
					{ landscapeRatios?.length > 0 && (
						<AspectRatioGroup
							label={ __( 'Landscape', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
							onClick={ newAspectRatio => {
								onChange( newAspectRatio );
								onClose();
							} }
							value={ aspectRatio?.ratio }
							aspectRatios={ landscapeRatios }
							selectedAspectRatioSlug={ aspectRatio?.slug }
						/>
					) }
					{ portraitRatios?.length > 0 && (
						<AspectRatioGroup
							label={ __( 'Portrait', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
							onClick={ newAspectRatio => {
								onChange( newAspectRatio );
								onClose();
							} }
							value={ aspectRatio?.ratio }
							aspectRatios={ portraitRatios }
							selectedAspectRatioSlug={ aspectRatio?.slug }
						/>
					) }
				</>
			) }
		</DropdownMenu>
	);
}

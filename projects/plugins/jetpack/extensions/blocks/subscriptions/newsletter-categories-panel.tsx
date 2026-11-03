import { getAdminUrl } from '@automattic/jetpack-script-data';
import {
	Button,
	CheckboxControl,
	ExternalLink,
	Flex,
	PanelBody,
	SearchControl,
	Spinner,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { Notice } from '@wordpress/ui';
import { META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS } from '../../shared/memberships/constants';
import { store as membershipProductsStore } from '../../store/membership-products';
import type { JSX } from 'react';

interface NewsletterCategory {
	id: number;
	name: string;
}

const MIN_CATEGORIES_COUNT_FOR_SEARCH: number = 10;
const MANAGE_CATEGORIES_URL: string = 'admin.php?page=jetpack-newsletter&p=%2F%3Ftab%3Dsettings';

const NewsletterCategoriesPanel = () => {
	const [ search, setSearch ] = useState( '' );
	const { editPost } = useDispatch( editorStore );

	const { isLoading, isEnabled, newsletterCategories, postCategories, isEmailEnabled } = useSelect(
		select => {
			const { getNewsletterCategories, getNewsletterCategoriesEnabled, hasFinishedResolution } =
				select( membershipProductsStore );
			const { getEditedPostAttribute } = select( editorStore );
			const categories: NewsletterCategory[] = getNewsletterCategories();

			return {
				isLoading: ! hasFinishedResolution( 'getNewsletterCategories' ),
				isEnabled: getNewsletterCategoriesEnabled(),
				newsletterCategories: categories ?? [],
				postCategories: ( getEditedPostAttribute( 'categories' ) ?? [] ) as number[],
				isEmailEnabled:
					! getEditedPostAttribute( 'meta' )?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ],
			};
		},
		[]
	);

	const renderContent = () => {
		if ( isLoading ) {
			return (
				<Flex direction="column" align="center">
					<Spinner />
				</Flex>
			);
		}

		if ( ! isEnabled || ! newsletterCategories.length ) {
			return (
				<>
					<p>
						{ __(
							'Let subscribers choose which categories they want by email, instead of getting everything you publish.',
							'jetpack'
						) }
					</p>
					<Button
						variant="secondary"
						href={ getAdminUrl( MANAGE_CATEGORIES_URL ) }
						target="_blank"
						icon={ external }
						iconPosition="right"
						className="jetpack-newsletter-categories-panel__setup-button"
						__next40pxDefaultSize
					>
						{ __( 'Set up newsletter categories', 'jetpack' ) }
					</Button>
				</>
			);
		}

		const hasSelection = newsletterCategories.some( category =>
			postCategories.includes( category.id )
		);
		const showSearch = newsletterCategories.length >= MIN_CATEGORIES_COUNT_FOR_SEARCH;
		const visibleCategories = search
			? newsletterCategories.filter( category =>
					category.name.toLowerCase().includes( search.trim().toLowerCase() )
				)
			: newsletterCategories;

		const toggleCategory = ( categoryId: number, checked: boolean ) => {
			editPost( {
				categories: checked
					? [ ...postCategories, categoryId ]
					: postCategories.filter( id => id !== categoryId ),
			} );
		};

		return (
			<>
				<CategoriesNotice isEmailEnabled={ isEmailEnabled } hasSelection={ hasSelection } />
				<fieldset className="jetpack-newsletter-categories-panel__fieldset">
					<legend className="jetpack-newsletter-categories-panel__legend">
						{ __( 'Select categories for this post', 'jetpack' ) }
					</legend>
					{ showSearch && (
						<SearchControl
							value={ search }
							onChange={ setSearch }
							placeholder={ __( 'Search newsletter categories', 'jetpack' ) }
							__nextHasNoMarginBottom
						/>
					) }
					<div
						className={
							showSearch
								? 'jetpack-newsletter-categories-panel__list is-scrollable'
								: 'jetpack-newsletter-categories-panel__list'
						}
					>
						{ visibleCategories.map( category => (
							<CheckboxControl
								key={ category.id }
								label={ category.name }
								checked={ postCategories.includes( category.id ) }
								disabled={ ! isEmailEnabled }
								onChange={ checked => toggleCategory( category.id, checked ) }
							/>
						) ) }
					</div>
				</fieldset>
				<ExternalLink href={ getAdminUrl( MANAGE_CATEGORIES_URL ) }>
					{ __( 'Manage newsletter categories', 'jetpack' ) }
				</ExternalLink>
			</>
		);
	};

	return (
		<PanelBody
			title={ __( 'Newsletter Categories', 'jetpack' ) }
			className="jetpack-newsletter-categories-panel"
			initialOpen
		>
			{ renderContent() }
		</PanelBody>
	);
};

function CategoriesNotice( {
	isEmailEnabled,
	hasSelection,
}: {
	isEmailEnabled: boolean;
	hasSelection: boolean;
} ): JSX.Element {
	if ( ! isEmailEnabled ) {
		return (
			<Notice.Root intent="neutral" icon={ null }>
				<Notice.Description>
					{ __( 'Categories apply only when this post is emailed to subscribers.', 'jetpack' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	// A ternary between two __() calls gets merged by the minifier and breaks i18n extraction.
	const noticeText = {
		selected: __(
			'Your <strong>All content</strong> subscribers and those who chose these categories will receive this post.',
			'jetpack'
		),
		unselected: __(
			'Only your <strong>All content</strong> subscribers will receive this post — those who only chose a specific category won’t. Select one below to include them.',
			'jetpack'
		),
	};

	return (
		<Notice.Root intent="info" icon={ null }>
			<Notice.Description>
				{ createInterpolateElement( noticeText[ hasSelection ? 'selected' : 'unselected' ], {
					strong: <strong />,
				} ) }
			</Notice.Description>
		</Notice.Root>
	);
}

export default NewsletterCategoriesPanel;

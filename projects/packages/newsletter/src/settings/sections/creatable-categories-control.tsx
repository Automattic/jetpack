/**
 * Creatable categories control (NL-785)
 *
 * A custom DataViews `Edit` control for the newsletter-categories field. It
 * renders a single `FormTokenField` that lets the user both *search* existing
 * categories and *create* a new one from the same input: typing a name that
 * doesn't match an existing category surfaces a "Create ‘…’" row at the bottom
 * of the suggestions. Choosing it (or pressing Enter on a new name) creates the
 * category, adds it to the list without a page refresh, and selects it.
 *
 * This collapses the previous two affordances — a token field for existing
 * categories plus a separate "Add new category" link — into one, removing the
 * ambiguity between "add an existing category" and "create a new one".
 *
 * The model mirrors the WordPress editor's `FlatTermSelector`: the token field
 * works in category-name space (its value and suggestions are names), while the
 * form value stays a list of IDs — names and IDs are translated at the data
 * boundary. The "create" row is a sentinel-prefixed suggestion, told apart from
 * a real category by value (not its translated label) and rendered as
 * "Create ‘…’" via `displayTransform`.
 */

import { FormTokenField, Icon } from '@wordpress/components';
import { createContext, useCallback, useContext, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
// `error` is the triangle-exclamation the design system (and @wordpress/components'
// own validity indicator) uses for form-validation errors.
import { error as errorIcon } from '@wordpress/icons';
import { createCategory } from '../api';
import type { NewsletterSettings, WordPressCategory } from '../types';

/**
 * Sentinel prefixing the "create" suggestion's value. Lets us distinguish the
 * create row from a real category by value rather than by its (translated)
 * label, and is vanishingly unlikely to collide with a real name. Built from a
 * private-use code point via `String.fromCodePoint` so no invisible source
 * character can be silently normalized away by an editor or formatter.
 */
const CREATE_PREFIX = String.fromCodePoint( 0xf8ff ) + 'create:';

interface CategoryElement {
	value: string;
	label: string;
}

/**
 * Extra wiring the control needs from the section, provided via context so the
 * control component keeps a stable identity across the section's re-renders
 * (a new `Edit` component identity would remount the field and drop focus).
 */
export interface CreatableCategoryContextValue {
	/** Append a freshly created category to the section's list (deduped). */
	appendCategory: ( category: WordPressCategory ) => void;
	/** Surface (or clear) an inline error message for a failed creation. */
	onError: ( message: string | null ) => void;
	/** Notify the section that a category was created (for analytics). */
	onCreated: () => void;
}

export const CreatableCategoryContext = createContext< CreatableCategoryContextValue | null >(
	null
);

/**
 * Map a category-creation error to a short, translated message.
 *
 * `createCategory` uses `/wp/v2/categories`, whose duplicate rejection is the
 * standard WP-REST `{ code: 'term_exists', … }` on both self-hosted and
 * WordPress.com Simple sites. Anything else gets a friendly generic message
 * rather than the raw, English-only server text.
 *
 * @param err - The rejection thrown by `createCategory`.
 * @return A translated, user-facing error message.
 */
export function mapCreateCategoryError( err: unknown ): string {
	const isDuplicate = ( err as { code?: string | number } )?.code === 'term_exists';

	// Assign each translated string to its own variable rather than branching a
	// single ternary between two `__()` calls: production minification hoists the
	// shared `__( …, 'jetpack-newsletter' )` wrapper out of the conditional,
	// leaving a non-literal msgid that fails the i18n string check.
	const duplicateMessage = __( 'This category already exists.', 'jetpack-newsletter' );
	const genericMessage = __(
		'Could not create the category. Please try again.',
		'jetpack-newsletter'
	);
	return isDuplicate ? duplicateMessage : genericMessage;
}

/**
 * The `field` shape DataViews passes to a custom `Edit` control. The precise
 * `NormalizedField` type isn't exported by `@wordpress/dataviews`, so we type
 * only the members this control uses.
 */
interface NormalizedCategoryField {
	label: string;
	description?: string;
	elements?: CategoryElement[];
	getValue: ( args: { item: NewsletterSettings } ) => string[] | undefined;
	setValue: ( args: {
		item: NewsletterSettings;
		value: string[];
	} ) => Partial< NewsletterSettings >;
	isDisabled?: ( args: { item: NewsletterSettings; field: unknown } ) => boolean;
}

/** Subset of DataViews' `FieldValidity` this control renders. */
interface CategoryFieldValidity {
	custom?: { type?: string; message?: string };
}

export interface CreatableCategoriesControlProps {
	data: NewsletterSettings;
	field: NormalizedCategoryField;
	onChange: ( value: Partial< NewsletterSettings > ) => void;
	hideLabelFromVision?: boolean;
	validity?: CategoryFieldValidity;
}

/**
 * Deduplicate an array of IDs, preserving order.
 *
 * @param ids - The IDs to dedupe.
 * @return The IDs with duplicates removed.
 */
function uniqueIds( ids: string[] ): string[] {
	return Array.from( new Set( ids ) );
}

/**
 * The combined search-and-create categories control.
 *
 * @param props                     - DataViews control props.
 * @param props.data                - The form item being edited.
 * @param props.field               - The normalized categories field.
 * @param props.onChange            - Called with the field's partial update.
 * @param props.hideLabelFromVision - Whether to visually hide the field label.
 * @param props.validity            - Validity state for the field, if any.
 * @return The rendered `FormTokenField`.
 */
export function CreatableCategoriesControl( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: CreatableCategoriesControlProps ): JSX.Element {
	const context = useContext( CreatableCategoryContext );
	const [ search, setSearch ] = useState( '' );
	const [ isCreating, setIsCreating ] = useState( false );

	// `field.elements` is a fresh array each render; memoize a stable reference so
	// the callbacks below don't rebuild on every render.
	const elements = useMemo( () => field.elements ?? [], [ field.elements ] );
	// Memoize on the raw form value so `selectedIds` is stable across renders
	// unless the selection actually changes (it feeds `onChangeTokens`' deps).
	const rawSelectedIds = field.getValue( { item: data } );
	const selectedIds = useMemo( () => rawSelectedIds ?? [], [ rawSelectedIds ] );
	const disabled = field.isDisabled?.( { item: data, field } ) ?? false;

	// Work in category-name space (like the editor's FlatTermSelector): the token
	// field matches typed text against the visible names, so we drive it with
	// names and translate names ↔ IDs at the form-data boundary. (FormTokenField
	// filters suggestions by their raw value, so name-valued suggestions are what
	// make search-by-typing work.)
	const idToName = useMemo(
		() => new Map( elements.map( element => [ element.value, element.label ] as const ) ),
		[ elements ]
	);
	const nameToId = useMemo(
		() =>
			new Map( elements.map( element => [ element.label.toLowerCase(), element.value ] as const ) ),
		[ elements ]
	);
	const selectedNames = selectedIds.map( id => idToName.get( id ) ?? id );

	const trimmed = search.trim();
	const hasExactMatch = nameToId.has( trimmed.toLowerCase() );

	// Existing category names plus, when the query names something new, a trailing
	// "create" row (sentinel-encoded so it's told apart from a real name).
	const suggestions = [
		...elements.map( element => element.label ),
		...( trimmed && ! hasExactMatch ? [ CREATE_PREFIX + trimmed ] : [] ),
	];

	const commit = useCallback(
		( ids: string[] ) => {
			onChange( field.setValue( { item: data, value: uniqueIds( ids ) } ) );
		},
		[ onChange, field, data ]
	);

	const handleCreate = useCallback(
		( names: string[], keepIds: string[] ) => {
			// A single change can carry more than one new name (e.g. a
			// comma-separated paste), so create them all rather than dropping the
			// extras. Trim, drop blanks, and de-dupe first.
			const toCreate = Array.from( new Set( names.map( name => name.trim() ).filter( Boolean ) ) );
			if ( ! toCreate.length || isCreating || ! context ) {
				return;
			}

			context.onError( null );
			setIsCreating( true );

			Promise.all( toCreate.map( name => createCategory( name ) ) )
				.then( created => {
					const createdIds = created.map( category => {
						const id = String( category.id );
						// Add to the section's list so it renders as a token without a
						// page refresh, and record the creation.
						context.appendCategory( { id, name: category.name } );
						context.onCreated();
						return id;
					} );
					// Select the new categories alongside the existing choices.
					commit( [ ...keepIds, ...createdIds ] );
				} )
				.catch( ( err: unknown ) => {
					context.onError( mapCreateCategoryError( err ) );
				} )
				.finally( () => {
					setIsCreating( false );
					setSearch( '' );
				} );
		},
		[ isCreating, context, commit ]
	);

	const displayTransform = useCallback( ( token: string ): string => {
		if ( token.startsWith( CREATE_PREFIX ) ) {
			return sprintf(
				// translators: %s: the category name the user typed.
				__( 'Create “%s”', 'jetpack-newsletter' ),
				token.slice( CREATE_PREFIX.length )
			);
		}
		// Tokens are already category names.
		return token;
	}, [] );

	const onChangeTokens = useCallback(
		( tokens: Array< string | { value: string } > ) => {
			const names = tokens.map( token =>
				typeof token === 'object' && token && 'value' in token ? token.value : token
			) as string[];

			// A selected ID that isn't in `elements` (a deleted category, or one not
			// yet loaded) renders as its raw ID. Keep such tokens as-is on change
			// rather than mistaking an unresolved existing selection for a new name
			// to create — otherwise touching the field would spawn a category named
			// after the ID and drop the real selection.
			const selectedIdSet = new Set( selectedIds );
			const createNames: string[] = [];
			const keepIds: string[] = [];

			for ( const token of names ) {
				if ( token.startsWith( CREATE_PREFIX ) ) {
					// The explicit "Create ‘…’" row.
					createNames.push( token.slice( CREATE_PREFIX.length ) );
					continue;
				}
				const id =
					nameToId.get( token.toLowerCase() ) ?? ( selectedIdSet.has( token ) ? token : undefined );
				if ( id ) {
					keepIds.push( id );
				} else {
					// A genuinely new, free-typed name (e.g. Enter without the Create row).
					createNames.push( token );
				}
			}

			if ( createNames.length ) {
				handleCreate( createNames, keepIds );
				return;
			}

			commit( keepIds );
			setSearch( '' );
		},
		[ nameToId, selectedIds, handleCreate, commit ]
	);

	// Clear a prior creation error (e.g. "This category already exists.") as soon
	// as the user edits the name, rather than leaving it up until the next submit.
	const handleInputChange = useCallback(
		( value: string ) => {
			setSearch( value );
			context?.onError( null );
		},
		[ context ]
	);

	// DataViews delegates validity display to the control. Surface the field's
	// custom rule ("select at least one category") beneath the token field.
	const validationMessage = validity?.custom?.message;

	return (
		<div className="newsletter-categories-control">
			<FormTokenField
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ hideLabelFromVision ? undefined : field.label }
				value={ selectedNames }
				suggestions={ suggestions }
				displayTransform={ displayTransform }
				onChange={ onChangeTokens }
				onInputChange={ handleInputChange }
				placeholder={ __( 'Search or create a category', 'jetpack-newsletter' ) }
				disabled={ disabled || isCreating }
				__experimentalExpandOnFocus={ elements.length > 0 }
				// The placeholder and the "Create ‘…’" row already convey the
				// interaction; drop the default "Separate with commas…" hint.
				__experimentalShowHowTo={ false }
			/>
			{ field.description && (
				<p className="newsletter-categories-control__help">{ field.description }</p>
			) }
			{ validationMessage && (
				<p className="newsletter-categories-control__error" aria-live="polite">
					<Icon icon={ errorIcon } size={ 20 } />
					<span>{ validationMessage }</span>
				</p>
			) }
		</div>
	);
}

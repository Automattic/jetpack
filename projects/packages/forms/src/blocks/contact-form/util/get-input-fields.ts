import { childBlocks } from '../child-blocks.js';

type BlockLike = {
	name?: string;
	clientId?: string;
	attributes?: Record< string, unknown >;
	innerBlocks?: BlockLike[];
};

/**
 * Determine whether a block is an input the visitor can be asked to fill in.
 *
 * Hidden fields and implicit consent checkboxes carry a `required` attribute but
 * are never something a visitor answers, so they don't count.
 *
 * @param {string} fullName - Fully qualified block name, e.g. `jetpack/field-email`.
 * @return {boolean} True when the block is a visitor-facing input.
 */
export const isInputWithRequiredField = ( fullName?: string ): boolean => {
	if ( ! fullName || ! fullName.startsWith( 'jetpack/' ) ) return false;
	const baseName = fullName.slice( 'jetpack/'.length );
	const field = childBlocks.find( block => block.name === baseName );
	// @ts-expect-error: childBlocks are defined in JS without explicit types.
	// TS is inferring the type wrong. Fix is to update childBlocks to TS with types.
	const hasRequired = !! field && field?.settings?.attributes?.required !== undefined;
	const isHidden = field?.name === 'field-hidden';
	const isImplicitConsent =
		field?.name === 'field-consent' &&
		// @ts-expect-error: childBlocks are defined in JS without explicit types.
		// TS is inferring the type wrong. Fix is to update childBlocks to TS with types.
		field?.settings?.attributes?.consentType !== 'explicit';
	return hasRequired && ! isHidden && ! isImplicitConsent;
};

/**
 * Collect the visitor-facing input fields anywhere inside a form.
 *
 * Recurses, because a multi-step form keeps its fields inside step blocks rather
 * than directly under the form.
 *
 * @param {Array} blocks - Blocks to search, typically a form's inner blocks.
 * @return {Array} Every input block found, in document order.
 */
export const getInputFields = ( blocks: BlockLike[] = [] ): BlockLike[] => {
	const inputFields: BlockLike[] = [];

	const findInputFields = ( blockList: BlockLike[] ) => {
		blockList.forEach( block => {
			if ( isInputWithRequiredField( block.name ) ) {
				inputFields.push( block );
			}
			if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
				findInputFields( block.innerBlocks );
			}
		} );
	};

	findInputFields( blocks );
	return inputFields;
};

export default getInputFields;

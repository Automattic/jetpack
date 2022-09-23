<script>
	import { onMount } from 'svelte';
	import { copyDomTemplate } from '../utils/copy-dom-template';
	import { parsePseudoHTML } from '../utils/parse-pseudo-html';

	/**
	 * String template to display in this component. <pseudo-html/> tags will
	 * be replaced with the relevant value specified in vars, preserving content
	 *
	 * @member {string} template
	 */
	export let template;

	/**
	 * Template vars to replace in the template. Each key corresponds to a
	 * <pseudo-html /> tag name to replace, each value should be an array with
	 * two entries; the HTML tag type, and an object full of attributes.
	 *
	 * @member {TemplateVars} vars
	 */
	export let vars;

	let span;

	onMount( () => {
		// Copy template to span, substituting vars.
		copyDomTemplate( parsePseudoHTML( template ), span, vars );
	} );
</script>

<span bind:this={span} />

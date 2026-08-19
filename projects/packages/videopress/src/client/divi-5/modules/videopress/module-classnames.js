/**
 * Class name output for the Divi 5 VideoPress module.
 */
const { elementClassnames } = window?.divi?.module ?? {};

/**
 * Adds the module's decoration class names.
 *
 * @param {object} props                    - Class name props supplied by Divi.
 * @param {object} props.classnamesInstance - The mutable class name instance.
 * @param {object} props.attrs              - The module attributes.
 * @return {void}
 */
export const moduleClassnames = ( { classnamesInstance, attrs } ) => {
	classnamesInstance.add(
		elementClassnames( {
			attrs: attrs?.module?.decoration ?? {},
		} )
	);
};

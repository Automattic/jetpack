export const escapeRegExp = string => {
	return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
};

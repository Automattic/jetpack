/**
 * Hide visx's text-measurement node from Testing Library's text queries.
 *
 * `@visx/text`'s getStringWidth measures by parking the string in a shared,
 * offscreen <text> node on document.body and leaving it there. Whatever the
 * axis measured last therefore answers `getByText` a second time — an axis
 * label measured for the chart margin collides with the tick that renders it.
 */

const { configure } = require( '@testing-library/react' );

configure( { defaultIgnore: 'script, style, #__react_svg_text_measurement_id' } );

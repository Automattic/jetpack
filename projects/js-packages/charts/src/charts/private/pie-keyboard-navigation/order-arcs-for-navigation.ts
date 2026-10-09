type AngledArc = { startAngle: number; endAngle: number };

/**
 * Orders arcs the way they appear: clockwise from 12 o'clock, which for a semi-circle is left to right.
 *
 * @param arcs - Arcs from visx's `pie` factory, in data order.
 * @return A copy of `arcs` sorted by angular midpoint.
 */
export const orderArcsForNavigation = < T extends AngledArc >( arcs: T[] ): T[] =>
	[ ...arcs ].sort( ( a, b ) => a.startAngle + a.endAngle - ( b.startAngle + b.endAngle ) );

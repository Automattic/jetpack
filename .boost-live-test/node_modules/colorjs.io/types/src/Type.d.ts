export default class Type {
    static get(type: any, coordMeta: any): Type;
    /**
     * @param {any} type
     * @param {import("./types.js").CoordMeta} coordMeta
     */
    constructor(type: any, coordMeta: import("./types.js").CoordMeta);
    type: string;
    coordMeta: any;
    coordRange: [number, number];
    /** @type {[number, number]} */
    range: [number, number];
    /** @returns {[number, number]} */
    get computedRange(): [number, number];
    get unit(): "" | "%" | "deg";
    /**
     * Map a number to the internal representation
     * @param {number} number
     */
    resolve(number: number): number;
    /**
     * Serialize a number from the internal representation to a string
     * @param {number} number
     * @param {number} [precision]
     */
    serialize(number: number, precision?: number): string;
    toString(): string;
    /**
     * Returns a percentage range for values of this type
     * @param {number} scale
     * @returns {[number, number]}
     */
    percentageRange(scale?: number): [number, number];
}
//# sourceMappingURL=Type.d.ts.map
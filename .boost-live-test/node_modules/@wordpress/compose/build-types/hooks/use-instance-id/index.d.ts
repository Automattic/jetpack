/**
 * Specify the useInstanceId *function* signatures.
 *
 * More accurately, useInstanceId distinguishes between three different
 * signatures:
 *
 * 1. When only object is given, the returned value is a number
 * 2. When object and prefix is given, the returned value is a string
 * 3. When preferredId is given, the returned value is the type of preferredId
 *
 * @param object Object reference to create an id for.
 */
declare function useInstanceId(object: object): number;
declare function useInstanceId(object: object, prefix: string): string;
declare function useInstanceId<T extends string | number>(object: object, prefix: string, preferredId?: T): T;
export default useInstanceId;
//# sourceMappingURL=index.d.ts.map
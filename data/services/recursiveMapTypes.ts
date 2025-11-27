
/**
 * A mapping type that recursively maps the properties of an object T to another given type P.
 * If T has properties that are not a primitive (so that are object with properties themselves), 
 * it goes deeper into those properties and applies the same mapping until it finds primitives. 
 * 
 * @remarks
 * For each property K in the given type T, check if T[K] (a property K in T) is a primitive: if 
 * property K is a primitive, map that type to the given type P; if property K is an object, go deeper 
 * into that property and recursively apply the same mapping until you find all the primitives.
 * 
 * @template T - The object type whose properties are to be mapped.
 * @template P - The type to which the properties of T are to be mapped.
 */
export type RecursiveMapToType<T, P> = {
    [K in keyof T]: T[K] extends object ? RecursiveMapToType<T[K], P> : P;
}

/**
 * Works like {@link Partial<T>} but it recursively makes all properties of an object T optional. 
 * If T has properties that are not a primitive (so that are object with properties themselves), 
 * it goes deeper into those properties and applies the same mapping until it finds primitives. 
 * 
 * @remarks
 * For each property K in the given type T, check if T[K] (a property K in T) is a primitive: if 
 * property K is a primitive, make K optional; if property K is an object, go deeper 
 * into that property and recursively apply the same mapping until you find all the primitives.
 * 
 * @template T - The object type whose properties are to be made optional.
 */
export type RecursivePartial<T> = {
    [K in keyof T]?: T[K] extends object ? RecursivePartial<T[K]> : T[K];
}



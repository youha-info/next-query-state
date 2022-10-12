/** Next.js router parses query string value as string[] when there are duplicate keys.
 * This function is used to take only the first value in that case,
 * and ensure the value is string or undefined.
 */
export function firstParam(v: string | string[]): string;
export function firstParam(v: string | string[] | undefined): string | undefined;
export function firstParam(v: string | string[] | undefined): string | undefined {
    return Array.isArray(v) ? v[0] : v;
}

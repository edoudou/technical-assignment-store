export const FORBIDDEN_KEYS = [
    "policies", 
    "data",
    "constructor",
    "defaultPolicy",
    "allowedToRead",
    "allowedToWrite",
    "read",
    "write",
    "writeEntries",
    "entries",
];
export const PRIVATE_KEY_MATCHER = /^_/;

export const isForbiddenKey = (key: string): boolean => {
    return FORBIDDEN_KEYS.includes(key) || PRIVATE_KEY_MATCHER.test(key);
}
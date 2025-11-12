import {isPrimitiveValue, JSONArray, JSONObject, JSONPrimitive} from "../json-types";
import {Store} from "../store";

export type StoreResult = Store | JSONPrimitive | undefined;
export const isStore = (value: unknown): value is Store => {
    return value instanceof Store;
}
export const isStoreResult = (value: unknown): value is StoreResult => {
    return (value instanceof Store) || (isPrimitiveValue(value)) || (value === undefined);
}

export type StoreValue =
    | JSONObject
    | JSONArray
    | StoreResult
    | (() => StoreResult);

export const isJSONObject = (value: unknown): value is JSONObject => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const isJSONArray = (value: unknown): value is JSONArray => {
    return Array.isArray(value);
}

export const isStoreValue = (value: unknown): value is StoreValue => {
    return isJSONObject(value) || isJSONArray(value) || isStoreResult(value) || typeof value === "function";
}

export const canGetStoreResultFromStoreValue = (value: StoreValue): value is StoreResult | (() => StoreResult) => {
    return isStoreResult(value) || typeof value === "function";
}

export const getStoreResultFromStoreValue = (value: StoreResult | (() => StoreResult)): StoreResult => {
    if (isStoreResult(value)) {
        return value;
    }
    if (typeof value === "function") {
        return value();
    }
}
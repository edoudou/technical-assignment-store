import {JSONObject} from "./json-types";
import {PATH_SEPARATOR} from "./utils/paths.utils";
import {
    canGetStoreResultFromStoreValue,
    getStoreResultFromStoreValue, isJSONArray, isJSONObject,
    isStore,
    StoreResult,
    StoreValue
} from "./utils/store.utils";
import {isForbiddenKey} from "./utils/forbiddenKeys.utils";

export type Permission = "r" | "w" | "rw" | "none";

export interface IStore {
    defaultPolicy: Permission;

    allowedToRead(key: string): boolean;

    allowedToWrite(key: string): boolean;

    read(path: string): StoreResult;

    write(path: string, value: StoreValue): StoreValue;

    writeEntries(entries: JSONObject): void;

    entries(): JSONObject;
}

export function Restrict<K extends Store>(policy?: Permission): (target: K, propertyKey: string) => void {
    return (target: K, propertyKey: string) => {
        if (!target.policies) {
            target.policies = {};
        }
        target.policies[propertyKey] = policy || target.defaultPolicy;
    };
}

export class Store implements IStore {
    // private data: Record<string StoreValue> = {};
    policies: Record<string, Permission> = {};

    constructor(public defaultPolicy: Permission = "rw") {
        const proto = Object.getPrototypeOf(this) as Store;
        if (proto && proto.policies) {
            this.policies = {...proto.policies} as Record<string, Permission>;
        }
    }

    allowedToRead(key: string): boolean {
        return this._isAllowedToRead(key);
    }

    allowedToWrite(key: string): boolean {
        return this._isAllowedToWrite(key);
    }

    read(path: string): StoreResult {
        if (!this._isAllowedToRead(path)) {
            throw new Error("Permission denied");
        }

        return this._readFromPath(path);
    }

    write(path: string, value: StoreValue): StoreValue {
        if (!this._isAllowedToWrite(path)) {
            throw new Error("Permission denied");
        }
        this._writeToPath(path, value);
        return value;
    }

    writeEntries(entries: JSONObject): void {
        Object.entries(entries).forEach(([key, value]) => {
            this.write(key, value);
        });
    }

    entries(): JSONObject {
        return Object.fromEntries(
            Object.entries(this._getData()).map(([key, value]) => {
                if (!this._isAllowedToRead(key)) {
                    return [key, undefined];
                }
                if (isStore(value)) {
                    return [key, value.entries()]
                } else {
                    return [key, value]
                }
            }).filter(([key, value]) => {
                return Boolean(value);
            }))
    }

    private _isAllowedToRead(path: string): boolean {
        const {
            firstValue,
            remainingPath,
            policy,
        } = this._getInformationFromPath(path);

        if (remainingPath && isStore(firstValue)) {
            return firstValue.allowedToRead(remainingPath);
        }

        return policy === "r" || policy === "rw";
    }

    private _isAllowedToWrite(path: string): boolean {
        const {
            firstValue,
            remainingPath,
            policy,
        } = this._getInformationFromPath(path);

        if (remainingPath && isStore(firstValue)) {
            return firstValue.allowedToWrite(remainingPath);
        }
        return policy === "w" || policy === "rw";
    }

    private _readFromPath(path: string): StoreResult {
        const {
            firstKey,
            firstValue,
            remainingPath,
        } = this._getInformationFromPath(path);

        if (canGetStoreResultFromStoreValue(firstValue)) {
            const storeResult = getStoreResultFromStoreValue(firstValue);
            if (isStore(storeResult) && remainingPath) {
                return storeResult.read(remainingPath);
            }
            return storeResult;
        }

        if (isJSONArray(firstValue)) {
            throw new Error('Array is not implemented');
        }

        if (isJSONObject(firstValue)) {
            // Convert to StoreResult
            const store = new Store(this.defaultPolicy);
            store.writeEntries(firstValue);
            this._setDataKey(firstKey, store);
            return store.read(remainingPath);
        }
    }

    private _writeToPath(path: string, value: StoreValue): void {
        if (isJSONArray(value)) {
            throw new Error('Array is not implemented');
        }
        const {
            firstKey,
            firstValue,
            remainingPath,
            policy
        } = this._getInformationFromPath(path);

        const valueToWrite = this._getValueToWrite(value, policy);

        if (isStore(firstValue)) {
            firstValue.write(remainingPath, valueToWrite);
        } else {
            this._setDataKey(firstKey, valueToWrite);
        }
    }

    private _getValueToWrite(value: StoreValue, defaultPolicy: Permission): StoreValue {
        if (isStore(value)) {
            return value;
        }

        if (isJSONObject(value)) {
            const store = new Store(defaultPolicy);
            store.writeEntries(value);
            return store;
        }
        return value;
    }

    private _getInformationFromPath(path: string) {
        const [firstKey, ...remainingKeys] = path.split(PATH_SEPARATOR);
        const firstValue = this._getData()[firstKey];
        const policy = this.policies[firstKey] || this.defaultPolicy;

        return {
            firstKey,
            firstValue,
            remainingPath: remainingKeys.join(PATH_SEPARATOR),
            policy,
        }
    }

    private _getData(): Record<string, StoreValue> {
        const data = Object.fromEntries(Object.entries(this).filter(([key]) => {
            return !isForbiddenKey(key);
        }));
        return data as Record<string, StoreValue>;
    }

    private _setDataKey(key: string, value: StoreValue): void {
        if(isForbiddenKey(key)) {
            throw new Error("Forbidden key");
        }
        (this as unknown as Record<string, StoreValue>)[key] = value;
    }
}

export type JSONPrimitive = string | number | boolean | null;
export const isPrimitiveValue= (value: unknown): value is JSONPrimitive  => {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null;
}

export type JSONValue = JSONPrimitive | JSONArray | JSONObject;

export interface JSONObject {
  [key: string]: JSONValue;
}

export type JSONArray = JSONValue[];

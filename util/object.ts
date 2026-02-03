import _ from "lodash";

export function deepMerge(objValue, srcValue) {
  if (Array.isArray(objValue) && Array.isArray(srcValue)) {
    const maxLength = Math.max(objValue.length, srcValue.length);
    return Array.from({ length: maxLength }, (__, i) => {
      const val1 = objValue[i];
      const val2 = srcValue[i];

      if (_.isPlainObject(val1) && _.isPlainObject(val2)) {
        return _.mergeWith({}, val1, val2, deepMerge);
      } else if (Array.isArray(val1) && Array.isArray(val2)) {
        return deepMerge(val1, val2);
      } else {
        return val2 !== undefined ? val2 : val1;
      }
    });
  }

  if (Array.isArray(srcValue)) {
    return deepMerge([], srcValue);
  }

  if (_.isPlainObject(srcValue)) {
    return _.mergeWith({}, objValue || {}, srcValue, deepMerge);
  }

  return undefined;
}

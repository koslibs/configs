const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const cloneValue = (value) => {
    if (Array.isArray(value)) {
        return value.map(cloneValue);
    }

    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
        );
    }

    return value;
};

const mergeValue = (target, source) => {
    if (Array.isArray(target) && Array.isArray(source)) {
        return [...target, ...source];
    }

    if (isPlainObject(target) && isPlainObject(source)) {
        const nextValue = { ...target };

        for (const [key, nestedValue] of Object.entries(source)) {
            nextValue[key] =
                key in nextValue
                    ? mergeValue(nextValue[key], nestedValue)
                    : cloneValue(nestedValue);
        }

        return nextValue;
    }

    return cloneValue(source);
};

export const mergeConfig = (...parts) =>
    parts.filter(Boolean).reduce((mergedValue, part) => mergeValue(mergedValue, part), {});

export default mergeConfig;

define([], function() {

function serialize(object, format) {
    if (typeof object === "object" && object != null) {
        if (Array.isArray(object)) {
            // Still need to handle specially, so maps inside are treated right
            return '[' + object.map(serialize).join(',') + ']';
        } else {
            // Sorted key order
            var keys = [];
            if (object.key_order) {
                keys = object.key_order;
            } else {
                for (k in object) {
                    if (object.hasOwnProperty(k)) {
                        keys.push(k);
                    }
                }
                keys.sort()
            }
            var components = [];
            for (k in keys) {
                var key = keys[k];
                var value = serialize(object[key]);
                components.push('"' + key + '":' + value)
            }
            return '{' + components.join(',') + '}';
        }
    } else {
        return JSON.stringify(object);
    }
}

return {
    serialize: serialize
}

});

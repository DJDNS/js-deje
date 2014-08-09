define(['deje/vendor/sha1'], function(jsSHA) {

function serialize(object, format) {
    format = (format === undefined) ? {} : format;
    format.indent = format.indent || '';
    format.prefix = format.prefix || '';
    format.kv_space = format.kv_space || '';
    var ip = format.prefix + format.indent;

    function reserialize(object) {
        return serialize(object, {
            "indent": format.indent,
            "prefix": ip,
            "kv_space": format.kv_space
        })
    }

    if (typeof object === "object" && object != null) {
        if (Array.isArray(object)) {
            if (object.length == 0) {
                return '[]';
            }
            return '[' +
                ip + object.map(reserialize).join(',' + ip) +
                format.prefix + ']';
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
            if (keys.length == 0) {
                return '{}';
            }
            var components = [];
            for (k in keys) {
                var key = keys[k];
                var value = reserialize(object[key]);
                components.push(reserialize(key) + ':' +
                    format.kv_space + value);
            }
            return '{' +
                ip + components.join(',' + ip) +
                format.prefix + '}';
        }
    } else {
        return JSON.stringify(object);
    }
}

function hash(string) {
    return (new jsSHA(string, "TEXT")).getHash("SHA-1", "HEX");
}

return {
    serialize: serialize,
    hash: hash
}

});

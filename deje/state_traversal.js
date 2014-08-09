define([], function() {

function DejeStateTraversal(state, keys) {
    this.state = state;
    this.keys = keys;
    // TODO: this.validate();
}

DejeStateTraversal.prototype.get = function() {
    var current = this.state.content;
    for (var i=0; i<this.keys.length; i++) {
        key = this.keys[i];
        current = current[key];
    }
    return current;
}

DejeStateTraversal.prototype.is_root = function() {
    return this.keys.length == 0;
}

DejeStateTraversal.prototype.get_parent = function() {
    if (this.is_root()) {
        throw "Traversal is root, cannot get parent";
    }
    return this.state.traverse(this.keys.slice(0, -1)).get();
}

DejeStateTraversal.prototype.get_last_key = function() {
    return this.keys[this.keys.length - 1];
}

DejeStateTraversal.prototype.SET = function(value) {
    if (this.is_root()) {
        this.state.content = value;
    } else {
        var parent = this.get_parent();
        var key = this.get_last_key();
        parent[key] = value;
    }
}

DejeStateTraversal.prototype.DELETE = function() {
    if (this.is_root()) {
        throw "Cannot delete root object";
    } else {
        var parent = this.get_parent();
        var key = this.get_last_key();
        if (typeof parent != "object") {
            throw "Cannot delete child of non-container object";
        }
        if (Array.isArray(parent)) {
            parent.splice(key, 1);
        } else {
            delete parent[key];
        }
    }
}

return DejeStateTraversal;

});

define(['deje/utils'], function(DejeUtils) {

function DejeEvent(content) {
    this.handler = content.handler;
    this.parent  = content.parent;
    this.args    = content.args;
}

DejeEvent.prototype.getContent = function() {
    return {
        handler: this.handler,
        parent:  this.parent,
        args:    this.args,
    };
}

DejeEvent.prototype.key_order = ["parent", "handler", "args"];
DejeEvent.prototype.serialize = function(indent) {
    if (indent === undefined) {
        indent = '';
    }
    return DejeUtils.serialize(this, {
        'indent': indent,
        'prefix': (indent === '') ? '' : '\n',
        'kv_space': (indent === '') ? '' : ' '
    });
}

DejeEvent.prototype.getHash = function() {
    // TODO: Memoize
    return DejeUtils.hash(this.serialize());
}

DejeEvent.prototype.apply = function(state) {
    if (this.handler == "SET") {
        state.traverse(this.args.path).SET(this.args.value);
    } else if (this.handler == "DELETE") {
        state.traverse(this.args.path).DELETE();
    } else {
        throw "No custom event support yet";
    }
    state.hash = this.getHash();
}

DejeEvent.prototype.compatibleWith = function(other) {
    // TODO: Actual logic
    return true;
}

return DejeEvent;

});

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

DejeEvent.prototype.serialize = function() {
    var serial = '{"parent":"' + this.parent + '",'
               + '"handler":"' + this.handler + '",'
               + '"args":' + DejeUtils.serialize(this.args) + '}'
               ;
    return serial;
}

DejeEvent.prototype.getHash = function() {
    // TODO: Memoize
    return (new jsSHA(this.serialize(), "TEXT"))
        .getHash("SHA-1", "HEX");
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

return DejeEvent;

});

define(['deje/state_traversal'], function(DejeStateTraversal) {

function DejeState() {
    this.reset();
}

DejeState.prototype.reset = function() {
    this.content = {};
    this.hash = "";
}

DejeState.prototype.traverse = function(keys) {
    return new DejeStateTraversal(this, keys);
}

return DejeState;

});

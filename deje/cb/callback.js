define([], function() {

function DejeCallback(name, callback, enabled) {
    if (arguments.length < 3) {
        enabled = true;
    }

    this.name = name;
    this.callback = callback;
    this.enabled = enabled;
}

DejeCallback.prototype.on = function() {
    this.enabled = true;
}
DejeCallback.prototype.off = function() {
    this.enabled = false;
}

return DejeCallback;

});

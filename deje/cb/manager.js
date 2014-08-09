define(['deje/cb/callback'], function(DC) {

function DejeCallbackManager(context) {
    this.context = context;
    this.callbacks = {};
}
DejeCallbackManager.prototype.add = function(name, callback) {
    var cb = new DC(name, callback);
    this.register(cb);
}
DejeCallbackManager.prototype.register = function(djcb) {
    this.callbacks[djcb.name] = djcb;
}
DejeCallbackManager.prototype.run = function() {
    for (var c in this.callbacks) {
        var djcb = this.callbacks[c];
        if (djcb.enabled) {
            djcb.callback.apply(this.context, arguments);
        }
    }
}

return DejeCallbackManager;

});

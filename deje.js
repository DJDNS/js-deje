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

function DejeCallbackManager(context) {
    this.context = context;
    this.callbacks = {};
}
DejeCallbackManager.prototype.add = function(name, callback) {
    var cb = new DejeCallback(name, callback);
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

function DejeClient(url, topic, options) {
    this.url = url;
    this.topic = topic;
    this.state = new DejeState();
    this.session = undefined;
    this.events = {};
    this.cb_managers = {
        "msg" : new DejeCallbackManager(this),
        "store_event" : new DejeCallbackManager(this),
        "goto_event"  : new DejeCallbackManager(this)
    }

    this.cb_managers.msg.add('log', function(topic, message) {
        this.logger("broadcast: " + JSON.stringify(message));
    });
    this.cb_managers.msg.add('sniff_events',
        this._on_msg_sniff_events.bind(this));

    options = (options != undefined) ? options : {};
    this.logger = options.logger || console.log;
}

DejeClient.prototype.connect = function(){
    window.ab.connect(
        this.url,
        this._on_connect.bind(this),
        this._on_disconnect.bind(this)
    );
}

DejeClient.prototype._on_connect = function(session) {
    this.session = session;
    this.logger("Connected to " + this.url);

    session.subscribe(this.topic, this._on_msg.bind(this));
}

DejeClient.prototype._on_disconnect = function(code, reason, detail) {
    this.logger("Disconnected from " + this.url);
    this.logger("Err code " + code + ": " + reason);
    this.logger(JSON.stringify(detail));
}

DejeClient.prototype._on_msg = function(topic, message) {
    this.cb_managers.msg.run(topic, message);
}
DejeClient.prototype._on_msg_sniff_events = function(topic, message) {
    if (message.type == "01-publish-history") {
        var hist = message.history;
        for (var i=0; i<hist.length; i++) {
            this.storeEvent(new DejeEvent(hist[i]));
        }
    }
}

DejeClient.prototype.publish = function(message) {
    this.session.publish(this.topic, message);
}

DejeClient.prototype.getHistory = function(hash) {
    var events = [];
    var hashes = [];
    for (var k in this.events) {
        hashes.push(k)
    }
    hashes.sort();
    for (var h in hashes) {
        var hash = hashes[h];
        events.push(this.events[hash]);
    }
    return events;
}

DejeClient.prototype.storeEvent = function(ev) {
    hash = ev.getHash();
    this.events[hash] = ev;
    this.cb_managers.store_event.run(ev);
}
DejeClient.prototype.getEvent = function(hash) {
    return this.events[hash];
}
DejeClient.prototype.promoteEvent = function(ev) {
    this.publish({
        "type": "01-publish-history",
        "tip_hash": ev.getHash(),
        "history": this.getHistory(),
    });
}
DejeClient.prototype.applyEvent = function(ev, noreset) {
    if (!noreset) {
        this.state.reset();
    }
    if (ev.parent != "") {
        var parent = this.getEvent(ev.parent)
        if (parent == undefined) {
            return this.logger("No parent " + ev.parent)
        }
        this.applyEvent(parent, true);
    }
    try {
        ev.apply(this.state);
    } catch (e) {
        this.logger(e);
    }
    this.cb_managers.goto_event.run(ev);
}

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
               + '"args":' + JSON.stringify(this.args) + '}'
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
        delete parent[key];
    }
}

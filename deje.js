function DejeClient(url, topic, options) {
    this.url = url;
    this.topic = topic;
    this.session = undefined;
    this.events = {};

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
    // TODO: Appropriate client behavior
    this.logger("broadcast: " + JSON.stringify(message));
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

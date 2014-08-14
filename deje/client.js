define(['deje/cb/manager','deje/event','deje/state', 'deje/vendor/autobahn'],
function(DCM, DejeEvent, DejeState, autobahn) {

function DejeClient(url, topic, options) {
    this.url = url;
    this.topic = topic;
    this.state = new DejeState();
    this.session = undefined;
    this.events = {};
    this.timestamps = [];
    this.cb_managers = {
        "msg" : new DCM(this),
        "send": new DCM(this),
        "connect"     : new DCM(this),
        "disconnect"  : new DCM(this),
        "store_event" : new DCM(this),
        "goto_event"  : new DCM(this),
        "update_ts"   : new DCM(this)
    }

    this.cb_managers.connect.add('log', function() {
        this.logger("Connected to " + this.url);
        this.logger("Subscribed to " + this.topic);
    });
    this.cb_managers.disconnect.add('log', function(code, reason, detail) {
        this.logger("Disconnected from " + this.url);
        this.logger("Err code " + code + ": " + reason);
        this.logger(JSON.stringify(detail));
    });
    this.cb_managers.send.add('log', function(topic, message) {
        this.logger("sent: " + JSON.stringify(message));
    });
    this.cb_managers.msg.add('log', function(topic, message) {
        this.logger("rcvd: " + JSON.stringify(message));
    });
    this.cb_managers.msg.add('sniff_events',
        this._on_msg_sniff_events.bind(this));
    this.cb_managers.msg.add('publish_events',
        this._on_msg_publish_events.bind(this));
    this.cb_managers.msg.add('sniff_ts',
        this._on_msg_sniff_ts.bind(this));
    this.cb_managers.msg.add('publish_ts',
        this._on_msg_publish_ts.bind(this));

    options = (options != undefined) ? options : {};
    this.logger = options.logger || console.log;
}

DejeClient.prototype.connect = function(){
    autobahn.connect(
        this.url,
        this._on_connect.bind(this),
        this._on_disconnect.bind(this)
    );
}

DejeClient.prototype._on_connect = function(session) {
    this.session = session;
    session.subscribe(this.topic, this._on_msg.bind(this));

    this.cb_managers.connect.run();
}

DejeClient.prototype._on_disconnect = function(code, reason, detail) {
    this.cb_managers.disconnect.run(code, reason, detail);
}

DejeClient.prototype._on_msg = function(topic, message) {
    this.cb_managers.msg.run(topic, message);
}
DejeClient.prototype._on_msg_sniff_events = function(topic, message) {
    var events;
    if (message.type == "02-publish-events") {
        events = message.events;
    }

    if (events != undefined) {
        for (var i=0; i<events.length; i++) {
            this.storeEvent(new DejeEvent(events[i]));
        }
    }
}
DejeClient.prototype._on_msg_publish_events = function(topic, message) {
    if (message.type != "02-request-events") {
        return
    }
    this.publish({
        "type": "02-publish-events",
        "events": this.sortEventHashes(this.events),
    });
}
DejeClient.prototype._on_msg_sniff_ts = function(topic, message) {
    if (message.type == "02-publish-timestamps") {
        this.setTimestamps(message.timestamps);
    }
}
DejeClient.prototype._on_msg_publish_ts = function(topic, message) {
    if (message.type == "02-request-timestamps") {
        this.publishTimestamps()
    }
}

DejeClient.prototype.setTimestamps = function(timestamps) {
    // TODO: validate
    this.timestamps = timestamps;
    this.cb_managers.update_ts.run(timestamps);
}

DejeClient.prototype.publish = function(message) {
    // Final argument is excludeMe
    this.session.publish(this.topic, message, true);
    this.cb_managers.send.run(this.topic, message);
}

DejeClient.prototype.sortEventHashes = function(events_map) {
    var events_array = [];
    var hashes = [];
    for (var k in events_map) {
        hashes.push(k)
    }
    hashes.sort();
    for (var h in hashes) {
        var hash = hashes[h];
        events_array.push(events_map[hash]);
    }
    return events_array;
}
DejeClient.prototype.getHistory = function(hash) {
    // TODO: do this more selectively
    return this.sortEventHashes(this.events);
}

DejeClient.prototype.publishTimestamps = function() {
    this.publish({
        "type": "02-publish-timestamps",
        "timestamps": this.timestamps
    });
}

DejeClient.prototype.navigateTimestamps = function() {
    var current = undefined;
    var ev = undefined;
    for (var i=0; i<this.timestamps.length; i++) {
        try {
            ev = this.getEvent(this.timestamps[i]);
            if (!ev.compatibleWith(current)) {
                throw "Not compatible with current event";
            }
            this.applyEvent(ev);
            ev = current;
        } catch(e) {
            this.logger("Iteration " + i + ": " + e);
        }
    }
}

DejeClient.prototype.storeEvent = function(ev) {
    hash = ev.getHash();
    this.events[hash] = ev;
    this.cb_managers.store_event.run(ev);
}
DejeClient.prototype.getEvent = function(hash) {
    if (this.events[hash] == undefined) {
        throw "No such event " + hash;
    }
    return this.events[hash];
}
DejeClient.prototype.promoteEvent = function(ev) {
    this.setTimestamps(this.timestamps.concat([ ev.getHash() ]));
    this.publishTimestamps();
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

return DejeClient;

});


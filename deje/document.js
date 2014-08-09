define(['deje/utils','deje/event'], function(DejeUtils, Event) {

function DejeDocument(content) {
    this.topic      = content.topic;
    this.events     = content.events;
    this.quorums    = content.quorums;
    this.timestamps = content.timestamps;

    for (var i=0; i<this.events.length; i++) {
        this.events[i] = new Event(this.events[i]);
    }
}

DejeDocument.prototype.serialize = function(indent) {
    return DejeUtils.serialize(this, {
        "keys": ["topic", "events", "quorums", "timestamps"],
        "indent": indent,
        "prefix": ""
    });
}

return DejeDocument;

});

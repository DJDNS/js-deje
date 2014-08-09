define(['deje/utils','deje/event'], function(DejeUtils, Event) {

function DejeDocument(content) {
    this.topic      = content.topic;
    this.events     = content.events;
    this.quorums    = content.quorums;
    this.timestamps = content.timestamps;

    for (var k in this.events) {
        this.events[k] = new Event(this.events[k]);
    }
}

DejeDocument.prototype.key_order = ["topic", "events", "quorums", "timestamps"];
DejeDocument.prototype.serialize = function(indent) {
    return DejeUtils.serialize(this, {
        "indent": indent,
        "prefix": (indent === "") ? "" : "\n",
        "kv_space": (indent === "") ? "" : " "
    });
}

return DejeDocument;

});

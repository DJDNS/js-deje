define(['deje/utils','deje/event'], function(DejeUtils, Event) {

function DejeDocument(content) {
    this.events     = content.events;
    this.timestamps = content.timestamps;

    for (var k in this.events) {
        this.events[k] = new Event(this.events[k]);
    }
}

DejeDocument.prototype.key_order = ["events", "timestamps"];
DejeDocument.prototype.serialize = function(indent) {
    if (indent === undefined) {
        indent = '';
    }
    return DejeUtils.serialize(this, {
        'indent': indent,
        'prefix': (indent === '') ? '' : '\n',
        'kv_space': (indent === '') ? '' : ' '
    });
}

return DejeDocument;

});

# js-deje, a JavaScript DEJE library

This allows browsers and Node.js servers to act as DEJE clients. The DEJE protocol is built on WAMP, so even in the browser, JavaScript is a first-class citizen among protocol peers.

This library is currently very limited - even less production-ready than the Go implementation of DEJE. It's quick-and-dirty, with demos in mind. Not only that, but it implements the current "toy" edition of the protocol, which is profoundly griefable.

Also note that the final version will depend on having access to a bitcoind API server that you have reasonable trust in. DEJE uses the Bitcoin blockchain as a distributed, secure timestamping service. This is less of a pain in the butt than it sounds, because the standard daemon implementation exposes a REST HTTP interface.

## Dependencies

 * jsSHA
 * AutobahnJS (TODO: Specify version, need WAMP 1 support)

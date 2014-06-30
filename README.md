# js-deje, a JavaScript DEJE library

This allows browsers and Node.js servers to act as DEJE clients. The DEJE protocol is built on WAMP, so even in the browser, JavaScript is a first-class citizen among protocol peers.

This library is currently very limited - even less production-ready than the Go implementation of DEJE. It's quick-and-dirty, with demos in mind. Not only that, but it implements the current "toy" edition of the protocol, which is profoundly griefable.

Also note that the final version will depend on having access to a bitcoind API server that you have reasonable trust in. DEJE uses the Bitcoin blockchain as a distributed, secure timestamping service. This is less of a pain in the butt than it sounds, because the standard daemon implementation exposes a REST HTTP interface.

## Dependencies

 * [jsSHA 1.5.0+](https://caligatio.github.io/jsSHA/)
 * [AutobahnJS 0.8.2](http://autobahn.ws/js/reference_wampv1.html) (Latest version that supports WAMP 1, where [Turnpike](https://github.com/jcelliott/turnpike) is currently stuck at)

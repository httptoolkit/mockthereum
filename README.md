# Mockthereum [![Build Status](https://github.com/httptoolkit/mockthereum/workflows/CI/badge.svg)](https://github.com/httptoolkit/mockthereum/actions) [![Available on NPM](https://img.shields.io/npm/v/mockthereum.svg)](https://npmjs.com/package/mockthereum)

> _Part of [HTTP Toolkit](https://httptoolkit.tech): powerful tools for building, testing & debugging HTTP(S), Ethereum, IPFS, and more_

Mockthereum lets you build a fake Ethereum node, or proxy traffic to a real Ethereum node, to inspect & mock all Ethereum interactions made by any Ethereum client website or application.

---

:warning: _Mockthereum is still new & rapidly developing!_ :warning:

_Everything described here works today, but there's lots more to come, and some advanced use cases may run into rough edges. If you hit any problems or missing features, please [open an issue](https://github.com/httptoolkit/mockthereum/issues/new)._

---

## Example

```typescript
import * as Mockthereum from 'mockthereum'

// Use any real Ethereum client:
import Web3 from 'web3';

// Parameters for some real Web3 contract:
const CONTRACT_ADDRESS = "0x...";
const JSON_CONTRACT_ABI = { /* ... */ };

describe("Mockthereum", () => {

    // Create a mock Ethereum node:
    const mockNode = Mockthereum.getLocal();

    // Start & stop your mock node to reset state between tests:
    beforeEach(() => mockNode.start());
    afterEach(() => mockNode.stop());

    it("lets you mock behaviour and assert on Ethereum interactions", async () => {
        // Mock any address balance
        await mockNode.forBalance('0x0000000000000000000000000000000000000001')
            .thenReturn(1000);

        // Mock any contract's function call:
        const mockedFunction = await mockNode.forCall(CONTRACT_ADDRESS) // Match any contract address
            // Optionally, match specific functions and parameters:
            .forFunction('function getText(string key) returns (string)')
            .withParams(["test"])
            // Mock contract results:
            .thenReturn('Mock result');

        // Real code to make client requests to the Ethereum node:
        const web3 = new Web3(mockNode.url);

        const walletBalance = await web3.eth.getBalance('0x0000000000000000000000000000000000000001');
        expect(walletBalance).to.equal("1000"); // Returns our mocked wallet balance

        const contract = new web3.eth.Contract(JSON_CONTRACT_ABI, CONTRACT_ADDRESS);
        const contractResult = await contract.methods.getText("test").call();

        // Check contract call returns our fake contract result:
        expect(contractResult).to.equal("Mock result");

        // Assert on inputs, to check we saw the contract calls we expected:
        const mockedCalls = await mockedFunction.getRequests();
        expect(mockedCalls.length).to.equal(1);

        expect(mockedCalls[0]).to.deep.include({
            // Examine full interaction data, included decoded parameters etc:
            to: CONTRACT_ADDRESS,
            params: ["test"]
        });
    });
});
```

## Getting Started

First, install Mockthereum:

```bash
npm install --save-dev mockthereum
```

Once you've installed the library, you'll want to use it in your test or automation code. To do so you need to:

* Create an new Mockthereum node
* Start the node, to make it listen for requests (and stop it when you're done)
* Use the URL of the Mockthereum node as your Ethereum provider URL
* Define some rules to mock behaviour

### Creating a Mockthereum Node

To create a node in Node.js, you can simply call `Mockthereum.getLocal()` and you're done.

In many cases though, to test a web application you'll want to run your tests inside a browser, and create & manage your mock Ethereum node there too. It's not possible to launch a node from inside a browser, but Mockthereum provides a separate admin server you can run, which will host your mock Ethereum node externally.

Once your admin server is running, you can use the exact same code as for Node.js, but each method call is transparently turned into a remote-control call to the admin server.

To do this, you just need to run the admin server before you start your tests, and stop it afterwards. You can do that in one of two ways:

* You can run your test suite using the provided launch helper:
  ```
  mockthereum -c <your test command>
  ```
  This will start & stop the admin server automatically before and after your tests.
* Or you can launch the admin server programmatically like so:
  ```javascript
  import * as Mockthereum from 'mockthereum';

  const adminServer = Mockthereum.getAdminServer();
  adminServer.start().then(() =>
      console.log('Admin server started')
  );
  ```

Note that as this is a universal library (it works in Node.js & browsers) this code does reference some Node.js modules & globals in a couple of places. If you're using Mockthereum from inside a browser, this needs to be handled by your bundler. In many bundlers this will be handled automatically, but if it's not you may need to enable node polyfills for this. In Webpack that usually means enabling [node-polyfill-webpack-plugin](https://www.npmjs.com/package/node-polyfill-webpack-plugin), or in ESBuild you'll want the [`@esbuild-plugins/node-modules-polyfill`](https://www.npmjs.com/package/@esbuild-plugins/node-modules-polyfill) and [`@esbuild-plugins/node-globals-polyfill`](https://www.npmjs.com/package/@esbuild-plugins/node-globals-polyfill) plugins.

Once you have an admin server running, you can call `Mockthereum.getLocal()` in the browser in exactly the same way as in Node.js, and it will automatically find & use the local admin server to create a mock Ethereum node.

### Starting & stopping your Mockthereum node

Nodes expose `.start()` and `.stop()` methods to start & stop the node. You should call `.start()` before you use the node, call `.stop()` when you're done with it, and in both cases wait for the promise that's returned to ensure everything is completed before continuing.

In automation, you'll want to create the node and start it immediately, and only stop it at shutdown. In testing environments it's usually better to start & stop the node between tests, like so:

```javascript
import * as Mockthereum from 'mockthereum';

const mockNode = Mockthereum.getLocal();

describe("A suite of tests", () => {

  beforeEach(async () => {
    await mockNode.start();
  });

  afterEach(async () => {
    await mockNode.stop();
  });

  it("A single test", () => {
    // ...
  });

});
```

### Using your Mockthereum Node

To use the Mockthereum node instead of connecting to your real provider, just use the HTTP URL exposed by `mockNode.url` as your Ethereum provider URL.

For example, for Web3.js:

```javascript
import Web3 from "web3";

const web3 = new Web3(mockNode.url);

// Now use web3 as normal, and all interactions will be sent to the mock node instead of
// any real Ethereum node, and so will not touch the real Ethereum network (unless you
// explicitly proxy them - see 'Proxying Ethereum Traffic' below).
```

### Defining mock rules

Once you have a mock node, you can define rules to mock behaviour, allowing you to precisely control the Ethereum environment your code runs in, and test a variety of scenarios isolated from the real Ethereum network.

To define a rule, once you have a mock node, call one of the `.forX()` methods to start defining the behaviour for a specific interaction through chained method calls, and call a `.thenX()` rule at the end (and wait for the returned promise) to complete the rule an activate that behaviour.

There's many interactions that can be mocked with many behaviours, here's some examples:

```javascript
// Mock the balance of a wallet:
mockNode.forBalance('0x123412341234...')
    .thenReturn(1000);

// Mock a fixed result for a contract call:
mockNode.forCall(CONTRACT_ADDRESS)
    .forFunction("function foobar(bool, string) returns (int256)")
    .withParams([true, 'test'])
    .thenReturn([1234]);

// Mock transactions, to test transaction rejection:
mockNode.forSendTransactionTo(WALLET_ADDRESS)
    .thenRevert();

// Simulate timeouts and connection issues:
mockNode.forBlockNumber()
    .thenTimeout();
```

For the full list of interactions & behaviours, see the [detailed API Reference](https://httptoolkit.github.io/mockthereum/).

### Examining received requests

In addition to defining behaviours, you can also examine the requests that have been received by the mock node, to verify that expected traffic is being received.

To do so, call either `mockNode.getSeenRequests()` or `mockNode.getSeenMethodCalls(methodName)` which returns a promise that resolves to an array of seen requests - each one with a `method` property (the Ethereum method name, like `eth_getBalance`), a `parameters` property (the parameters passed to that method), and a `rawRequest` property (the full raw HTTP request details).

For example, you can log all seen requests like so:

```javascript
mockNode.getSeenRequests().then(requests => {
    requests.forEach(request => {
        console.log(`${request.method}: ${JSON.stringify(request.parameters)}`);
    });
});
```

In addition, methods to mock contract & transaction behaviour (e.g. rules defined with `forCall()` or `forSendTransaction()`) return a mocked contract from the promise returned by every `.thenX()` method, which can be used directly to query the interactions with that specific rule.

Each interaction is returned as an object with `to`, `from`, `value`, `params` and `rawRequest` fields.

For example:

```javascript
const mockedContract = await mockNode.forCall(CONTRACT_ADDRESS)
    .forFunction("function foobar(bool, string) returns (int256)")
    .withParams([true, 'test'])
    .thenReturn([1234]);

// ...Call the above contract a few times...

mockedContract.getRequests().then(requests => {
    requests.forEach(request => {
        console.log(`${request.from}->${request.to}: ${request.value} (${JSON.stringify(request.params)})`);
    });
});
```

### Proxying Ethereum traffic

By default Mockthereum will mock all interactions with default values (rejecting calls & transactions, reporting all wallets as empty, and returning default values for all query methods like `eth_gasPrice`) but you can change this to proxy traffic to a real Ethereum node instead.

By doing so, you can use Mockthereum as an intercepting proxy - returning real responses from the network for most cases, but allowing specific interactions to be mocked in isolation, and making it possible to query the list of interactions that were made.

To do this, pass `unmatchedRequests: { proxyTo: "a-real-ethereum-node-HTTP-url" }` as an option when creating your mock Ethereum node. This will disable the default stub responses, and proxy all unmatched requests to the given node instead. For example:

```javascript
import * as Mockthereum from 'mockthereum'
const mockNode = Mockthereum.getLocal({
  unmatchedRequests: { proxyTo: "http://localhost:30303" }
});
mockNode.start();
```

This only changes the unmatched request behaviour, and all other methods will continue to define behaviour and query seen request data as normal.

## API Reference Documentation

For more details, see the [Mockthereum reference docs](https://httptoolkit.github.io/mockthereum/).

---

_This‌ ‌project‌ ‌has‌ ‌received‌ ‌funding‌ ‌from‌ ‌the‌ ‌European‌ ‌Union’s‌ ‌Horizon‌ ‌2020‌‌ research‌ ‌and‌ ‌innovation‌ ‌programme‌ ‌within‌ ‌the‌ ‌framework‌ ‌of‌ ‌the‌ ‌NGI-POINTER‌‌ Project‌ ‌funded‌ ‌under‌ ‌grant‌ ‌agreement‌ ‌No‌ 871528._

![The NGI logo and EU flag](./ngi-eu-footer.png)

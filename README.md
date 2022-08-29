# Mockthereum [![Build Status](https://github.com/httptoolkit/mockthereum/workflows/CI/badge.svg)](https://github.com/httptoolkit/mockthereum/actions) [![Available on NPM](https://img.shields.io/npm/v/mockthereum.svg)](https://npmjs.com/package/mockthereum)

> _Part of [HTTP Toolkit](https://httptoolkit.tech): powerful tools for building, testing & debugging HTTP(S), Ethereum, IPFS, and more_

Mockthereum lets you build a fake Ethereum node, or proxy traffic to a real Ethereum node, to inspect & mock all Ethereum interactions made by any Ethereum client website or application.

## Examples

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

---

_This‌ ‌project‌ ‌has‌ ‌received‌ ‌funding‌ ‌from‌ ‌the‌ ‌European‌ ‌Union’s‌ ‌Horizon‌ ‌2020‌‌ research‌ ‌and‌ ‌innovation‌ ‌programme‌ ‌within‌ ‌the‌ ‌framework‌ ‌of‌ ‌the‌ ‌NGI-POINTER‌‌ Project‌ ‌funded‌ ‌under‌ ‌grant‌ ‌agreement‌ ‌No‌ 871528._

![The NGI logo and EU flag](./ngi-eu-footer.png)

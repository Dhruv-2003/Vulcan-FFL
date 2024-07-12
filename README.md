# Vulcan FFL
Vulcan FFL is a fast finality layer to bring fast transaction finality across Ethereum’s Layer 2 rollups. It executes all the transactions in a block to pessimistically verify the state change of the rollup. For now, it is catered for Stackr’s Micro-rollup specifications but can be extended to other rollup standards. 

## Why?

Rollups face significant challenges of absence and instant secure finality, Ethereum finality lags for many rollup-based use cases. To solve these problems, we implemented a fast finality layer which takes the block containing transactions from the rollup, pessimistically re-executes the state transition function and validates the state change. So, a rollup can assert a state claim on the Vulcan FFL, stating that executing a specific block of transactions leads to a particular state commitment. If a supermajority of nodes attests to its validity, rollup clients can achieve economic finality almsost instantaneously.

Presently, the Vulcan layer in Stackr’s stack is run by Stackr's Vulcan node, and we have extended it on AVS using the Othentic stack to achieve shared economic security.

![WhatsApp Image (2)](https://github.com/Dhruv-2003/SS-Hackathon/assets/90101251/88cb048f-96ac-47f5-b94d-bcd281535c65)


## Architecture 
<img width="1268" alt="Screenshot 2024-07-12 at 9 28 29 PM" src="https://github.com/user-attachments/assets/340439e0-dbc4-4afa-9ad7-a93578e91135">

## Tech Description 

We attain fast finality by re-executing the whole block on the state to verify the state change asserted by the rollup executor node. 

1. The user submits the transactions/actions to the Micro Rollup directly. MRU node picks them up, builds the block, sequences and then executes the block locally which is handled by the `@Stackr/sdk`  written in Typescript. The block is subsequently published to Avail DA with all the information of actions , etc along with the rawState before this block. This is to be later used as a proofOfTask executed by the executor here and will be used for verification.
2. Once the block is ready to be submitted for verification, our custom syncer service listens to the event and prepare the arguments for `sendTask` RPC call, including `proofOfTask`, `data`, `performer`, `sig` & the `taskDefinitionId`. Then it makes an RPC call to the Othentic Client for sending the task.
3. Attestors pick up these tasks for verification first. They perform an REST API call to `AVS-WebAPI` endpoint `/task/validate` along with all the information.
4. Our `AVS-WebAPI` service is written in Go for faster verification. It takes in the `proofData`  after fetching it from the DA client - **Avail** from the `blockHash` & `txHash`, and then executes the block again. In this process, every action in the block is executed on the `previousBlockState` . This is done on our `stf.wasm` file which basically contains the compiled TS → wasm code of the state Machine with State transition functions.At the end it emits out the final state Root , which is then compared to the block’s state root and if it verifies then they can attest to that.
5. Once more than 2/3 rd of nodes agree and mark it as “valid”, it is sent to the aggregator for BLS signature aggregation, and a final attestation is created on the `Attestation Centre` contract on the L2.
6. ( Later ) A custom AVS logic contract will be created which submits the blockVerification data to the Rollup contract on L1 via some messaging protocols. The block can then later be finalized on L1 once N epoch passes.
Right now, it’s not implemented due to the incompatible current infrastructure of rollup contracts on a Sepolia.

### Components

- [AVS-WebAPI](https://github.com/Dhruv-2003/SS-Hackathon/tree/main/AVS/AVS-WebAPI) - contains the code for task validator endpoint , written in Go.
- [Syncer](https://github.com/Dhruv-2003/SS-Hackathon/blob/main/rollup/avs-functions/index.ts) - this service syncs the blocks with the Othentic client for further verification
- [Rollup](https://github.com/Dhruv-2003/SS-Hackathon/tree/main/rollup) - a simple token-transfer micro rollup intialized using stackr CLI
- [docker-compose.yaml](https://github.com/Dhruv-2003/SS-Hackathon/blob/main/AVS/docker-compose.yml) - docker file to spin all the required operators like aggregator , attestors and WebAPI service in docker containers
- [deployements](https://github.com/Dhruv-2003/SS-Hackathon/tree/main/AVS/deployements) - othentic stack contract deployement

## AVS Task definition

The AVS task definitions are as follows :

**Task Performer (** /**execute)**

- When the user, submits a transaction for the micro-rollup, a block is created and tracked using block event listeners. The `data` is encoded block information which is required for the block submission.
- The previous state of the rollup is fetched from the rollup and along with the block data creates the `proofOfTaskData` object. It is then published on Data Availability layer - Avail giving us the `BlockHash` & `extrinsicHash/txHash` , which can be used later while querying the data 
- The `data`, `proofOfTaskData` and `taskDefinitionId`  are then signed by the performer and a `sendTask` RPC call is sent to the Othentic client.

**Task Validator ( /validate)**

- Our validator server is written in Go for faster verification. It takes in the `proofData` after fetching it from the DA client, and then executes the block again.
- In this process, each and every action in the block is executed on the `previousBlockState`. This is done on the `stf.wasm` file which contains the compiled typescript converted to the wasm code of the state Machine with State transition functions.
- It then emits out the final state root, which is compared to the block’s state root and returns valid or invalid (true or false).

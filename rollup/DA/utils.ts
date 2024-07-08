import { initialize, getKeyringFromSeed } from "avail-js-sdk";
import { ISubmittableResult } from "@polkadot/types/types/extrinsic";
import { H256 } from "@polkadot/types/interfaces/runtime";
import { config } from "./config";

export const submitBlob = async (data: any) => {
  const api = await initialize(config.endpoint);
  const account = getKeyringFromSeed(config.seed as string);
  const appId = config.app_id === 0 ? 1 : config.app_id;
  const options = { app_id: appId, nonce: -1 };

  const txResult = await new Promise<ISubmittableResult>((res) => {
    api.tx.dataAvailability
      .submitData(data)
      .signAndSend(account, options, (result: ISubmittableResult) => {
        console.log(`Tx status: ${result.status}`);
        if (result.isFinalized || result.isError) {
          res(result);
        }
      });
  });

  if (txResult.isError) {
    console.log(`Transaction was not executed`);
    process.exit(1);
  }

  const [txHash, blockHash] = [
    txResult.txHash as H256,
    txResult.status.asFinalized as H256,
  ];
  console.log(`Tx Hash: ${txHash}, Block Hash: ${blockHash}`);

  const error = txResult.dispatchError;
  if (error != undefined) {
    if (error.isModule) {
      const decoded = api.registry.findMetaError(error.asModule);
      const { docs, name, section } = decoded;
      console.log(`${section}.${name}: ${docs.join(" ")}`);
    } else {
      console.log(error.toString());
    }
    process.exit(1);
  }

  extractData(api, blockHash, txHash);
};

const extractData = async (api: any, blockHash: H256, txHash: H256) => {
  try {
    const block = await api.rpc.chain.getBlock(blockHash);
    const tx = block.block.extrinsics.find(
      (tx) => tx.hash.toHex() == txHash.toHex()
    );
    if (tx == undefined) {
      console.log("Failed to find the Submit Data transaction");
      process.exit(1);
    }

    console.log(tx.toHuman());
    const dataHex = tx.method.args.map((a) => a.toString()).join(", ");
    let str = "";
    for (let n = 0; n < dataHex.length; n += 2) {
      str += String.fromCharCode(parseInt(dataHex.substring(n, n + 2), 16));
    }
    console.log(`submitted data: ${str}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export const queryProof = async (blockHash: string) => {
  const api = await initialize(config.endpoint);
  const rpc: any = api.rpc;
  const dataProof = await rpc.kate.queryDataProof(1, blockHash);
  console.log(`Header: ${JSON.stringify(dataProof, undefined, 2)}`);
  console.log(`Fetched proof from Avail block ${blockHash}`);
  console.log(`Root: ${dataProof.root}`);
  console.log(`Proof: ${dataProof.proof}`);
  return dataProof.proof;
};

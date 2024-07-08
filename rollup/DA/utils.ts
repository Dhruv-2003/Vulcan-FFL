import { initialize, getKeyringFromSeed } from "avail-js-sdk";
import { ISubmittableResult } from "@polkadot/types/types/extrinsic";
import { H256 } from "@polkadot/types/interfaces/runtime";
import {config} from "./config";

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

  const [txHash, blockHash] = [txResult.txHash as H256, txResult.status.asFinalized as H256]
  console.log(`Tx Hash: ${txHash}, Block Hash: ${blockHash}`)

  const error = txResult.dispatchError
    if (error != undefined) {
      if (error.isModule) {
        const decoded = api.registry.findMetaError(error.asModule)
        const { docs, name, section } = decoded
        console.log(`${section}.${name}: ${docs.join(" ")}`)
      } else {
        console.log(error.toString())
      }
      process.exit(1)
    }
};

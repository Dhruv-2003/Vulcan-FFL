import { ActionSchema, AllowedInputTypes, MicroRollup } from "@stackr/sdk";
import { HDNodeWallet, Wallet } from "ethers";
import { stackrConfig } from "../stackr.config.ts";
import { UpdateCounterSchema } from "./stackr/action.ts";
import { machine } from "./stackr/machine.ts";

const wallet = Wallet.createRandom();

const signMessage = async (
  wallet: HDNodeWallet,
  schema: ActionSchema,
  payload: AllowedInputTypes
) => {
  const signature = await wallet.signTypedData(
    schema.domain,
    schema.EIP712TypedData.types,
    payload
  );
  return signature;
};

const main = async () => {
  const mru = await MicroRollup({
    config: stackrConfig,
    actionSchemas: [UpdateCounterSchema],
    stateMachines: [machine],
  });

  await mru.init();

  const inputs = {
    timestamp: Date.now(),
  };

  const signature = await signMessage(wallet, UpdateCounterSchema, inputs);
  const incrementAction = UpdateCounterSchema.actionFrom({
    inputs,
    signature,
    msgSender: wallet.address,
  });

  const ack = await mru.submitAction("increment", incrementAction);
  console.log(ack);
};

main();

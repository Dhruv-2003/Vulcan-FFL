import { MicroRollup } from "@stackr/sdk";
import { stackrConfig } from "../stackr.config.ts";

import { schemas } from "./actions.ts";
import { erc20StateMachine } from "./machines.stackr.ts";

type ERC20Machine = typeof erc20StateMachine;

const mru = await MicroRollup({
  config: stackrConfig,
  actionSchemas: [
    schemas.create,
    schemas.transfer,
    schemas.transferFrom,
    schemas.mint,
    schemas.burn,
    schemas.approve,
  ],
  stateMachines: [erc20StateMachine],
  stfSchemaMap: {
    create: schemas.create,
    transfer: schemas.transfer,
    transferFrom: schemas.transferFrom,
    mint: schemas.mint,
    burn: schemas.burn,
    approve: schemas.approve,
  },
});

await mru.init();

export { ERC20Machine, mru };

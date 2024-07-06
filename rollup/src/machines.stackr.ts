import { StateMachine } from "@stackr/sdk/machine";
import genesisState from "../genesis-state.json";
import { transitions } from "./transitions";
import { ERC20 } from "./state";

const STATE_MACHINES = {
  ERC20: "erc-20",
};

const erc20StateMachine = new StateMachine({
  id: STATE_MACHINES.ERC20,
  stateClass: ERC20,
  initialState: genesisState.state,
  on: transitions,
});

export { STATE_MACHINES, erc20StateMachine };

import { State, StateMachine } from "@stackr/sdk/machine";
import { solidityPackedKeccak256 } from "ethers";

import * as genesisState from "../../genesis-state.json";
import { transitions } from "./transitions";

export class CounterState extends State<number> {
  constructor(state: number) {
    super(state);
  }

  getRootHash() {
    return solidityPackedKeccak256(["uint256"], [this.state]);
  }
}

const machine = new StateMachine({
  id: "counter",
  stateClass: CounterState,
  initialState: genesisState.state,
  on: transitions,
});

export { machine };

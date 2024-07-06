import { STF, Transitions } from "@stackr/sdk/machine";
import { CounterState } from "./machine";

const increment: STF<CounterState> = {
  handler: ({ state }) => {
    state += 1;
    return state;
  },
};

const decrement: STF<CounterState> = {
  handler: ({ state }) => {
    state -= 1;
    return state;
  },
};

export const transitions: Transitions<CounterState> = {
  increment,
  decrement,
};

import { ActionSchema, SolidityType } from "@stackr/sdk";

// utility function to create a transfer schema
function generateSchemaFromBase(name: string) {
  return new ActionSchema(name, {
    to: SolidityType.ADDRESS,
    from: SolidityType.ADDRESS,
    amount: SolidityType.UINT,
    nonce: SolidityType.UINT,
  });
}

// createAccountSchema is a schema for creating an account
const createAccountSchema = new ActionSchema("createAccount", {
  address: SolidityType.ADDRESS,
});

// collection of all the transfer actions
// that can be performed on the rollup
export const schemas = {
  create: createAccountSchema,
  transfer: generateSchemaFromBase("transfer"),
  transferFrom: generateSchemaFromBase("transferFrom"),
  mint: generateSchemaFromBase("mint"),
  burn: generateSchemaFromBase("burn"),
  approve: generateSchemaFromBase("approve"),
};

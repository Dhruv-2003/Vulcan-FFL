async function main() {
  const body = {
    data: "0xd81d9c5be0b1197091489c2387f5ac0067837baa3a7227186601abac3bafea61",
    proofOfTask: "QmU4yuVEzfdGfQrVwCRbof9WYuP6iUp9XL16QvpDi7G2QG",
    taskDefinitionId: 0,
    performer: "0xBF17F859989A73C55c7BA5Fefb40e63715216B9b",
  };

  try {
    const response = await fetch("http://localhost:4002/task/validate", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("API response:", response);
    const res = await response.json();
    console.log(res);
  } catch (error) {
    console.error("Error making API request:", error);
  }
}

main();

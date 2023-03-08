import autocannon from "autocannon";

async function main() {
  const result = await autocannon({
    url: "http://localhost:3000",
    connections: 10, //default
    pipelining: 1, // default
    duration: 10, // default
  });

  console.log(autocannon.printResult(result));
}

main();

export async function formattedResult(groupedResult) {
  return Object.entries(groupedResult).map(([dev_uuid, resultArray]) => {
    return { dev_uuid, result: resultArray };
  });
  const sum_generation = await sumGeneration(formattedResult);
  const readableStream = Readable({
    async read() {
      try {
        sum_generation.forEach((result) => this.push(result));
        this.push(null);
      } catch (error) {
        this.emit("error", error);
      }
    },
  });
}

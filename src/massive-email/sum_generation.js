export async function sumGeneration(formattedResult) {
  const sum_generation = await Promise.all(
    formattedResult.map(async (gens) => {
      // Real generation
      const realGeneration = gens.result.map((element) => {
        return { value: element.gen_real, date: element.gen_date };
      });

      // Estimated generation
      const estimatedGeneration = gens.result.map(
        (element) => element.gen_estimated
      );

      // Sum real generation
      const sumreal = gens.result.reduce(
        (acc, atual) => acc + atual.gen_real,
        0
      );
      const sumrealNew = sumreal.toFixed(2);

      // Sum estimated generation
      const sumestimated = gens.result.reduce(
        (acc, atual) => acc + atual.gen_estimated,
        0
      );
      const sumestimatedNew = sumestimated.toFixed(2);

      // Calculate percentage
      let percentNew;
      if (sumreal === 0) {
        percentNew = 0;
      } else {
        percentNew = ((sumestimated / sumreal) * 100).toFixed(2);
      }

      // Determine situation
      const situation =
        percentNew > 80
          ? `Parabéns, sua usina produziu o equivalente a ${percentNew}% do total esperado.`
          : `Infelizmente, sua usina produziu apenas ${percentNew}% em relação ao esperado.`;

      // Create device element
      const dev_element = {
        dev_uuid: gens.dev_uuid,
        capacity: gens.result[0].dev_capacity,
        name: gens.result[0].dev_name,
        email: gens.result[0].dev_email,
        sumrealNew,
        sumestimatedNew,
        percentNew,
        situation,
        realGeneration,
        estimatedGeneration,
      };

      return JSON.stringify(dev_element);
    })
  );
  return sum_generation;
}

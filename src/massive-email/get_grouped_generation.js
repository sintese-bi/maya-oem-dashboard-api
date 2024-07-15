export async function getGroupedGeneration(generation) {
  return generation.reduce((acc, generation) => {
    const { dev_uuid, gen_real, gen_estimated, gen_date, devices } = generation;
    const { dev_capacity, dev_name, dev_email } = devices;

    if (!acc[dev_uuid]) {
      acc[dev_uuid] = [];
    }

    acc[dev_uuid].push({
      gen_real,
      gen_estimated,
      gen_date,
      dev_capacity,
      dev_name,
      dev_email,
    });

    return acc;
  }, {});
}

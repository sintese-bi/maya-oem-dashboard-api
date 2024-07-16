export async function getGroupedGeneration(generation) {
  const allDevices = {};
  generation.forEach((element) => {
    const date = new Date(element.gen_date);
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    const monthKey = `${year}-${month.toString().padStart(2, "0")}`;
    const currentMonth = new Date().getUTCMonth() + 1;
    const currentYear = new Date().getUTCFullYear();

    if (!allDevices[element.dev_uuid]) {
      allDevices[element.dev_uuid] = {
        dev_name: element.devices.dev_name,
        dev_email: element.devices.dev_email,
        dev_deleted: element.devices.dev_deleted,
        dev_capacity: element.devices.dev_capacity,
        generationData: {},
        currentMonthData: [],
      };
    }

    if (!allDevices[element.dev_uuid].generationData[monthKey]) {
      allDevices[element.dev_uuid].generationData[monthKey] = {
        gen_real_sum: 0,
        gen_estimated_sum: 0,
      };
    }

    allDevices[element.dev_uuid].generationData[monthKey].gen_real_sum =
      Math.round(
        (allDevices[element.dev_uuid].generationData[monthKey].gen_real_sum +
          element.gen_real) *
          100
      ) / 100;
    allDevices[element.dev_uuid].generationData[monthKey].gen_estimated_sum =
      Math.round(
        (allDevices[element.dev_uuid].generationData[monthKey]
          .gen_estimated_sum +
          element.gen_estimated) *
          100
      ) / 100;

    if (month === currentMonth && year === currentYear) {
      allDevices[element.dev_uuid].currentMonthData.push({
        gen_real: Math.round(element.gen_real * 100) / 100,
        gen_estimated: Math.round(element.gen_estimated * 100) / 100,
        gen_date: element.gen_date,
      });
    }
  });
  return allDevices;
}

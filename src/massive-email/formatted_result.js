import moment from "moment";

export async function formattedResult(groupedResult) {
  return Object.keys(groupedResult).map((dev_uuid) => {
    const currentMonthData = groupedResult[dev_uuid].currentMonthData;
    const currentMonthRealSum =
      Math.round(
        currentMonthData.reduce((acc, curr) => acc + curr.gen_real, 0) * 100
      ) / 100;
    const currentMonthEstimatedSum =
      Math.round(
        currentMonthData.reduce((acc, curr) => acc + curr.gen_estimated, 0) *
          100
      ) / 100;
    const performance =
      Math.round((currentMonthRealSum / currentMonthEstimatedSum) * 100 * 100) /
      100;
    const monthEconomyTotal = currentMonthRealSum * 0.96;
    const treesSavedTotal =
      Math.round(currentMonthRealSum * 0.000504 * 100) / 100;
    const CO2 = Math.round(currentMonthRealSum * 0.419 * 100) / 100;
    const period = moment().format("YYYY-MM");
    return {
      dev_uuid,
      dev_name: groupedResult[dev_uuid].dev_name,
      dev_email: groupedResult[dev_uuid].dev_email,
      dev_deleted: groupedResult[dev_uuid].dev_deleted,
      dev_capacity: groupedResult[dev_uuid].dev_capacity,
      performance,
      CO2,
      period,
      treesSavedTotal,
      currentMonthRealSum,
      currentMonthEstimatedSum,
      generationData: groupedResult[dev_uuid].generationData,
      currentMonthData: groupedResult[dev_uuid].currentMonthData,
    };
  });
}

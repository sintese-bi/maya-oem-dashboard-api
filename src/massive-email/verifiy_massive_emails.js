import { massiveEmail } from ".";
import Users from "../models/Users";

setInterval(async () => {
  const users = await Users.findAll({
    attributes: [
      "use_massive_reports_status",
      "use_uuid",
      "use_massive_reports_status_updated_at",
    ],
  });
  const users_waiting_status = users
    .filter((data) => data.use_massive_reports_status == "waiting")
    .sort(
      (a, b) =>
        a.use_massive_reports_status_updated_at -
        b.use_massive_reports_status_updated_at
    );

  const users_executing_status = users.filter(
    (data) => data.use_massive_reports_status == "executing"
  );

  if (users_waiting_status.length != 0 && users_executing_status.length == 0) {
    await massiveEmail(users_waiting_status[0].use_uuid);
  }
}, [72e4]);

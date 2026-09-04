import type { Services } from "../context";
import { rolesWithPermission } from "@trafferbot/shared";

/**
 * Send a notification to all admins who have the given permission.
 */
export async function notifyAdmins(
  services: Services,
  permission: string,
  message: string
) {
  const roles = rolesWithPermission(permission);
  if (roles.length === 0) return;
  const admins = await services.users.findByRoles(roles);
  await Promise.all(
    admins.map((admin) =>
      services.notifications.enqueue(admin.telegramId, message)
    )
  );
}

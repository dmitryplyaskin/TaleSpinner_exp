import { useUnit } from "effector-react";

import { UserSettingsDialog } from "./user-settings-dialog";
import { userSettingsModel } from "@/features/user-settings";

export const UserSettingsHost = () => {
  const [open, toggleUserSettings] = useUnit([
    userSettingsModel.$userSettingsOpen,
    userSettingsModel.toggleUserSettings,
  ]);

  return <UserSettingsDialog open={open} onOpenChange={toggleUserSettings} />;
};

import { useMemo } from "react";
import { Lock, Mail } from "lucide-react";
import Section from "../../components/commons/Section";
import Text from "../../components/commons/Text/Text";
import { useAuth } from "../../providers/AuthProvider";
import cssStyles from "./Settings.module.css";

export default function Settings() {
  const { user } = useAuth();

  const email = useMemo(() => {
    const maybeEmail = (user?.email ?? user?.user?.email) as string | undefined;
    return maybeEmail ?? "—";
  }, [user]);

  return (
    <div className={cssStyles.page}>
      <Section>
        <div className={cssStyles.sectionHeader}>
          <Text variant="title" style={{ margin: 0 }}>
            Settings
          </Text>
          <Text variant="caption" style={{ margin: 0 }} textStyle={{ opacity: 0.75 }}>
            Manage your account details
          </Text>
        </div>

        <div className={cssStyles.grid}>
          <div className={cssStyles.card}>
            <div className={cssStyles.cardTitleRow}>
              <Mail size={16} />
              <Text variant="subtitle" style={{ margin: 0 }}>
                Email
              </Text>
            </div>
            <Text variant="caption" style={{ margin: 0 }} textStyle={{ opacity: 0.75 }}>
              This can’t be changed right now.
            </Text>
            <input className={cssStyles.input} value={email} disabled />
          </div>

          <div className={cssStyles.card}>
            <div className={cssStyles.cardTitleRow}>
              <Lock size={16} />
              <Text variant="subtitle" style={{ margin: 0 }}>
                Change password
              </Text>
            </div>
            <Text variant="caption" style={{ margin: 0 }} textStyle={{ opacity: 0.75 }}>
              Not functional yet — UI only for now.
            </Text>

            <div className={cssStyles.field}>
              <label className={cssStyles.label}>New password</label>
              <input className={cssStyles.input} type="password" placeholder="Enter new password" disabled />
            </div>
            <div className={cssStyles.field}>
              <label className={cssStyles.label}>Confirm password</label>
              <input className={cssStyles.input} type="password" placeholder="Confirm new password" disabled />
            </div>
            <button type="button" className={cssStyles.primaryButton} disabled>
              Update password (coming soon)
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}


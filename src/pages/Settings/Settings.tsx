import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { toast } from "react-hot-toast";
import colors from "../../constants/colors";
import Button from "../../components/commons/Button";
import Section from "../../components/commons/Section";
import Text from "../../components/commons/Text/Text";
import PageHeader from "../../components/commons/PageHeader";
import { changePassword } from "../../services/api";
import { mustNotBeEmptyOrSpace, mustBeStrongPassword } from "../../utils/validators";
import cssStyles from "./Settings.module.css";

type PasswordFormInputs = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function Settings() {
  const [shakeForm, setShakeForm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<PasswordFormInputs>();

  const newPassword = watch("newPassword");
  const isPasswordRuleInvalid = Boolean(errors.newPassword);

  const onSubmit: SubmitHandler<PasswordFormInputs> = async (data) => {
    await toast.promise(
      changePassword(data.currentPassword, data.newPassword)
        .then(() => {
          reset(); // Clear the form on success
        }),
      {
        loading: 'Updating password...',
        success: 'Password updated successfully!',
        error: (e: any) => {
          const status = e?.response?.status;
          const errorMessage = e?.response?.data?.error;
          
          switch (status) {
            case 401:
              return 'Current password is incorrect';
            case 409:
              return 'New password must be different from current password';
            case 422:
              return errorMessage || 'Validation error';
            default:
              return errorMessage || 'Unknown error occurred, please try again';
          }
        }
      }
    );
  };

  const onInvalidSubmit = () => {
    setShakeForm(true);
    window.setTimeout(() => setShakeForm(false), 360);
  };

  return (
    <div className={cssStyles.page}>
      <PageHeader
        title="Settings"
        subtitle="Manage your account details"
      />

      <Section>
        <div className={cssStyles.content}>
          <div className={`${cssStyles.card} ${cssStyles.passwordCard} ${shakeForm ? cssStyles.shake : ""}`}>
            <div className={cssStyles.cardTitleRow}>
              <Lock size={16} />
              <Text variant="subtitle" style={{ margin: 0 }}>
                Change password
              </Text>
            </div>

            <Text variant="caption" style={{ margin: 0 }} textStyle={{ opacity: 0.75 }}>
              Required to confirm your identity before changing password.
            </Text>

            <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className={cssStyles.form}>
              <div className={cssStyles.field}>
                <label className={cssStyles.label}>Current password</label>
                <input
                  className={`${cssStyles.input} ${errors.currentPassword ? cssStyles.inputError : ''}`}
                  type="password"
                  placeholder="Enter current password"
                  {...register("currentPassword", {
                    validate: {
                      required: mustNotBeEmptyOrSpace,
                    }
                  })}
                />
                {errors.currentPassword && (
                  <span className={cssStyles.errorText}>{errors.currentPassword.message}</span>
                )}
              </div>

              <div className={cssStyles.field}>
                <label className={cssStyles.label}>New password</label>
                <div className={cssStyles.inputWithIcon}>
                  <input
                    className={`${cssStyles.input} ${cssStyles.inputHasIcon} ${errors.newPassword ? cssStyles.inputError : ''}`}
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    {...register("newPassword", {
                      validate: {
                        strongPassword: mustBeStrongPassword,
                      }
                    })}
                  />
                  <button
                    type="button"
                    className={cssStyles.passwordToggle}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Text
                  variant="caption"
                  style={{ margin: 0, fontSize: "0.74rem" }}
                  textStyle={{ color: isPasswordRuleInvalid ? "var(--color-error)" : "var(--color-text-primary)", opacity: isPasswordRuleInvalid ? 1 : 0.68 }}
                >
                  Must contain uppercase, lowercase, number, and special character
                </Text>
                {errors.newPassword && (
                  <span className={cssStyles.errorText}>{errors.newPassword.message}</span>
                )}
              </div>

              <div className={cssStyles.field}>
                <label className={cssStyles.label}>Confirm new password</label>
                <div className={cssStyles.inputWithIcon}>
                  <input
                    className={`${cssStyles.input} ${cssStyles.inputHasIcon} ${errors.confirmPassword ? cssStyles.inputError : ''}`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    {...register("confirmPassword", {
                      validate: {
                        required: mustNotBeEmptyOrSpace,
                        match: (value) => value === newPassword || "This password doesn't match.",
                      }
                    })}
                  />
                  <button
                    type="button"
                    className={cssStyles.passwordToggle}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className={cssStyles.errorText}>{errors.confirmPassword.message}</span>
                )}
              </div>

              <div className={cssStyles.actionRow}>
                <Button
                  type="submit"
                  title={isSubmitting ? "Updating..." : "Update Password"}
                  titleStyle={{ color: isSubmitting ? colors.secondary : colors.primary }}
                  style={{
                    margin: 0,
                    padding: "12px 32px",
                    backgroundColor: colors.primaryLight,
                    width: "100%",
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </form>
          </div>
        </div>
      </Section>
    </div>
  );
}
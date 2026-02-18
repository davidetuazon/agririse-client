import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import colors from "../../constants/colors";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { mustBeValidEmail, mustNotBeEmptyOrSpace } from "../../utils/validators";
import { toast } from "react-hot-toast";
import { login } from "../../services/api";
import Cookies from "js-cookie";

import TextInput from "../../components/commons/TextInputs";
import Button from "../../components/commons/Button";
import { ACCESS_TOKEN } from "../../utils/constants";
import cssStyles from "./Login.module.css";

type Inputs = {
    email: string,
    password: string,
}

export default function Login() {
    const navigate = useNavigate();
    const { register, handleSubmit, setFocus, formState: { errors, isSubmitting }} = useForm<Inputs>();

    useEffect(() => {
        const t = setTimeout(() => setFocus("email"), 360);
        return () => clearTimeout(t);
    }, [setFocus]);

    const onSubmit: SubmitHandler<Inputs> = async (data: Inputs) => {
        await toast.promise(
            login(data.email, data.password)
            .then((response) => {
                Cookies.set(ACCESS_TOKEN, response.accessToken);
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 500);
            }), {
                loading: 'Logging in...',
                success: 'Welcome back!',
                error: (e: any) => {
                    const status = e?.response?.status;
                    switch (status) {
                        case 404:
                            return 'Incorrect email';
                        case 401:
                            return 'Incorrect password';
                        default:
                            return 'Uknown error occured, please try again';
                    }
                }
            }
        )
    };

    const briefDescription =
        "A decision support system for data-driven water allocation using real-time IoT monitoring and analytics.";

    return (
        <div className={`${cssStyles.page} ${cssStyles.authState}`}>
            <section className={cssStyles.infoPanel}>
                <div className={cssStyles.infoContent}>
                    <div className={cssStyles.logoRow}>
                        <img
                            src="/bulsu-logo.png"
                            alt="BulSU logo"
                            className={cssStyles.sideLogo}
                        />
                        <img
                            src="/agri-logo.png"
                            alt="AgriRise logo"
                            className={cssStyles.logo}
                        />
                        <img
                            src="/cs-logo.png"
                            alt="CS logo"
                            className={cssStyles.sideLogo}
                        />
                    </div>
                    <h1 className={cssStyles.title}>AgriRise</h1>
                    <h2 className={cssStyles.subtitle}>Decision Support System</h2>
                    <p className={cssStyles.description}>{briefDescription}</p>

                    <div className={cssStyles.infoCardsGrid}>
                        <div className={cssStyles.featureCard}>
                            <span className={cssStyles.featureIcon}>🌾</span>
                            <h3 className={cssStyles.featureTitle}>Smart Monitoring</h3>
                            <p className={cssStyles.featureDescription}>
                                Real-time IoT sensor data collection for water levels, temperature, humidity,
                                and rainfall to track agricultural conditions.
                            </p>
                        </div>
                        <div className={cssStyles.featureCard}>
                            <span className={cssStyles.featureIcon}>📊</span>
                            <h3 className={cssStyles.featureTitle}>Data Analytics</h3>
                            <p className={cssStyles.featureDescription}>
                                Advanced algorithms analyze sensor trends and patterns to provide insights for
                                optimal water allocation decisions.
                            </p>
                        </div>
                        <div className={cssStyles.featureCard}>
                            <span className={cssStyles.featureIcon}>💧</span>
                            <h3 className={cssStyles.featureTitle}>Water Optimization</h3>
                            <p className={cssStyles.featureDescription}>
                                Intelligent irrigation scheduling based on data-driven recommendations to
                                maximize efficiency and crop yield.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className={cssStyles.formPanel}>
                <div className={cssStyles.floatingParticles} aria-hidden="true">
                    <span className={`${cssStyles.particle} ${cssStyles.particle1}`} />
                    <span className={`${cssStyles.particle} ${cssStyles.particle2}`} />
                    <span className={`${cssStyles.particle} ${cssStyles.particle3}`} />
                    <span className={`${cssStyles.particle} ${cssStyles.particle4}`} />
                    <span className={`${cssStyles.particle} ${cssStyles.particle5}`} />
                    <span className={`${cssStyles.particle} ${cssStyles.particle6}`} />
                </div>
                <div className={cssStyles.formPanelInner}>
                    <div className={`${cssStyles.authStage} ${cssStyles.authVisible}`}>
                        <div className={cssStyles.loginWelcome}>
                            <p className={cssStyles.loginWelcomeText}>Welcome Back</p>
                            <h2 className={cssStyles.loginWelcomeTitle}>Sign in to continue</h2>
                        </div>

                        <div className={cssStyles.loginFormCard}>
                            <div className={cssStyles.loginHeader}>
                                <h1 className={cssStyles.loginBrand}>Log In</h1>
                            </div>

                            <form className={cssStyles.loginForm}>
                                <TextInput
                                    textProps={{
                                        type: "email",
                                        placeholder: "Email Address",
                                        ...register("email", {
                                            validate: {
                                                mustNotBeEmptyOrSpace,
                                                mustBeValidEmail,
                                            },
                                        }),
                                    }}
                                    error={errors.email?.message}
                                />

                                <TextInput
                                    textProps={{
                                        type: "password",
                                        placeholder: "Password",
                                        ...register("password", {
                                            validate: {
                                                mustNotBeEmptyOrSpace,
                                            },
                                        }),
                                    }}
                                    error={errors.password?.message}
                                />

                                <div className={cssStyles.loginSubmitContainer}>
                                    <Button
                                        type="submit"
                                        title="Sign In"
                                        titleStyle={{ color: isSubmitting ? colors.secondary : colors.primary }}
                                        style={{
                                            margin: 0,
                                            padding: "12px 32px",
                                            backgroundColor: colors.primaryLight,
                                            width: "100%",
                                        }}
                                        onButtonPress={handleSubmit(onSubmit)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

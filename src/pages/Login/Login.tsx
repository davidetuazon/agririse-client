import React from "react";
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
    const { register, handleSubmit, formState: { errors, isSubmitting }} = useForm<Inputs>();

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
                    console.log(e?.response?.status);
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

    return (
        <div style={styles.root}>
            <div style={styles.body} className={cssStyles.loginBody}>
                {/* Hero Section */}
                <section style={styles.hero} className={cssStyles.loginHero}>
                    <div className={cssStyles.heroOverlay}></div>
                    <div className={cssStyles.heroContent}>
                        <h1 className={cssStyles.heroTitle}>AgriRise</h1>
                        <h2 className={cssStyles.heroSubtitle}>Optimization of Water Allocation</h2>
                        <div className={cssStyles.heroCardsContainer}>
                            <div className={cssStyles.heroCard}>
                                <span className={cssStyles.heroCardIcon}>🌾</span>
                                <h3 className={cssStyles.heroCardTitle}>Smart Monitoring</h3>
                                <p className={cssStyles.heroCardDescription}>
                                    Real-time IoT sensor data collection for water levels, temperature, humidity, and rainfall to track agricultural conditions.
                                </p>
                            </div>
                            <div className={cssStyles.heroCard}>
                                <span className={cssStyles.heroCardIcon}>📊</span>
                                <h3 className={cssStyles.heroCardTitle}>Data Analytics</h3>
                                <p className={cssStyles.heroCardDescription}>
                                    Advanced algorithms analyze sensor trends and patterns to provide insights for optimal water allocation decisions.
                                </p>
                            </div>
                            <div className={cssStyles.heroCard}>
                                <span className={cssStyles.heroCardIcon}>💧</span>
                                <h3 className={cssStyles.heroCardTitle}>Water Optimization</h3>
                                <p className={cssStyles.heroCardDescription}>
                                    Intelligent irrigation scheduling based on data-driven recommendations to maximize efficiency and crop yield.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Login Section */}
                <section style={styles.login} className={cssStyles.loginSection}>
                    {/* Decorative floating circles */}
                    <div className={cssStyles.loginDecor}>
                        <div className={cssStyles.loginDecorShape}></div>
                        <div className={cssStyles.loginDecorShape}></div>
                        <div className={cssStyles.loginDecorShape}></div>
                        <div className={cssStyles.loginDecorShape}></div>
                        <div className={cssStyles.loginDecorShape}></div>
                        <div className={cssStyles.loginDecorShape}></div>
                        <div className={cssStyles.loginDecorShape}></div>
                        <div className={cssStyles.loginDecorShape}></div>
                    </div>

                    {/* Welcome text */}
                    <div className={cssStyles.loginWelcome}>
                        <p className={cssStyles.loginWelcomeText}>Welcome Back</p>
                        <h2 className={cssStyles.loginWelcomeTitle}>Sign in to continue</h2>
                    </div>

                    {/* Login form card */}
                    <div className={cssStyles.loginFormCard}>
                        <div className={cssStyles.loginHeader}>
                            <h1 className={cssStyles.loginBrand}>Log In</h1>
                            <p className={cssStyles.loginTitle}>Enter your Credentials</p>
                        </div>
                        <form className={cssStyles.loginForm}>
                            {/* Email */}
                            <TextInput
                                textProps={{
                                    type: 'email',
                                    placeholder: 'Email Address',
                                    ...register('email', {
                                        validate: {
                                            mustNotBeEmptyOrSpace,
                                            mustBeValidEmail,
                                        }
                                    })
                                }}
                                error={errors.email?.message}
                            />

                            {/* Password */}
                            <TextInput
                                textProps={{
                                    type: 'password',
                                    placeholder: 'Password',
                                    ...register('password', {
                                        validate: {
                                            mustNotBeEmptyOrSpace,
                                        }
                                    })
                                }}
                                error={errors.password?.message}
                            />

                            {/* Submit button */}
                            <div className={cssStyles.loginSubmitContainer}>
                                <Button
                                    type="submit"
                                    title="Sign In"
                                    titleStyle={{ color: isSubmitting ? colors.secondary : colors.primary }}
                                    style={{ 
                                        margin: 0,
                                        padding: '12px 32px',
                                        backgroundColor: colors.primaryLight,
                                        width: '100%'
                                    }}
                                    onButtonPress={handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}

const styles: {[key: string]: React.CSSProperties} = {
    root: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        height: '100%',
        minHeight: '100dvh',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100vw',
    },
    body: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        flex: 1,
        overflow: 'auto',
    },
    hero: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        minHeight: '40vh',
        padding: 'clamp(1.5rem, 4vw, 3rem)',
        position: 'relative',
        overflow: 'hidden',
    },
    login: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '60vh',
        backgroundColor: colors.secondary,
        gap: 'clamp(0.5rem, 2vw, 1rem)',
        padding: 'clamp(1rem, 4vw, 2rem)',
        position: 'relative',
        overflow: 'hidden',
    },
}

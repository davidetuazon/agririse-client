import React from "react";
import { useNavigate } from "react-router-dom";
import colors from "../constants/colors";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { mustBeValidEmail, mustNotBeEmptyOrSpace } from "../utils/validators";
import { toast } from "react-hot-toast";
import { login } from "../services/api";
import Cookies from "js-cookie";

import Text from "../components/commons/Text";
import TextInput from "../components/commons/TextInputs";
import Button from "../components/commons/Button";
import { ACCESS_TOKEN } from "../utils/constants";
import "./Login.css";

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
            <div style={styles.body} className="login-body">
                <section style={styles.hero} className="login-hero">
                    <Text variant='heading'>
                        Hero Section
                    </Text>
                </section>
                <section style={styles.login} className="login-section">
                    <div
                        style={{ width: '100%', maxWidth: 'min(400px, 90%)' }}
                    >
                        <Text
                            variant='heading'
                            textStyle={{ color: colors.primary }}
                            style={{ margin: 5 }}
                        >
                            AgriRise
                        </Text>
                        <Text
                            variant='heading'
                            textStyle={{ color: colors.primary, fontFamily: 'Poppins-Light' }}
                            style={{ margin: 5 }}
                        >
                            Log in to your account
                        </Text>
                    </div>
                    <div style={styles.loginForm}>
                        <form>

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
                                error = {errors.email?.message}
                            />

                            {/* Password */}
                            <TextInput
                                style={styles.fields}
                                textProps={{
                                    type: 'password',
                                    placeholder: 'Password',
                                    ...register('password', {
                                        validate: {
                                            mustNotBeEmptyOrSpace,
                                        }
                                    })
                                }}
                                error = {errors.password?.message}
                            />

                            {/* Submit button */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                                <Button
                                    type="submit"
                                    title="Login"
                                    titleStyle={{ color: isSubmitting ? colors.secondary : colors.primary }}
                                    style={{ 
                                        margin: 0,
                                        padding: '10px 15px',
                                        backgroundColor: colors.primaryLight
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
        backgroundColor: colors.primary,
        padding: 'clamp(1.5rem, 4vw, 3rem)',
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
    },
    loginForm: {
        width: '100%',
        maxWidth: 'min(400px, 90%)',
    },
    fields: {
        marginTop: 'clamp(0.75rem, 2vw, 1.25rem)',
    },
}
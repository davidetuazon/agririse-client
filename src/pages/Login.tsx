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
            <div style={styles.body}>
                <section style={styles.hero}>
                    <Text variant='heading'>
                        Hero Section
                    </Text>
                </section>
                <section style={styles.login}>
                    <div
                        style={{ width: '80%', }}
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
        overflow: 'hidden',
    },
    body: {
        display: 'flex',
        flexDirection: 'row',
        width: '100dvw',
        flex: 1,
    },
    hero: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '70%',
        backgroundColor: colors.primary,
    },
    login: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
        backgroundColor: colors.secondary,
        gap: 10,
    },
    loginForm: {
        width: '80%',
    },
    fields: {
        marginTop: 20,
    },
}
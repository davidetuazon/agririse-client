const mustNotBeEmptyOrSpace = (val: string) =>
    val && val.trim() !== '' ? true : 'This field is required';

const mustBeValidEmail = (val: string) =>
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(val)
        ? true
        : 'The email is invalid';

const minLength = (min: number) => (val: string) =>
    val && val.length >= min ? true : `Must be at least ${min} characters`;

const mustBeStrongPassword = (val: string) => {
    if (!val) return 'This field is required';
    
    const hasMinLength = val.length >= 8;
    const hasUpperCase = /[A-Z]/.test(val);
    const hasLowerCase = /[a-z]/.test(val);
    const hasNumbers = /\d/.test(val);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(val);
    
    if (!hasMinLength) {
        return 'Password must be at least 8 characters long';
    }
    
    if (!hasUpperCase) {
        return 'Password must contain at least one uppercase letter';
    }
    
    if (!hasLowerCase) {
        return 'Password must contain at least one lowercase letter';
    }
    
    if (!hasNumbers) {
        return 'Password must contain at least one number';
    }
    
    if (!hasSpecialChar) {
        return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
    }
    
    return true;
};

export {
    mustNotBeEmptyOrSpace,
    mustBeValidEmail,
    minLength,
    mustBeStrongPassword,
}
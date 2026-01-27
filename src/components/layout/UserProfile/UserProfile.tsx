import React from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { UserCircle } from "lucide-react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../../providers/AuthProvider";
import { ACCESS_TOKEN } from "../../../utils/constants";
import colors from "../../../constants/colors";
import Text from "../../commons/Text";
import cssStyles from "./UserProfile.module.css";

export default function UserProfile() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    const roleLabel = user?.role === "admin"
        ? "Admin"
        : user?.role === "superadmin"
        ? "SuperAdmin"
        : "Staff";

    const roleClassName = user?.role === "admin"
        ? cssStyles.roleBadgeAdmin
        : user?.role === "superadmin"
        ? cssStyles.roleBadgeSuperAdmin
        : cssStyles.roleBadgeDefault;

    const handleLogout = () => {
        Cookies.remove(ACCESS_TOKEN);
        setUser(null);
        toast.success("Signed out");
        navigate("/login", { replace: true });
    };

    return (
        <div className={cssStyles.container}>
            <div className={cssStyles.avatar}>
                <UserCircle size={24} color={colors.primary} />
            </div>
            <div className={cssStyles.userDetails}>
                <Text
                    variant="subtitle"
                    style={{ color: colors.primary, margin: 0, lineHeight: 1.2, textAlign: 'center' }}
                >
                    {user?.fullName ?? "User"}
                </Text>
                <span className={`${cssStyles.roleBadge} ${roleClassName}`}>
                    {roleLabel}
                </span>
            </div>
            <button
                type="button"
                className={cssStyles.logoutButton}
                onClick={handleLogout}
                aria-label="Log out"
            >
                <ArrowRightOnRectangleIcon className={cssStyles.logoutIcon} />
            </button>
        </div>
    );
}

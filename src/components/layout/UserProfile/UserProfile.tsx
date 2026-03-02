import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { UserCircle } from "lucide-react";
import { Cog6ToothIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../../providers/AuthProvider";
import { ACCESS_TOKEN } from "../../../utils/constants";
import colors from "../../../constants/colors";
import Text from "../../commons/Text";
import cssStyles from "./UserProfile.module.css";

export default function UserProfile() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
        setDropdownOpen(false);
        Cookies.remove(ACCESS_TOKEN);
        try {
            sessionStorage.removeItem("agririse_optimization_run_id");
        } catch {
            /* ignore */
        }
        setUser(null);
        toast.success("Signed out");
        navigate("/login", { replace: true });
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setDropdownOpen(false);
        };
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [dropdownOpen]);

    return (
        <div className={cssStyles.container} ref={containerRef}>
            <button
                type="button"
                className={cssStyles.trigger}
                onClick={() => setDropdownOpen((o) => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Open account menu"
            >
                <div className={cssStyles.avatar}>
                    <UserCircle size={24} color={colors.primary} />
                </div>
                <div className={cssStyles.userDetails}>
                    <Text
                        variant="subtitle"
                        style={{ color: colors.primary, margin: 0, lineHeight: 1.2 }}
                    >
                        {user?.fullName ?? "User"}
                    </Text>
                    <span className={`${cssStyles.roleBadge} ${roleClassName}`}>
                        {roleLabel}
                    </span>
                </div>
            </button>

            {dropdownOpen && (
                <div className={cssStyles.dropdown} role="menu">
                    <Link
                        to="/settings"
                        className={cssStyles.dropdownItem}
                        onClick={() => setDropdownOpen(false)}
                        role="menuitem"
                    >
                        <Cog6ToothIcon className={cssStyles.dropdownIcon} />
                        Settings
                    </Link>
                    <button
                        type="button"
                        className={cssStyles.dropdownItem}
                        onClick={handleLogout}
                        role="menuitem"
                    >
                        <ArrowRightOnRectangleIcon className={cssStyles.dropdownIcon} />
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}

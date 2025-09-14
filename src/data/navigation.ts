import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  FileText,
  Package,
  ShoppingCart,
  Bell,
  HelpCircle,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: any;
  badge?: string | number;
  children?: NavigationItem[];
}

export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    title: "Permisionarios",
    href: "/dashboard/permisionarios",
    icon: ShoppingCart, // Assuming "ShoppingCart
  },
  {
    title: "LTR",
    href: "/dashboard/ltr",
    icon: "truck",
  },
  {
    title: "Asignación",
    href: "/dashboard/asignacion",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Login",
    href: "/",
    icon: HelpCircle,
  },
];

export const userMenuItems = [
  {
    title: "Profile",
    href: "/dashboard/profile",
  },
  {
    title: "Account Settings",
    href: "/dashboard/account",
  },
  {
    title: "Logout",
    href: "/logout",
  },
];
